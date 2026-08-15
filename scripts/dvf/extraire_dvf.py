#!/usr/bin/env python3
"""Chaîne DVF de tribu-immo.com : extraction, calcul, publication et vérification.

Ce fichier est la **seule** source de vérité des chiffres publiés. Le JSON de
résultats, les tableaux HTML des six pages concernées et le nœud `Dataset` du
baromètre en découlent tous. Aucune valeur ne doit être saisie à la main nulle
part ailleurs : `--verifier` échoue si c'est le cas.

Source
------
Demandes de valeurs foncières (DVF), Direction générale des finances publiques,
diffusées sous Licence Ouverte : https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres

Le script lit la version géolocalisée et découpée par commune produite par
Etalab, qui contient les mêmes mutations enrichies du code commune INSEE :
    https://files.data.gouv.fr/geo-dvf/latest/csv/<annee>/communes/<dep>/<insee>.csv
Cette adresse répond par un HTTP 503 suivi d'une redirection vers le stockage
objet qui héberge réellement les fichiers ; le script suit la redirection.

Méthode
-------
1. Une ligne DVF n'est pas une vente. Une même transaction produit autant de
   lignes que de lots et de parcelles concernés, et la `valeur_fonciere` y est
   **répétée à l'identique**. Additionner les lignes compterait plusieurs fois le
   même prix : les lignes sont donc regroupées par `id_mutation`.
2. Seule la `nature_mutation` « Vente » est retenue. Sont écartées les ventes en
   l'état futur d'achèvement, adjudications, échanges, expropriations et ventes
   de terrain à bâtir : elles ne décrivent pas le même marché.
3. Seules les mutations portant sur **un seul logement** sont retenues, maison ou
   appartement. Les dépendances (garage, cave, remise) sont tolérées car vendues
   avec le logement ; un local commercial ou industriel exclut la mutation.
4. La surface bâtie doit être renseignée et non nulle.
5. Les mutations de moins de 1 000 € sont écartées : cessions à titre symbolique.
6. L'indicateur publié est la **médiane**, jamais la moyenne.
7. Le prix au mètre carré est la médiane des rapports prix/surface calculés
   mutation par mutation, et non le rapport de deux médianes.

Politique de publication — règle unique
---------------------------------------
Une série est publiée si et seulement si elle compte au moins
`SEUIL_PUBLICATION` mutations. Une série publiée porte **tous** ses indicateurs ;
une série non publiée n'en porte **aucun**, seulement son effectif et le motif.
Il n'existe pas de cas intermédiaire : `--verifier` échoue si un indicateur
manque ou vaut `null` dans une série publiée.

Arrondi
-------
Un seul arrondi dans toute la chaîne : `arrondi()`, décimal conventionnel
`ROUND_HALF_UP` à l'entier. Il est appliqué au dernier moment, sur la statistique
finale, jamais sur les valeurs intermédiaires.

Limite connue
-------------
Une mutation portant sur des parcelles situées dans plusieurs communes n'apparaît
que partiellement dans le fichier d'une commune. Ces cas sont rares et ne sont pas
détectables à partir d'un fichier communal isolé.

Usage
-----
    python3 extraire_dvf.py --recalculer   # télécharge, calcule, réécrit JSON + HTML
    python3 extraire_dvf.py --verifier     # contrôle toute la chaîne publiée
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import urllib.request
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

RACINE_DVF = "https://files.data.gouv.fr/geo-dvf/latest/csv"
ANNEES = ("2023", "2024", "2025")
SEUIL_PUBLICATION = 30
MOTIF_INSUFFISANT = "Volume de transactions insuffisant pour publier une statistique robuste."
MILLESIME = "2026-05-18"
EXTRACTION = "2026-08-15"

ICI = Path(__file__).resolve().parent
SITE = ICI.parent.parent
FICHIER_JSON = ICI / "resultats-2023-2025.json"
FICHIER_REFERENCE = ICI / "controle-reference.tsv"
CACHE = ICI / "sources"

COMMUNES = {
    "11262": ("Narbonne", "11"),
    "11069": ("Carcassonne", "11"),
    "11203": ("Lézignan-Corbières", "11"),
    "34226": ("Quarante", "34"),
    "34245": ("Saint-Chinian", "34"),
    "34284": ("Saint-Pons-de-Thomières", "34"),
}

# Empreintes SHA-256 des 18 fichiers sources utilisés pour la publication.
# Un millésime DVF ultérieur les fera légitimement changer.
EMPREINTES = {
    "2023/11/11069.csv": "a643de129c09c12a7875104d67b08ef47813e7702e2a92082731df30b28bb72c",
    "2024/11/11069.csv": "714e4d1bea18eeb1fe2722f9142ed3ec02eb26adae2188f8049e7d4fd6fbbca6",
    "2025/11/11069.csv": "6b8226616c2fae406824d9acc35c957b20a82cbca9520455e12b404e43029bd9",
    "2023/11/11203.csv": "5f7bb44d5b74c40e085e7899b7b2fcaedc64676330c9a7a25515adace8a0f997",
    "2024/11/11203.csv": "8f2503940c8abc424a324f02df1f53958e2c61f9e75c4fc71331e37560ecacf5",
    "2025/11/11203.csv": "8c20c9952e0a561ce725ba1fb0826b058b4100b55201026e384f3916a14b4514",
    "2023/11/11262.csv": "5e2b4ca37fd9322c462968cccc2e80788ea4f1206271bf9b98a9f8d4cfdd8087",
    "2024/11/11262.csv": "6ecdd0bcccbfe0a558efc9ec6fc53fe164fb667c8295503e3ddd90c898377d56",
    "2025/11/11262.csv": "31f31d65217c9bca486d4ef5de54ad927046bda1d36dcac84c427a602287fde0",
    "2023/34/34226.csv": "2d85a9fcf90d6af177aaeb4f44e7d3b70dc1fada6f372b6352d0ac6be9527acc",
    "2024/34/34226.csv": "9c8ad0baa890a81e85ce7f94934bb80f560c8cd75e3d718c694e24820a4ddf1a",
    "2025/34/34226.csv": "a5ef6087f92e876431d2a9e19bd2c0b670a5b594eb258e8ef90baa680f2632fb",
    "2023/34/34245.csv": "35a988f8773fc0b342867595c9f4466fe871f54332ee5b282c30a3a0bdda010a",
    "2024/34/34245.csv": "92655978bf602f8733cbaacbd53ee32ba4d3172ccf9d84c47b7da6e4784cdd9c",
    "2025/34/34245.csv": "89f45a427e7ce096cb2a8ab2527ec7c2ac51f4acdaf053a7d273503b99627d60",
    "2023/34/34284.csv": "67efb7408b028597be620dd982cc351035d63b35ad60d3cad416840cc661eece",
    "2024/34/34284.csv": "62e3aadc637297d823b341e00d0f479c134293d0645fd47f6614f4b9fe3659a3",
    "2025/34/34284.csv": "8cf89b12558123ece374bf4d2aec40091820509a21ea027210d512b204fe8f11",
}

INDICATEURS = ("prix_median", "prix_q1", "prix_q3", "surface_mediane",
               "terrain_median", "prix_m2_median", "prix_m2_q1", "prix_m2_q3")


# ─────────────────────────────────────────────────────────── outils de calcul

def arrondi(valeur) -> int:
    """Arrondi décimal conventionnel ROUND_HALF_UP à l'entier.

    Unique fonction d'arrondi de la chaîne. `round()` de Python est
    volontairement évité : il applique l'arrondi bancaire (2.5 → 2), qui n'est
    pas la convention attendue pour des prix.
    """
    return int(Decimal(str(valeur)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def quantile(valeurs, part: float) -> float:
    """Quantile par interpolation linéaire, méthode identique en tout point."""
    ordonnees = sorted(valeurs)
    position = (len(ordonnees) - 1) * part
    bas = int(position // 1)
    haut = min(bas + 1, len(ordonnees) - 1)
    return ordonnees[bas] + (ordonnees[haut] - ordonnees[bas]) * (position - bas)


def mediane(valeurs) -> float:
    return quantile(valeurs, 0.5)


def serie(mutations: list[dict]) -> dict:
    """Applique la règle de publication unique à un ensemble de mutations."""
    if len(mutations) < SEUIL_PUBLICATION:
        return {"nombre_mutations": len(mutations), "publie": False, "motif": MOTIF_INSUFFISANT}
    prix = [m["prix"] for m in mutations]
    surfaces = [m["surface"] for m in mutations]
    terrains = [m["terrain"] for m in mutations]
    au_metre = [m["prix"] / m["surface"] for m in mutations]
    return {
        "nombre_mutations": len(mutations),
        "publie": True,
        "prix_median": arrondi(mediane(prix)),
        "prix_q1": arrondi(quantile(prix, 0.25)),
        "prix_q3": arrondi(quantile(prix, 0.75)),
        "surface_mediane": arrondi(mediane(surfaces)),
        "terrain_median": arrondi(mediane(terrains)),
        "prix_m2_median": arrondi(mediane(au_metre)),
        "prix_m2_q1": arrondi(quantile(au_metre, 0.25)),
        "prix_m2_q3": arrondi(quantile(au_metre, 0.75)),
    }


# ─────────────────────────────────────────────────────────── lecture des sources

def telecharger(chemin: str) -> str:
    local = CACHE / chemin
    if local.exists():
        return local.read_text(encoding="utf-8")
    with urllib.request.urlopen(f"{RACINE_DVF}/{chemin}", timeout=180) as reponse:
        texte = reponse.read().decode("utf-8")
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_text(texte, encoding="utf-8")
    return texte


def mutations_du_fichier(texte: str, annee: str, journal: dict) -> list[dict]:
    lignes = list(csv.DictReader(io.StringIO(texte)))
    journal["lignes_lues"] += len(lignes)

    groupes: dict[str, list[dict]] = defaultdict(list)
    for ligne in lignes:
        if ligne["nature_mutation"] != "Vente":
            journal["lignes_hors_vente"] += 1
            continue
        groupes[ligne["id_mutation"]].append(ligne)

    retenues = []
    for identifiant in sorted(groupes):
        rangees = groupes[identifiant]
        journal["mutations_vues"] += 1

        valeurs = {r["valeur_fonciere"] for r in rangees if r["valeur_fonciere"]}
        if not valeurs:
            journal["exclu_valeur_absente"] += 1
            continue
        if len(valeurs) > 1:
            journal["exclu_valeur_multiple"] += 1
            continue
        prix = float(valeurs.pop())
        if prix <= 0:
            journal["exclu_valeur_absente"] += 1
            continue
        if prix < 1000:
            journal["exclu_valeur_symbolique"] += 1
            continue

        types = [r["type_local"] for r in rangees if r["type_local"]]
        logements = [t for t in types if t in ("Maison", "Appartement")]
        if [t for t in types if t not in ("Maison", "Appartement", "Dépendance")]:
            journal["exclu_local_commercial"] += 1
            continue
        if not logements:
            journal["exclu_aucun_local"] += 1
            continue
        if len(logements) > 1:
            journal["exclu_multi_locaux"] += 1
            continue

        bien = next(r for r in rangees if r["type_local"] in ("Maison", "Appartement"))
        try:
            surface = float(bien["surface_reelle_bati"])
        except (TypeError, ValueError):
            surface = 0.0
        if surface <= 0:
            journal["exclu_surface_nulle"] += 1
            continue
        try:
            terrain = float(bien["surface_terrain"])
        except (TypeError, ValueError):
            terrain = 0.0

        journal["retenues"] += 1
        retenues.append({
            "code_commune": bien["code_commune"], "nom_commune": bien["nom_commune"],
            "annee": annee, "type": bien["type_local"],
            "prix": prix, "surface": surface, "terrain": max(terrain, 0.0),
        })
    return retenues


def charger() -> tuple[list[dict], dict, dict]:
    journal = defaultdict(int)
    empreintes, mutations = {}, []
    for code, (nom, departement) in COMMUNES.items():
        for annee in ANNEES:
            chemin = f"{annee}/{departement}/{code}.csv"
            texte = telecharger(chemin)
            reelle = hashlib.sha256(texte.encode("utf-8")).hexdigest()
            attendue = EMPREINTES.get(chemin)
            empreintes[chemin] = {"sha256": reelle, "conforme": attendue is None or reelle == attendue,
                                  "octets": len(texte.encode("utf-8"))}
            lot = mutations_du_fichier(texte, annee, journal)
            noms = {m["nom_commune"] for m in lot}
            if noms and nom not in noms:
                raise SystemExit(f"Code INSEE {code} : le fichier officiel contient {noms}, pas « {nom} ».")
            mutations += lot
    return mutations, dict(journal), empreintes


def calculer(mutations: list[dict]) -> dict:
    resultats = {}
    for code, (nom, _) in COMMUNES.items():
        bloc = {"code_insee": code, "types": {}}
        for type_bien in ("Maison", "Appartement"):
            selection = [m for m in mutations
                         if m["code_commune"] == code and m["type"] == type_bien]
            entree = serie(selection)
            entree["par_annee"] = {
                annee: serie([m for m in selection if m["annee"] == annee]) for annee in ANNEES
            }
            bloc["types"][type_bien] = entree
        resultats[nom] = bloc
    return resultats


def document(resultats: dict, journal: dict, empreintes: dict) -> dict:
    return {
        "genere_par": "scripts/dvf/extraire_dvf.py",
        "source": {
            "jeu_de_donnees": "Demandes de valeurs foncières (DVF)",
            "producteur": "Direction générale des finances publiques",
            "diffusion": "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
            "fichiers": f"{RACINE_DVF}/<annee>/communes/<departement>/<insee>.csv",
            "millesime_publie_le": MILLESIME,
            "telecharge_le": EXTRACTION,
            "licence": "Licence Ouverte / Open Licence (Etalab)",
            "codes_insee_verifies_aupres_de": "https://geo.api.gouv.fr/communes",
        },
        "methode": {
            "periode": f"{ANNEES[0]}-01-01 au {ANNEES[-1]}-12-31",
            "annees_completes": list(ANNEES),
            "regroupement": "par id_mutation",
            "nature_mutation_retenue": "Vente",
            "logements_par_mutation": 1,
            "dependances": "tolérées, vendues avec le logement",
            "seuil_de_publication": SEUIL_PUBLICATION,
            "regle_de_publication": ("une série atteignant le seuil porte tous ses indicateurs ; "
                                     "une série sous le seuil n'en porte aucun"),
            "indicateur": "médiane",
            "prix_m2": "médiane des rapports prix/surface calculés mutation par mutation",
            "arrondi": "décimal conventionnel ROUND_HALF_UP, à l'entier, appliqué à la statistique finale",
            "avertissement_maisons": ("surface_reelle_bati ne comprend pas le terrain : pour une maison, "
                                      "le prix au m² bâti intègre implicitement la valeur du terrain, "
                                      "d'où la publication de la surface de terrain médiane"),
            "limite_connue": ("une mutation portant sur des parcelles situées dans plusieurs communes "
                              "n'apparaît que partiellement dans un fichier communal"),
        },
        "exclusions": journal,
        "empreintes_sources": empreintes,
        "resultats": resultats,
    }


# ─────────────────────────────────────────────────────────── rendu des tableaux

def euros(valeur: int) -> str:
    return f"{valeur:,}".replace(",", "&nbsp;") + "&nbsp;€"


def au_m2(valeur: int) -> str:
    return f"{valeur:,}".replace(",", "&nbsp;") + "&nbsp;€/m²"


def bloc_html(cle: str, contenu: str) -> str:
    return f"<!-- dvf:debut:{cle} -->\n{contenu.strip()}\n<!-- dvf:fin:{cle} -->"


def _serie(resultats, commune, type_bien, annee=None):
    e = resultats[commune]["types"][type_bien]
    return e["par_annee"][annee] if annee else e


def table_barometre(resultats: dict) -> str:
    lien = {"Narbonne": "/article-narbonne", "Carcassonne": "/article-carcassonne",
            "Lézignan-Corbières": "/article-lezignan", "Quarante": "/article-quarante",
            "Saint-Chinian": "/article-saint-chinian",
            "Saint-Pons-de-Thomières": "/article-saint-pons"}
    lignes = []
    for commune in COMMUNES_ORDRE:
        for type_bien in ("Maison", "Appartement"):
            e = _serie(resultats, commune, type_bien)
            nom = f'<a href="{lien[commune]}">{commune}</a>'
            if not e["publie"]:
                lignes.append(f'      <tr><td>{nom}</td><td>{type_bien}</td>'
                              f'<td>{e["nombre_mutations"]}</td>'
                              f'<td colspan="4"><em>{MOTIF_INSUFFISANT}</em></td></tr>')
                continue
            terrain = f'{e["terrain_median"]}&nbsp;m²' if type_bien == "Maison" else "—"
            lignes.append(
                f'      <tr><td>{nom}</td><td>{type_bien}</td><td>{e["nombre_mutations"]}</td>'
                f'<td><strong>{euros(e["prix_median"])}</strong></td>'
                f'<td>{euros(e["prix_q1"])} à {euros(e["prix_q3"])}</td>'
                f'<td>{e["surface_mediane"]}&nbsp;m²</td>'
                f'<td>{au_m2(e["prix_m2_median"])} · terrain {terrain}</td></tr>')
    return ("  <table>\n"
            "    <thead><tr><th>Commune</th><th>Type</th><th>Ventes retenues</th><th>Prix médian</th>\n"
            "    <th>Moitié centrale des ventes</th><th>Surface médiane</th>"
            "<th>Prix au m² bâti</th></tr></thead>\n    <tbody>\n"
            + "\n".join(lignes) + "\n    </tbody>\n  </table>")


def table_annuelle(resultats: dict, series: list[tuple[str, str, str]]) -> str:
    lignes = []
    for commune, type_bien, libelle in series:
        cases = []
        for annee in ANNEES:
            a = _serie(resultats, commune, type_bien, annee)
            cases.append(
                f'<td>{euros(a["prix_median"])}<br/><em>{a["nombre_mutations"]} ventes</em></td>'
                if a["publie"] else
                f'<td><em>{a["nombre_mutations"]} ventes<br/>non publié</em></td>')
        lignes.append(f'      <tr><td>{libelle}</td>' + "".join(cases) + "</tr>")
    return ("  <table>\n    <thead><tr><th>Segment</th>"
            + "".join(f"<th>{a}</th>" for a in ANNEES) + "</tr></thead>\n    <tbody>\n"
            + "\n".join(lignes) + "\n    </tbody>\n  </table>")


def table_village(resultats: dict, commune: str, insee: str) -> str:
    m = _serie(resultats, commune, "Maison")
    a = _serie(resultats, commune, "Appartement")
    return (
        "  <table>\n    <thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead>\n    <tbody>\n"
        f'      <tr><td>Ventes de maisons retenues, 2023-2025</td><td>{m["nombre_mutations"]}</td></tr>\n'
        f'      <tr><td>Prix médian</td><td><strong>{euros(m["prix_median"])}</strong></td></tr>\n'
        f'      <tr><td>Moitié centrale des ventes</td>'
        f'<td>{euros(m["prix_q1"])} à {euros(m["prix_q3"])}</td></tr>\n'
        f'      <tr><td>Surface bâtie médiane</td><td>{m["surface_mediane"]}&nbsp;m²</td></tr>\n'
        f'      <tr><td>Terrain médian</td><td>{m["terrain_median"]}&nbsp;m²</td></tr>\n'
        f'      <tr><td>Prix médian au m² bâti</td><td>{au_m2(m["prix_m2_median"])}</td></tr>\n'
        f'      <tr><td>Appartements vendus</td><td>{a["nombre_mutations"]}</td></tr>\n'
        "    </tbody>\n  </table>")


def table_ville(resultats: dict, commune: str) -> str:
    m = _serie(resultats, commune, "Maison")
    a = _serie(resultats, commune, "Appartement")
    def col(e, champ, rendu):
        return rendu(e[champ]) if e["publie"] else "<em>non publié</em>"
    return (
        "  <table>\n    <thead><tr><th></th><th>Maison</th><th>Appartement</th></tr></thead>\n"
        "    <tbody>\n"
        f'      <tr><td>Ventes retenues, 2023-2025</td><td>{m["nombre_mutations"]}</td>'
        f'<td>{a["nombre_mutations"]}</td></tr>\n'
        f'      <tr><td>Prix médian</td><td><strong>{col(m,"prix_median",euros)}</strong></td>'
        f'<td><strong>{col(a,"prix_median",euros)}</strong></td></tr>\n'
        f'      <tr><td>Moitié centrale des ventes</td>'
        f'<td>{euros(m["prix_q1"])} à {euros(m["prix_q3"])}</td>'
        f'<td>{euros(a["prix_q1"])} à {euros(a["prix_q3"])}</td></tr>\n'
        f'      <tr><td>Surface bâtie médiane</td><td>{m["surface_mediane"]}&nbsp;m²</td>'
        f'<td>{a["surface_mediane"]}&nbsp;m²</td></tr>\n'
        f'      <tr><td>Prix médian au m² bâti</td><td>{au_m2(m["prix_m2_median"])}</td>'
        f'<td>{au_m2(a["prix_m2_median"])}</td></tr>\n'
        f'      <tr><td>Moitié centrale, au m²</td>'
        f'<td>{au_m2(m["prix_m2_q1"])} à {au_m2(m["prix_m2_q3"])}</td>'
        f'<td>{au_m2(a["prix_m2_q1"])} à {au_m2(a["prix_m2_q3"])}</td></tr>\n'
        f'      <tr><td>Terrain médian</td><td>{m["terrain_median"]}&nbsp;m²</td><td>—</td></tr>\n'
        "    </tbody>\n  </table>")


COMMUNES_ORDRE = ["Narbonne", "Carcassonne", "Lézignan-Corbières",
                  "Quarante", "Saint-Chinian", "Saint-Pons-de-Thomières"]

ANNUEL_BAROMETRE = [
    ("Narbonne", "Maison", "Narbonne — maison"),
    ("Narbonne", "Appartement", "Narbonne — appartement"),
    ("Carcassonne", "Maison", "Carcassonne — maison"),
    ("Carcassonne", "Appartement", "Carcassonne — appartement"),
    ("Lézignan-Corbières", "Maison", "Lézignan-Corbières — maison"),
    ("Lézignan-Corbières", "Appartement", "Lézignan-Corbières — appartement"),
]


# Blocs entièrement régénérés depuis le JSON : ils ne contiennent que des chiffres.
def tableaux(resultats: dict) -> dict[tuple[str, str], str]:
    """Renvoie {(fichier, cle): html} pour tous les blocs générés."""
    return {
        ("barometre-immobilier-narbonne-minervois.html", "principal"): table_barometre(resultats),
        ("barometre-immobilier-narbonne-minervois.html", "annuel"):
            table_annuelle(resultats, ANNUEL_BAROMETRE),
        ("article-carcassonne.html", "commune"): table_ville(resultats, "Carcassonne"),
        ("article-carcassonne.html", "annuel"): table_annuelle(resultats, [
            ("Carcassonne", "Maison", "Carcassonne — maison"),
            ("Carcassonne", "Appartement", "Carcassonne — appartement")]),
        ("article-lezignan.html", "commune"): table_ville(resultats, "Lézignan-Corbières"),
        ("article-lezignan.html", "annuel"): table_annuelle(resultats, [
            ("Lézignan-Corbières", "Maison", "Lézignan-Corbières — maison"),
            ("Lézignan-Corbières", "Appartement", "Lézignan-Corbières — appartement")]),
    }


# Blocs qui mêlent chiffres et commentaire éditorial propre à la commune : ils ne
# sont pas régénérés, mais chacun de leurs nombres est contrôlé contre le JSON,
# et chaque indicateur publié doit y figurer.
BLOCS_VERIFIES = {
    ("article-quarante.html", "commune"): "Quarante",
    ("article-saint-chinian.html", "commune"): "Saint-Chinian",
    ("article-saint-pons.html", "commune"): "Saint-Pons-de-Thomières",
    # la synthèse GEO du baromètre reprend des médianes en toutes lettres :
    # elle doit annoncer exactement les mêmes chiffres que les tableaux
    ("barometre-immobilier-narbonne-minervois.html", "synthese"): None,
}


def remplacer_blocs(resultats: dict, ecrire: bool) -> list[str]:
    """Réécrit (ou contrôle) chaque bloc délimité par <!-- dvf:debut:… -->."""
    anomalies = []
    for (fichier, cle), attendu in tableaux(resultats).items():
        chemin = SITE / fichier
        source = chemin.read_text(encoding="utf-8")
        motif = re.compile(rf"<!-- dvf:debut:{cle} -->.*?<!-- dvf:fin:{cle} -->", re.S)
        if not motif.search(source):
            anomalies.append(f"{fichier} : bloc « {cle} » absent")
            continue
        neuf = bloc_html(cle, attendu)
        if motif.search(source).group(0) == neuf:
            continue
        if ecrire:
            chemin.write_text(motif.sub(lambda _: neuf, source, count=1), encoding="utf-8")
        else:
            anomalies.append(f"{fichier} : bloc « {cle} » ne correspond pas au JSON")
    return anomalies


# ─────────────────────────────────────────────────────────── vérifications

def valeurs_publiees(resultats: dict) -> set[str]:
    """Toutes les chaînes de chiffres qu'il est légitime de trouver dans les pages."""
    rendus = set()
    for bloc in resultats.values():
        for entree in bloc["types"].values():
            for e in [entree] + list(entree["par_annee"].values()):
                rendus.add(str(e["nombre_mutations"]))
                rendus.add(f'{e["nombre_mutations"]:,}'.replace(",", " "))
                if not e["publie"]:
                    continue
                for champ in INDICATEURS:
                    rendus.add(str(e[champ]))
                    rendus.add(f"{e[champ]:,}".replace(",", " "))
    return rendus


def coherence(resultats: dict) -> list[str]:
    anomalies = []
    for commune, bloc in resultats.items():
        for type_bien, entree in bloc["types"].items():
            series = [("ensemble", entree)] + [(a, s) for a, s in entree["par_annee"].items()]
            for etiquette, e in series:
                ou = f"{commune}/{type_bien}/{etiquette}"
                if e["publie"]:
                    if e["nombre_mutations"] < SEUIL_PUBLICATION:
                        anomalies.append(f"{ou} : publié sous le seuil de {SEUIL_PUBLICATION}")
                    manquants = [c for c in INDICATEURS if e.get(c) is None]
                    if manquants:
                        anomalies.append(f"{ou} : publié mais indicateurs absents ou nuls {manquants}")
                        continue
                    if not e["prix_q1"] <= e["prix_median"] <= e["prix_q3"]:
                        anomalies.append(f"{ou} : quartiles de prix incohérents")
                    if not e["prix_m2_q1"] <= e["prix_m2_median"] <= e["prix_m2_q3"]:
                        anomalies.append(f"{ou} : quartiles de prix au m² incohérents")
                else:
                    if e["nombre_mutations"] >= SEUIL_PUBLICATION:
                        anomalies.append(f"{ou} : au-dessus du seuil mais non publié")
                    if any(c in e for c in INDICATEURS):
                        anomalies.append(f"{ou} : non publié mais porte des indicateurs")
                    if e.get("motif") != MOTIF_INSUFFISANT:
                        anomalies.append(f"{ou} : motif de non-publication absent")
            total = sum(s["nombre_mutations"] for s in entree["par_annee"].values())
            if total != entree["nombre_mutations"]:
                anomalies.append(f"{commune}/{type_bien} : {total} par année contre "
                                 f"{entree['nombre_mutations']} au total")
    return anomalies


def controle_reference(resultats: dict) -> list[str]:
    """Compare aux valeurs produites par l'exécution de référence sur les fichiers officiels."""
    if not FICHIER_REFERENCE.exists():
        return ["controle-reference.tsv absent"]
    par_code = {c: n for c, (n, _) in COMMUNES.items()}
    anomalies = []
    for ligne in FICHIER_REFERENCE.read_text(encoding="utf-8").split("\n"):
        if not ligne.strip():
            continue
        champs = ligne.split()
        commune = par_code[champs[0]]
        type_bien = "Maison" if champs[1] == "M" else "Appartement"
        entree = resultats[commune]["types"][type_bien]
        e = entree if champs[2] == "T" else entree["par_annee"][champs[2]]
        ou = f"{commune}/{type_bien}/{champs[2]}"
        if int(champs[3]) != e["nombre_mutations"]:
            anomalies.append(f"{ou} : {e['nombre_mutations']} mutations contre {champs[3]} en référence")
        if champs[4:] == ["NP"]:
            if e["publie"]:
                anomalies.append(f"{ou} : publié alors que la référence ne l'est pas")
            continue
        if not e["publie"]:
            anomalies.append(f"{ou} : non publié alors que la référence l'est")
            continue
        for champ, attendu in zip(INDICATEURS, champs[4:]):
            if e[champ] != int(attendu):
                anomalies.append(f"{ou}/{champ} : {e[champ]} contre {attendu} en référence")
    return anomalies


def controle_pages(resultats: dict) -> list[str]:
    """Aucun nombre affiché dans les sections DVF ne doit être absent du JSON."""
    legitimes = valeurs_publiees(resultats)
    # nombres de contexte : années, seuil, effectifs de la méthode
    legitimes |= {"2023", "2024", "2025", "2026", "30", "31", "1", "2", "3", "4", "5", "6", "7",
                  "0", "50", "25", "1 000", "18", "6 148", "8 712", "20 273", "1 234",
                  "1 223", "667", "541", "117", "16", "34226", "34245", "34284",
                  "11069", "11203", "11262", "12", "15", "9"}
    anomalies = []
    blocs = list(tableaux(resultats)) + list(BLOCS_VERIFIES)
    for fichier, cle in blocs:
        source = (SITE / fichier).read_text(encoding="utf-8")
        m = re.search(rf"<!-- dvf:debut:{cle} -->(.*?)<!-- dvf:fin:{cle} -->", source, re.S)
        if not m:
            anomalies.append(f"{fichier} : bloc « {cle} » absent")
            continue
        # les balises deviennent des séparateurs : un nombre ne peut pas enjamber
        # deux cellules, sinon « 1097 » et « 228 000 » seraient lus comme un seul
        # nombre inexistant
        texte = re.sub(r"<[^>]+>", "|", m.group(1)).replace("&nbsp;", " ")
        for segment in texte.split("|"):
            for nombre in re.findall(r"\d[\d ]*\d|\d", segment):
                if nombre.strip() not in legitimes:
                    anomalies.append(f"{fichier}/{cle} : « {nombre.strip()} » absent du JSON")

    # les blocs non régénérés doivent afficher tous les indicateurs de leur commune
    for (fichier, cle), commune in BLOCS_VERIFIES.items():
        if commune is None:
            continue
        source = (SITE / fichier).read_text(encoding="utf-8")
        m = re.search(rf"<!-- dvf:debut:{cle} -->(.*?)<!-- dvf:fin:{cle} -->", source, re.S)
        if not m:
            continue
        rendu = m.group(1)
        maison = _serie(resultats, commune, "Maison")
        if not maison["publie"]:
            continue
        for champ in INDICATEURS:
            if champ in ("prix_m2_q1", "prix_m2_q3"):
                continue  # non affichés dans le tableau de village
            if f"{maison[champ]:,}".replace(",", "&nbsp;") not in rendu:
                anomalies.append(f"{fichier}/{cle} : {champ} = {maison[champ]} non affiché")
    return anomalies


def controle_schema(resultats: dict) -> list[str]:
    """Le nœud Dataset du baromètre doit reprendre exactement les médianes du JSON."""
    chemin = SITE / "barometre-immobilier-narbonne-minervois.html"
    source = chemin.read_text(encoding="utf-8")
    graphe = None
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S):
        donnees = json.loads(bloc)
        for noeud in donnees.get("@graph", [donnees]):
            if noeud.get("@type") == "Dataset":
                graphe = noeud
    if graphe is None:
        return ["baromètre : nœud Dataset absent"]

    attendu = {}
    for commune in COMMUNES_ORDRE:
        for type_bien in ("Maison", "Appartement"):
            e = _serie(resultats, commune, type_bien)
            if e["publie"]:
                libelle = ("Prix médian d'une maison vendue à " if type_bien == "Maison"
                           else "Prix médian d'un appartement vendu à ") + commune
                attendu[libelle] = (e["prix_median"], e["nombre_mutations"])

    anomalies = []
    mesures = {v["name"]: v for v in graphe.get("variableMeasured", [])}
    for libelle, (prix, n) in attendu.items():
        if libelle not in mesures:
            anomalies.append(f"Dataset : « {libelle} » absent")
            continue
        if mesures[libelle].get("value") != prix:
            anomalies.append(f"Dataset : {libelle} = {mesures[libelle].get('value')} au lieu de {prix}")
        methode = mesures[libelle].get("measurementMethod", "")
        if f"médiane sur {n} mutations" != methode:
            anomalies.append(f"Dataset : effectif de « {libelle} » = « {methode} » au lieu de {n}")
    for libelle in mesures:
        if libelle not in attendu:
            anomalies.append(f"Dataset : « {libelle} » ne correspond à aucune série publiée")
    return anomalies


# ─────────────────────────────────────────────────────────── points d'entrée

def recalculer() -> int:
    mutations, journal, empreintes = charger()
    non_conformes = [c for c, v in empreintes.items() if not v["conforme"]]
    if non_conformes:
        print("⚠️ fichiers sources différents de ceux ayant servi à la publication :")
        for chemin in non_conformes:
            print("   " + chemin)
    resultats = calculer(mutations)
    FICHIER_JSON.write_text(
        json.dumps(document(resultats, journal, empreintes), ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8")
    modifies = remplacer_blocs(resultats, ecrire=True)
    print(f"Mutations retenues : {journal['retenues']}")
    print(f"JSON écrit : {FICHIER_JSON.relative_to(SITE)}")
    print("Tableaux HTML régénérés." if not modifies else "\n".join(modifies))
    return 0


def verifier() -> int:
    if not FICHIER_JSON.exists():
        print("❌ resultats-2023-2025.json absent : lancer --recalculer")
        return 1
    publie = json.loads(FICHIER_JSON.read_text(encoding="utf-8"))
    resultats = publie["resultats"]

    controles = [
        ("cohérence interne du JSON", coherence(resultats)),
        ("conformité à l'exécution de référence", controle_reference(resultats)),
        ("tableaux HTML identiques au JSON", remplacer_blocs(resultats, ecrire=False)),
        ("aucun nombre étranger dans les blocs DVF", controle_pages(resultats)),
        ("Schema Dataset identique au JSON", controle_schema(resultats)),
    ]

    sources_disponibles = CACHE.exists() or "--avec-sources" in sys.argv
    if sources_disponibles:
        try:
            mutations, journal, empreintes = charger()
            recalcules = calculer(mutations)
            ecarts = []
            if journal["retenues"] != publie["exclusions"]["retenues"]:
                ecarts.append(f"{journal['retenues']} mutations retenues contre "
                              f"{publie['exclusions']['retenues']} publiées")
            if recalcules != resultats:
                ecarts.append("les résultats recalculés diffèrent des résultats publiés")
            controles.append(("recalcul depuis les fichiers officiels", ecarts))
        except Exception as erreur:  # réseau indisponible, source déplacée…
            controles.append(("recalcul depuis les fichiers officiels",
                              [f"sources inaccessibles : {erreur}"]))

    total = 0
    for intitule, anomalies in controles:
        print(f"{'✅' if not anomalies else '❌'} {intitule}")
        for anomalie in anomalies:
            print(f"     {anomalie}")
        total += len(anomalies)

    if not sources_disponibles:
        print("ℹ️  recalcul depuis les fichiers officiels non exécuté : aucun cache local "
              "dans scripts/dvf/sources/. Lancer --recalculer sur une machine disposant "
              "d'un accès réseau pour l'effectuer et alimenter le cache.")

    publiees = sum(1 for b in resultats.values() for e in b["types"].values() if e["publie"])
    print(f"\n{publiees} séries publiées sur {len(resultats) * 2} · "
          f"{publie['exclusions']['retenues']} mutations retenues · "
          f"seuil {SEUIL_PUBLICATION} · arrondi ROUND_HALF_UP")
    return 0 if total == 0 else 1


def main() -> int:
    analyseur = argparse.ArgumentParser(description="Chaîne DVF de tribu-immo.com")
    analyseur.add_argument("--recalculer", action="store_true",
                           help="télécharge les sources, recalcule et réécrit JSON et tableaux")
    analyseur.add_argument("--verifier", action="store_true",
                           help="contrôle toute la chaîne publiée (comportement par défaut)")
    analyseur.add_argument("--avec-sources", action="store_true",
                           help="force le recalcul depuis les sources pendant la vérification")
    options = analyseur.parse_args()
    return recalculer() if options.recalculer else verifier()


if __name__ == "__main__":
    sys.exit(main())

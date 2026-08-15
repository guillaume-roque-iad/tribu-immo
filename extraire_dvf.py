#!/usr/bin/env python3
"""Extraction reproductible des prix immobiliers à partir des données DVF officielles.

Source
------
Demandes de valeurs foncières (DVF), publiées par la Direction générale des
finances publiques sous Licence Ouverte :
    https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres

Le script utilise la version géolocalisée et découpée par commune produite par
Etalab (« geo-dvf »), qui contient exactement les mêmes mutations que le fichier
source, enrichies des coordonnées et du code commune INSEE :
    https://files.data.gouv.fr/geo-dvf/latest/csv/<annee>/communes/<dep>/<insee>.csv

`files.data.gouv.fr` redirige (HTTP 503 puis redirection) vers le stockage objet
qui héberge réellement les fichiers ; le script suit la redirection.

Méthode
-------
1. Une ligne DVF n'est pas une vente : une mutation (une même transaction) génère
   autant de lignes que de lots et de parcelles concernés, et la `valeur_fonciere`
   est **répétée à l'identique sur chacune**. Additionner les lignes reviendrait à
   compter plusieurs fois le même prix. Les lignes sont donc regroupées par
   `id_mutation`.
2. Seules les mutations dont la `nature_mutation` est exactement « Vente » sont
   retenues. Sont donc écartées les ventes en l'état futur d'achèvement, les
   adjudications, les échanges, les expropriations et les ventes de terrain à
   bâtir : elles ne décrivent pas le même marché.
3. Seules les mutations portant sur **un seul logement** sont retenues, maison ou
   appartement. Une mutation contenant plusieurs logements, ou un local
   commercial ou industriel, mêle des prix hétérogènes sous une seule valeur
   foncière : le prix unitaire n'y est pas calculable. Les dépendances (garage,
   cave, remise) sont tolérées car elles font partie du logement vendu.
4. Les mutations sans surface bâtie renseignée, ou de surface nulle, sont exclues.
5. Les mutations de moins de 1 000 € sont exclues : il s'agit de cessions à titre
   symbolique, pas de prix de marché.
6. L'indicateur publié est la **médiane**, et non la moyenne : elle n'est pas
   déplacée par quelques ventes exceptionnelles.
7. Aucune statistique n'est publiée en dessous de `SEUIL_PUBLICATION` mutations.

Le prix au mètre carré est calculé comme la médiane des rapports prix/surface
mutation par mutation, et non comme le rapport de deux médianes.

Attention : `surface_reelle_bati` ne comprend pas le terrain. Pour une maison, le
prix au mètre carré bâti intègre donc implicitement la valeur du terrain — c'est
pourquoi la surface de terrain médiane est publiée à côté.

Limite connue : une mutation portant sur des parcelles situées dans plusieurs
communes n'apparaît que partiellement dans le fichier d'une commune. Ces cas sont
rares et ne sont pas détectables à partir d'un fichier communal isolé.

Usage
-----
    python3 extraire_dvf.py                 # télécharge, calcule, écrit le JSON
    python3 extraire_dvf.py --verifier      # recalcule et compare au JSON existant
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import sys
import urllib.request
from collections import defaultdict
from datetime import date, timezone, datetime
from pathlib import Path
from statistics import median

RACINE = "https://files.data.gouv.fr/geo-dvf/latest/csv"
ANNEES = ("2023", "2024", "2025")
SEUIL_PUBLICATION = 30

COMMUNES = {
    "11262": ("Narbonne", "11"),
    "11069": ("Carcassonne", "11"),
    "11203": ("Lézignan-Corbières", "11"),
    "34226": ("Quarante", "34"),
    "34245": ("Saint-Chinian", "34"),
    "34284": ("Saint-Pons-de-Thomières", "34"),
}

# Empreintes SHA-256 des fichiers sources tels qu'utilisés pour la publication.
# Elles permettent de vérifier qu'un nouveau téléchargement porte bien sur les
# mêmes données. Un millésime DVF ultérieur les fera légitimement changer.
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

SORTIE = Path(__file__).with_name("resultats-2023-2025.json")
CACHE = Path(__file__).with_name("sources")


def telecharger(chemin: str) -> str:
    """Renvoie le contenu d'un fichier source, depuis le cache local si présent."""
    local = CACHE / chemin
    if local.exists():
        return local.read_text(encoding="utf-8")
    url = f"{RACINE}/{chemin}"
    with urllib.request.urlopen(url, timeout=120) as reponse:
        texte = reponse.read().decode("utf-8")
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_text(texte, encoding="utf-8")
    return texte


def empreinte(texte: str) -> str:
    return hashlib.sha256(texte.encode("utf-8")).hexdigest()


def mutations_retenues(texte: str, annee: str, journal: dict) -> list[dict]:
    """Applique la méthode décrite en tête de fichier à un CSV communal."""
    lignes = list(csv.DictReader(io.StringIO(texte)))
    journal["lignes_lues"] += len(lignes)

    groupes: dict[str, list[dict]] = defaultdict(list)
    for ligne in lignes:
        if ligne["nature_mutation"] != "Vente":
            journal["lignes_hors_vente"] += 1
            continue
        groupes[ligne["id_mutation"]].append(ligne)

    retenues = []
    for rangees in groupes.values():
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
        indesirables = [t for t in types if t not in ("Maison", "Appartement", "Dépendance")]
        if indesirables:
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

        journal["retenues"] += 1
        try:
            terrain = float(bien["surface_terrain"])
        except (TypeError, ValueError):
            terrain = 0.0
        retenues.append({
            "code_commune": bien["code_commune"],
            "nom_commune": bien["nom_commune"],
            "annee": annee,
            "type": bien["type_local"],
            "prix": prix,
            "surface": surface,
            "prix_m2": prix / surface,
            "terrain": terrain,
        })
    return retenues


def quantile(valeurs: list[float], part: float) -> float:
    ordonnees = sorted(valeurs)
    position = (len(ordonnees) - 1) * part
    bas, haut = int(position), min(int(position) + 1, len(ordonnees) - 1)
    return ordonnees[bas] + (ordonnees[haut] - ordonnees[bas]) * (position - bas)


def serie(observations: list[dict]) -> dict:
    nombre = len(observations)
    if nombre < SEUIL_PUBLICATION:
        return {
            "nombre_mutations": nombre,
            "publie": False,
            "motif": "Volume de transactions insuffisant pour publier une statistique robuste.",
        }
    prix = [o["prix"] for o in observations]
    return {
        "nombre_mutations": nombre,
        "publie": True,
        "prix_median": round(median(prix)),
        "prix_q1": round(quantile(prix, 0.25)),
        "prix_q3": round(quantile(prix, 0.75)),
        "surface_mediane": round(median(o["surface"] for o in observations)),
        "terrain_median": round(median(o["terrain"] for o in observations)),
        "prix_m2_median": round(median(o["prix_m2"] for o in observations)),
        "prix_m2_q1": round(quantile([o["prix_m2"] for o in observations], 0.25)),
        "prix_m2_q3": round(quantile([o["prix_m2"] for o in observations], 0.75)),
    }


def construire() -> dict:
    journal = defaultdict(int)
    toutes: list[dict] = []
    verifications = {}

    for code, (nom, departement) in COMMUNES.items():
        for annee in ANNEES:
            chemin = f"{annee}/{departement}/{code}.csv"
            texte = telecharger(chemin)
            reelle = empreinte(texte)
            attendue = EMPREINTES.get(chemin)
            verifications[chemin] = {
                "sha256": reelle,
                "conforme": attendue is None or reelle == attendue,
                "octets": len(texte.encode("utf-8")),
            }
            retenues = mutations_retenues(texte, annee, journal)
            noms = {r["nom_commune"] for r in retenues}
            if noms and nom not in noms:
                raise SystemExit(
                    f"Code INSEE {code} : le fichier officiel contient {noms}, pas « {nom} »."
                )
            toutes.extend(retenues)

    resultats = {}
    for code, (nom, _) in COMMUNES.items():
        bloc = {"code_insee": code, "types": {}}
        for type_bien in ("Maison", "Appartement"):
            selection = [o for o in toutes if o["code_commune"] == code and o["type"] == type_bien]
            entree = serie(selection)
            entree["par_annee"] = {
                annee: serie([o for o in selection if o["annee"] == annee]) for annee in ANNEES
            }
            bloc["types"][type_bien] = entree
        resultats[nom] = bloc

    return {
        "source": {
            "jeu_de_donnees": "Demandes de valeurs foncières (DVF)",
            "producteur": "Direction générale des finances publiques",
            "diffusion": "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
            "fichiers": f"{RACINE}/<annee>/communes/<departement>/<insee>.csv",
            "millesime_publie_le": "2026-05-18",
            "telecharge_le": date.today().isoformat(),
            "licence": "Licence Ouverte / Open Licence (Etalab)",
        },
        "methode": {
            "periode": f"{ANNEES[0]}-01-01 au {ANNEES[-1]}-12-31",
            "annees_completes": list(ANNEES),
            "regroupement": "par id_mutation",
            "nature_mutation_retenue": "Vente",
            "logements_par_mutation": 1,
            "seuil_de_publication": SEUIL_PUBLICATION,
            "indicateur": "médiane",
            "prix_m2": "médiane des rapports prix/surface, mutation par mutation",
        },
        "exclusions": dict(journal),
        "empreintes_sources": verifications,
        "resultats": resultats,
    }


def main() -> int:
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--verifier", action="store_true",
                           help="recalcule et compare au JSON déjà publié")
    options = analyseur.parse_args()

    donnees = construire()

    non_conformes = [c for c, v in donnees["empreintes_sources"].items() if not v["conforme"]]
    if non_conformes:
        print("⚠️ fichiers sources différents de ceux ayant servi à la publication :")
        for chemin in non_conformes:
            print("   " + chemin)

    if options.verifier:
        if not SORTIE.exists():
            print("Aucun résultat publié à comparer.")
            return 1
        publie = json.loads(SORTIE.read_text(encoding="utf-8"))
        if publie["resultats"] == donnees["resultats"]:
            print("✅ les résultats recalculés sont identiques aux résultats publiés")
            return 0
        print("❌ divergence entre les résultats recalculés et les résultats publiés")
        return 1

    SORTIE.write_text(json.dumps(donnees, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Écrit : {SORTIE}")
    print(f"Mutations retenues : {donnees['exclusions']['retenues']}")
    for nom, bloc in donnees["resultats"].items():
        for type_bien, entree in bloc["types"].items():
            if entree["publie"]:
                print(f"  {nom:26s} {type_bien:12s} n={entree['nombre_mutations']:5d} "
                      f"médiane={entree['prix_median']:>9,} €".replace(",", " "))
            else:
                print(f"  {nom:26s} {type_bien:12s} n={entree['nombre_mutations']:5d} non publié")
    return 0


if __name__ == "__main__":
    sys.exit(main())

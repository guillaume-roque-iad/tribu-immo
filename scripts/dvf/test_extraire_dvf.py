#!/usr/bin/env python3
"""Tests de la chaîne DVF, exécutables sans accès réseau.

Ils portent sur la mécanique — construction d'URL, cache, arrondi, quantiles,
filtrage, seuil de publication — et n'utilisent **aucune donnée immobilière
réelle** : les CSV de test sont fabriqués pour déclencher chaque branche
d'exclusion. Ils ne peuvent donc ni influencer ni contredire les chiffres
publiés, qui proviennent uniquement des fichiers officiels.

    python3 test_extraire_dvf.py
"""
from __future__ import annotations

import sys
import tempfile
import unittest
import urllib.request
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import extraire_dvf as dvf  # noqa: E402

ENTETE = ("id_mutation,date_mutation,numero_disposition,nature_mutation,valeur_fonciere,"
          "code_commune,nom_commune,type_local,surface_reelle_bati,nombre_pieces_principales,"
          "surface_terrain")


def ligne(identifiant, nature, valeur, type_local, surface, terrain="", commune="34245",
          nom="Saint-Chinian"):
    return (f"{identifiant},2024-03-01,000001,{nature},{valeur},{commune},{nom},"
            f"{type_local},{surface},3,{terrain}")


class TestUrl(unittest.TestCase):
    """Le défaut corrigé : le segment /communes/ manquait dans l'URL."""

    def test_segment_communes_present(self):
        url = dvf.url_source("2024/34/34245.csv")
        self.assertEqual(
            url, "https://files.data.gouv.fr/geo-dvf/latest/csv/2024/communes/34/34245.csv")
        self.assertIn("/communes/", url)

    def test_toutes_les_cles_d_empreintes_produisent_une_url_valide(self):
        for chemin in dvf.EMPREINTES:
            url = dvf.url_source(chemin)
            annee, departement, fichier = chemin.split("/")
            self.assertTrue(url.endswith(f"/{annee}/communes/{departement}/{fichier}"), url)

    def test_chemin_malforme_refuse(self):
        for mauvais in ("2024/34245.csv", "2024/communes/34/34245.csv", "", "a/b/c/d"):
            with self.assertRaises(ValueError):
                dvf.url_source(mauvais)


class TestCache(unittest.TestCase):
    def test_le_cache_evite_le_reseau(self):
        with tempfile.TemporaryDirectory() as dossier:
            cache = Path(dossier)
            (cache / "2024" / "34").mkdir(parents=True)
            (cache / "2024" / "34" / "34245.csv").write_text("contenu en cache", encoding="utf-8")
            origine_cache, origine_urlopen = dvf.CACHE, urllib.request.urlopen

            def interdit(*a, **k):
                raise AssertionError("le réseau ne doit pas être sollicité si le cache existe")

            dvf.CACHE, urllib.request.urlopen = cache, interdit
            try:
                self.assertEqual(dvf.telecharger("2024/34/34245.csv"), "contenu en cache")
            finally:
                dvf.CACHE, urllib.request.urlopen = origine_cache, origine_urlopen

    def test_l_url_appelee_est_l_url_officielle(self):
        """Le téléchargement doit viser l'URL avec /communes/ et alimenter le cache."""
        appels = []

        class Reponse:
            def read(self):
                return b"donnee"
            def __enter__(self):
                return self
            def __exit__(self, *a):
                return False

        def faux_urlopen(url, timeout=None):
            appels.append(url)
            return Reponse()

        with tempfile.TemporaryDirectory() as dossier:
            origine_cache, origine_urlopen = dvf.CACHE, urllib.request.urlopen
            dvf.CACHE, urllib.request.urlopen = Path(dossier) / "sources", faux_urlopen
            try:
                self.assertEqual(dvf.telecharger("2023/11/11262.csv"), "donnee")
                self.assertEqual(
                    appels,
                    ["https://files.data.gouv.fr/geo-dvf/latest/csv/2023/communes/11/11262.csv"])
                self.assertTrue((dvf.CACHE / "2023" / "11" / "11262.csv").exists())
            finally:
                dvf.CACHE, urllib.request.urlopen = origine_cache, origine_urlopen


class TestArrondi(unittest.TestCase):
    """ROUND_HALF_UP, et non l'arrondi bancaire de round()."""

    def test_demi_toujours_vers_le_haut(self):
        self.assertEqual(dvf.arrondi(0.5), 1)
        self.assertEqual(dvf.arrondi(1.5), 2)
        self.assertEqual(dvf.arrondi(2.5), 3)   # round() donnerait 2
        self.assertEqual(dvf.arrondi(3.5), 4)
        self.assertEqual(dvf.arrondi(4.5), 5)   # round() donnerait 4

    def test_se_distingue_de_round(self):
        divergences = [v for v in (0.5, 2.5, 4.5, 6.5) if dvf.arrondi(v) != round(v)]
        self.assertEqual(divergences, [0.5, 2.5, 4.5, 6.5])

    def test_valeurs_courantes(self):
        self.assertEqual(dvf.arrondi(145749.5), 145750)
        self.assertEqual(dvf.arrondi(Decimal("1639.5")), 1640)
        self.assertEqual(dvf.arrondi(-2.5), -3)


class TestStatistiques(unittest.TestCase):
    def test_mediane_impaire_et_paire(self):
        self.assertEqual(dvf.mediane([1, 2, 3]), 2)
        self.assertEqual(dvf.mediane([1, 2, 3, 4]), 2.5)

    def test_quantiles_par_interpolation(self):
        valeurs = [10, 20, 30, 40, 50]
        self.assertEqual(dvf.quantile(valeurs, 0.0), 10)
        self.assertEqual(dvf.quantile(valeurs, 0.25), 20)
        self.assertEqual(dvf.quantile(valeurs, 0.5), 30)
        self.assertEqual(dvf.quantile(valeurs, 0.75), 40)
        self.assertEqual(dvf.quantile(valeurs, 1.0), 50)

    def test_ordre_des_quantiles(self):
        mutations = [{"prix": p, "surface": 50.0, "terrain": 0.0} for p in range(1, 61)]
        s = dvf.serie(mutations)
        self.assertLessEqual(s["prix_q1"], s["prix_median"])
        self.assertLessEqual(s["prix_median"], s["prix_q3"])


class TestSeuilDePublication(unittest.TestCase):
    def mutations(self, combien):
        return [{"prix": 100000.0 + i, "surface": 80.0, "terrain": 200.0} for i in range(combien)]

    def test_sous_le_seuil_aucun_indicateur(self):
        s = dvf.serie(self.mutations(dvf.SEUIL_PUBLICATION - 1))
        self.assertFalse(s["publie"])
        self.assertEqual(s["motif"], dvf.MOTIF_INSUFFISANT)
        for champ in dvf.INDICATEURS:
            self.assertNotIn(champ, s)

    def test_au_seuil_tous_les_indicateurs(self):
        s = dvf.serie(self.mutations(dvf.SEUIL_PUBLICATION))
        self.assertTrue(s["publie"])
        for champ in dvf.INDICATEURS:
            self.assertIsNotNone(s.get(champ), champ)

    def test_jamais_publie_avec_un_indicateur_nul(self):
        """C'est exactement le défaut qui avait été signalé sur Saint-Chinian."""
        s = dvf.serie(self.mutations(40))
        self.assertTrue(s["publie"])
        self.assertEqual([c for c in dvf.INDICATEURS if s.get(c) is None], [])


class TestFiltrage(unittest.TestCase):
    """Chaque branche d'exclusion, sur des mutations fabriquées pour le test."""

    def filtrer(self, lignes):
        journal = {c: 0 for c in ("lignes_lues", "lignes_hors_vente", "mutations_vues",
                                  "exclu_valeur_multiple", "exclu_valeur_absente",
                                  "exclu_valeur_symbolique", "exclu_local_commercial",
                                  "exclu_multi_locaux", "exclu_aucun_local",
                                  "exclu_surface_nulle", "retenues")}
        texte = "\n".join([ENTETE] + lignes) + "\n"
        return dvf.mutations_du_fichier(texte, "2024", journal), journal

    def test_mutation_simple_retenue(self):
        retenues, journal = self.filtrer([ligne("M1", "Vente", "200000", "Maison", "80", "300")])
        self.assertEqual(journal["retenues"], 1)
        self.assertEqual(retenues[0]["prix"], 200000.0)
        self.assertEqual(retenues[0]["terrain"], 300.0)

    def test_valeur_fonciere_repetee_comptee_une_seule_fois(self):
        """Le piège central de DVF : deux parcelles, un seul prix."""
        retenues, journal = self.filtrer([
            ligne("M1", "Vente", "200000", "Maison", "80", "300"),
            ligne("M1", "Vente", "200000", "", "", "150"),
        ])
        self.assertEqual(journal["retenues"], 1)
        self.assertEqual(retenues[0]["prix"], 200000.0)

    def test_dependance_toleree(self):
        retenues, journal = self.filtrer([
            ligne("M1", "Vente", "200000", "Maison", "80", "300"),
            ligne("M1", "Vente", "200000", "Dépendance", "", ""),
        ])
        self.assertEqual(journal["retenues"], 1)

    def test_exclusions(self):
        cas = [
            ("lignes_hors_vente", [ligne("M1", "Vente en l'état futur d'achèvement", "200000",
                                         "Appartement", "60")]),
            ("exclu_valeur_symbolique", [ligne("M1", "Vente", "500", "Maison", "80")]),
            ("exclu_valeur_absente", [ligne("M1", "Vente", "", "Maison", "80")]),
            ("exclu_local_commercial", [
                ligne("M1", "Vente", "200000", "Maison", "80"),
                ligne("M1", "Vente", "200000", "Local industriel. commercial ou assimilé", "120")]),
            ("exclu_multi_locaux", [
                ligne("M1", "Vente", "400000", "Maison", "80"),
                ligne("M1", "Vente", "400000", "Maison", "90")]),
            ("exclu_aucun_local", [ligne("M1", "Vente", "50000", "", "")]),
            ("exclu_surface_nulle", [ligne("M1", "Vente", "200000", "Maison", "0")]),
            ("exclu_valeur_multiple", [
                ligne("M1", "Vente", "200000", "Maison", "80"),
                ligne("M1", "Vente", "250000", "Dépendance", "")]),
        ]
        for compteur, lignes in cas:
            with self.subTest(compteur=compteur):
                _, journal = self.filtrer(lignes)
                self.assertEqual(journal["retenues"], 0)
                self.assertGreaterEqual(journal[compteur], 1)

    def test_terrain_absent_vaut_zero(self):
        retenues, _ = self.filtrer([ligne("M1", "Vente", "200000", "Maison", "80", "")])
        self.assertEqual(retenues[0]["terrain"], 0.0)


class TestChainePubliee(unittest.TestCase):
    """Le JSON publié doit rester conforme à ses propres règles."""

    def setUp(self):
        import json
        self.publie = json.loads(dvf.FICHIER_JSON.read_text(encoding="utf-8"))
        self.resultats = self.publie["resultats"]

    def test_coherence_interne(self):
        self.assertEqual(dvf.coherence(self.resultats), [])

    def test_conformite_a_la_reference(self):
        self.assertEqual(dvf.controle_reference(self.resultats), [])

    def test_tableaux_html(self):
        self.assertEqual(dvf.remplacer_blocs(self.resultats, ecrire=False), [])

    def test_schema_dataset(self):
        self.assertEqual(dvf.controle_schema(self.resultats), [])

    def test_volume_et_seuil(self):
        self.assertEqual(self.publie["exclusions"]["retenues"], 6148)
        self.assertEqual(self.publie["methode"]["seuil_de_publication"], 30)
        publiees = sum(1 for b in self.resultats.values()
                       for e in b["types"].values() if e["publie"])
        self.assertEqual(publiees, 9)

    def test_les_18_empreintes_sont_declarees(self):
        self.assertEqual(len(dvf.EMPREINTES), 18)
        self.assertEqual(len(self.publie["empreintes_sources"]), 18)
        for chemin, empreinte in dvf.EMPREINTES.items():
            self.assertEqual(len(empreinte), 64, chemin)
            self.assertEqual(self.publie["empreintes_sources"][chemin]["sha256"], empreinte)


if __name__ == "__main__":
    unittest.main(verbosity=2)

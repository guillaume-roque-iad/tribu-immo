# Extraction DVF — prix médians publiés sur tribu-immo.com

Ce dossier contient tout ce qui permet de refaire, et donc de contester, les chiffres publiés sur
<https://tribu-immo.com/barometre-immobilier-narbonne-minervois>.

| Fichier | Rôle |
| --- | --- |
| `extraire_dvf.py` | seule source de vérité : télécharge, calcule, écrit le JSON, régénère les tableaux HTML, vérifie toute la chaîne |
| `resultats-2023-2025.json` | résultats publiés, avec le journal des exclusions et l'empreinte SHA-256 des 18 fichiers sources |
| `controle-reference.tsv` | sortie de l'exécution de référence sur les fichiers officiels : témoin permettant la vérification hors ligne |
| `test_extraire_dvf.py` | 25 tests de la mécanique (URL, cache, arrondi, quantiles, filtrage, seuil), sans accès réseau |

## Commandes

```bash
python3 extraire_dvf.py --verifier                  # contrôle la chaîne publiée, hors ligne
python3 extraire_dvf.py --verifier --avec-sources   # + retélécharge et recalcule tout
python3 extraire_dvf.py --recalculer                # régénère JSON et tableaux depuis les sources
python3 test_extraire_dvf.py                        # tests unitaires
```

`--verifier` seul contrôle cinq chaînes : cohérence interne du JSON, conformité à l'exécution de
référence, tableaux HTML identiques au JSON, absence de nombre étranger dans les blocs DVF, et
Schema `Dataset` identique au JSON. Il renvoie 0 si tout passe et indique explicitement que le
recalcul depuis les sources n'a pas été exécuté.

`--avec-sources` ajoute le recalcul complet : téléchargement des 18 fichiers, vérification des 18
empreintes SHA-256, recomptage des mutations, comparaison de **toutes** les séries — consolidées et
annuelles — au JSON publié. **En cas d'écart, il échoue et ne modifie rien** : c'est à l'opérateur
d'établir la cause avant de relancer `--recalculer`.

## Source

Demandes de valeurs foncières (DVF), produites par la Direction générale des finances publiques et
diffusées sous Licence Ouverte : <https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres>

Le script utilise la version géolocalisée et découpée par commune produite par Etalab :

```
https://files.data.gouv.fr/geo-dvf/latest/csv/<annee>/communes/<departement>/<insee>.csv
```

**Le segment `communes` est indispensable.** Les clés du cache et du dictionnaire `EMPREINTES` sont
de la forme `<annee>/<departement>/<insee>.csv` et ne le portent pas : `url_source()` l'insère, à un
seul endroit, et refuse toute clé mal formée. C'est le défaut qui faisait échouer `--avec-sources`
sur un HTTP 404.

Millésime utilisé : publié le 18 mai 2026. Extraction : 15 août 2026.
Période : trois années civiles complètes, du 1er janvier 2023 au 31 décembre 2025. L'année 2026 est
volontairement exclue : elle est incomplète, et la comparer à une année pleine ferait apparaître une
baisse qui n'existe pas.

## Méthode, en une phrase

Une ligne DVF n'est pas une vente : une même transaction produit autant de lignes que de lots et de
parcelles, avec le prix répété à l'identique sur chacune. Les lignes sont regroupées par
`id_mutation`, seules les mutations « Vente » portant sur un seul logement avec une surface bâtie
renseignée sont retenues, et l'indicateur publié est la médiane.

Le détail complet des filtres et des raisons de chaque exclusion figure en tête de `extraire_dvf.py`
et dans la section `exclusions` du fichier de résultats.

## Règles de publication

- **Seuil : 30 mutations.** Une série qui l'atteint porte **tous** ses indicateurs ; une série en
  dessous n'en porte **aucun**, seulement son effectif et le motif. Aucun cas intermédiaire.
- **Arrondi `ROUND_HALF_UP` décimal**, une seule fonction, appliquée à la statistique finale et
  jamais aux valeurs intermédiaires. `round()` de Python est proscrit : il applique l'arrondi
  bancaire (2,5 → 2), inadapté à des prix.

Trois séries sur douze sont donc vides : le marché de l'appartement à Quarante (0 vente), à
Saint-Chinian (2) et à Saint-Pons-de-Thomières (14).

## Cache

`--recalculer` et `--verifier --avec-sources` déposent les fichiers téléchargés dans `sources/`,
ignoré par Git. Sa présence suffit à déclencher le recalcul lors des vérifications suivantes.
Le supprimer force un nouveau téléchargement.

## Limite connue

Une mutation portant sur des parcelles situées dans plusieurs communes n'apparaît que partiellement
dans le fichier d'une commune. Ces cas sont rares et ne sont pas détectables à partir d'un fichier
communal isolé.

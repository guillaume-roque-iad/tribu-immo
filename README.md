# Extraction DVF — prix médians publiés sur tribu-immo.com

Ce dossier contient tout ce qui permet de refaire, et donc de contester, les chiffres publiés sur
<https://tribu-immo.com/barometre-immobilier-narbonne-minervois>.

| Fichier | Rôle |
| --- | --- |
| `extraire_dvf.py` | télécharge les fichiers officiels, applique la méthode, écrit les résultats |
| `resultats-2023-2025.json` | résultats publiés, avec le journal des exclusions et l'empreinte SHA-256 de chaque fichier source |

## Source

Demandes de valeurs foncières (DVF), produites par la Direction générale des finances publiques et
diffusées sous Licence Ouverte : <https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres>

Le script utilise la version géolocalisée et découpée par commune produite par Etalab, qui contient les
mêmes mutations enrichies du code commune INSEE :
`https://files.data.gouv.fr/geo-dvf/latest/csv/<annee>/communes/<departement>/<insee>.csv`

Millésime utilisé : publié le 18 mai 2026. Extraction : 15 août 2026.
Période retenue : trois années civiles complètes, du 1er janvier 2023 au 31 décembre 2025. L'année 2026
est volontairement exclue : elle est incomplète, et la comparer à une année pleine ferait apparaître une
baisse qui n'existe pas.

## Méthode, en une phrase

Une ligne DVF n'est pas une vente : une même transaction produit autant de lignes que de lots et de
parcelles, avec le prix répété à l'identique sur chacune. Les lignes sont regroupées par `id_mutation`,
seules les mutations « Vente » portant sur un seul logement avec une surface bâtie renseignée sont
retenues, et l'indicateur publié est la médiane.

Le détail complet des filtres et des raisons de chaque exclusion figure en tête de `extraire_dvf.py` et
dans la section `exclusions` du fichier de résultats.

## Règle de publication

Aucune statistique n'est publiée en dessous de **30 mutations**. Trois séries sur douze sont donc vides :
le marché de l'appartement à Quarante (0 vente), à Saint-Chinian (2) et à Saint-Pons-de-Thomières (14).
Une médiane calculée sur quelques ventes n'est pas une statistique.

## Refaire le calcul

```bash
python3 extraire_dvf.py              # télécharge, calcule, réécrit le JSON
python3 extraire_dvf.py --verifier   # recalcule et compare aux résultats publiés
```

Le script compare l'empreinte SHA-256 de chaque fichier téléchargé à celle qui a servi à la publication et
signale toute différence. Un millésime DVF plus récent fera légitimement changer ces empreintes : dans ce
cas, les résultats doivent être régénérés et la page mise à jour.

## Limite connue

Une mutation portant sur des parcelles situées dans plusieurs communes n'apparaît que partiellement dans le
fichier d'une commune. Ces cas sont rares et ne sont pas détectables à partir d'un fichier communal isolé.

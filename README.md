Site tribu-immo.com - deploiement automatique via Cloudflare Workers Builds.

Performance : après modification de redesign.css ou languages.css, exécuter `node scripts/inline-home-styles.mjs` pour synchroniser les styles intégrés des pages d’accueil. La construction Cloudflare le fait aussi automatiquement. Les fichiers sous assets/optimized sont immuables : utiliser un nouveau nom pour toute modification.

Indexation : `node scripts/update-indexing.mjs` applique la même politique après génération des traductions et lors de chaque build. Les pages publiques sont indexables quelle que soit leur langue. Les confirmations, la page 404, le simulateur intégré et les contenus migrés restent exclus. Le script synchronise les URL canoniques, les alternatives linguistiques réciproques et les six sitemaps. `i18n/reviewed-pages.json` suit uniquement la relecture éditoriale, sans bloquer Google.

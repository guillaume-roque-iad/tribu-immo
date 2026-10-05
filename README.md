Site tribu-immo.com - deploiement automatique via Cloudflare Workers Builds.

Performance : après modification de redesign.css ou languages.css, exécuter `node scripts/inline-home-styles.mjs` pour synchroniser les styles intégrés des pages d’accueil. La construction Cloudflare le fait aussi automatiquement. Les fichiers sous assets/optimized sont immuables : utiliser un nouveau nom pour toute modification.

// Keep the landing page's styles in its first response: no blocking CSS round trip.
// Shared CSS remains the source of truth, refreshed on every Cloudflare build.
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root = new URL('../', import.meta.url);
for (const page of ['index.html', ...['en','es','it','de','pt'].map(lang => lang+'/index.html')]) {
  const url = new URL(page, root);
  let html = readFileSync(url, 'utf8');
  for (const file of ['redesign.css', 'languages.css']) {
    const css = readFileSync(new URL(file, root), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const id = file.replace('.css', '');
    const style = '<style data-inline-css="'+id+'">'+css+'</style>';
    const pattern = new RegExp('<style data-inline-css="'+id+'">[\\s\\S]*?</style>|<link rel="stylesheet" href="/'+file.replace('.', '\\.')+'">');
    if (!pattern.test(html)) throw new Error('Missing style source in '+fileURLToPath(url)+': '+file);
    html = html.replace(pattern, () => style);
  }
  writeFileSync(url, html);
}

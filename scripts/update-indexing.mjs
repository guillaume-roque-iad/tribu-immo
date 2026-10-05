// Public localized pages are indexable; technical pages and migrations are not.
// Run after translation generation and on every production build.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://tribu-immo.com';
const languages = ['fr', 'en', 'es', 'it', 'de', 'pt'];
const technical = new Set(['404.html', 'candidature-envoyee.html', 'estimation-demandee.html', 'simulateur-outil.html']);
const redirects = new Map(fs.readFileSync(path.join(root, '_redirects'), 'utf8').split('\n')
  .filter(line => line.trim() && !line.trim().startsWith('#')).map(line => line.trim().split(/\s+/)));
const migrated = JSON.parse(fs.readFileSync(path.join(root, 'i18n/migrated-pages.json'), 'utf8'));
const statePath = path.join(root, 'i18n/page-modifications.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const tag = /<meta\b[^>]*>/gi;
const links = /<link\b[^>]*>/gi;
const attr = (text, name) => text.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
const xml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const pages = [];
let unblocked = 0;

for (const lang of languages) {
  const dir = lang === 'fr' ? root : path.join(root, lang);
  for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.html')).sort()) {
    const file = path.join(dir, name);
    let html = fs.readFileSync(file, 'utf8');
    if (!/<head\b/i.test(html)) continue; // Search Console verification files.
    const route = (lang === 'fr' ? '/' : `/${lang}/`) + (name === 'index.html' ? '' : name.slice(0, -5));
    const destination = redirects.get(route) || migrated[name.slice(0, -5)];
    const excluded = technical.has(name) || Boolean(destination);
    const robots = [...html.matchAll(tag)].map(match => match[0]).filter(t => ['robots', 'googlebot'].includes(attr(t, 'name')?.toLowerCase()));
    if (!excluded && robots.some(t => /noindex/i.test(attr(t, 'content') || ''))) unblocked++;
    html = html.replace(tag, t => ['robots', 'googlebot'].includes(attr(t, 'name')?.toLowerCase()) ? '' : t);
    html = html.replace(links, t => ['canonical', 'alternate'].includes(attr(t, 'rel')) && (attr(t, 'rel') === 'canonical' || attr(t, 'hreflang')) ? '' : t);
    html = html.replace('</head>', `<meta name="robots" content="${excluded ? 'noindex, follow' : 'index, follow, max-image-preview:large'}"></head>`);
    const canonical = destination ? new URL(destination, base).href : base + route;
    if (name !== '404.html') html = html.replace('</head>', `<link rel="canonical" href="${xml(canonical)}"></head>`);
    pages.push({ file, name, lang, route, html, excluded, canonical });
  }
}

// Only advertise real, indexable language alternatives, with reciprocal links.
for (const page of pages) {
  if (!page.excluded) {
    const alternatives = pages.filter(p => p.name === page.name && !p.excluded);
    let annotations = alternatives.map(p => `<link rel="alternate" hreflang="${p.lang}" href="${xml(p.canonical)}">`).join('');
    const french = alternatives.find(p => p.lang === 'fr');
    if (french) annotations += `<link rel="alternate" hreflang="x-default" href="${xml(french.canonical)}">`;
    page.html = page.html.replace('</head>', annotations + '</head>');
  }
  if (fs.readFileSync(page.file, 'utf8') !== page.html) fs.writeFileSync(page.file, page.html);
  if (!page.excluded) {
    const relative = path.relative(root, page.file);
    const sha256 = crypto.createHash('sha256').update(page.html).digest('hex');
    const previous = state[relative];
    state[relative] = previous ? (previous.sha256 === sha256 ? previous : { sha256, lastmod: today }) : { sha256 };
  }
}
const ns = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const included = [];
for (const lang of languages) {
  const entries = pages.filter(p => p.lang === lang && !p.excluded);
  const urls = entries.map(p => {
    const modified = state[path.relative(root, p.file)]?.lastmod;
    return `<url><loc>${xml(p.canonical)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
  }).join('');
  fs.writeFileSync(path.join(root, `sitemap-${lang}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${ns}">${urls}</urlset>\n`);
  if (entries.length) included.push(lang);
}
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${ns}">${included.map(lang => `<sitemap><loc>${base}/sitemap-${lang}.xml</loc></sitemap>`).join('')}</sitemapindex>\n`);
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(`Indexing: ${pages.filter(p => !p.excluded).length} public pages; ${unblocked} noindex blocks removed; ${pages.filter(p => p.excluded).length} technical/migrated pages excluded.`);

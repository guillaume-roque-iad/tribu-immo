// French public pages are indexable; translations require explicit approval.
// Run after translation generation and on every production build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://tribu-immo.com';
const languages = ['fr', 'en', 'es', 'it', 'de', 'pt'];
// Option A: keep this empty. Option B will allow exact, reviewed routes only,
// e.g. '/es/' or '/en/guillaume-roque'. Technical/migrated pages stay excluded.
const indexableTranslatedRoutes = new Set([]);
const technical = new Set(['404.html', 'candidature-envoyee.html', 'estimation-demandee.html', 'simulateur-outil.html']);
const redirects = new Map(fs.readFileSync(path.join(root, '_redirects'), 'utf8').split('\n')
  .filter(line => line.trim() && !line.trim().startsWith('#')).map(line => line.trim().split(/\s+/)));
const migrated = JSON.parse(fs.readFileSync(path.join(root, 'i18n/migrated-pages.json'), 'utf8'));
const tag = /<meta\b[^>]*>/gi;
const links = /<link\b[^>]*>/gi;
const attr = (text, name) => text.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
const xml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const pages = [];
let unblocked = 0;

// Only editorial dates qualify. SEO markup, builds and HTML hashes do not.
function editorialDate(html) {
  const dates = new Set();
  const accept = value => {
    if (typeof value !== 'string') return;
    const day = value.match(/^\d{4}-\d{2}-\d{2}(?=$|T)/)?.[0];
    if (day && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day) dates.add(day);
  };
  const visit = value => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      if (value.dateModified) accept(value.dateModified);
      Object.values(value).forEach(visit);
    }
  };
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(match[1])); } catch { /* Invalid JSON-LD supplies no editorial date. */ }
  }
  if (!dates.size) {
    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      if (attr(match[0], 'property') === 'article:modified_time') accept(attr(match[0], 'content'));
    }
    for (const match of html.matchAll(/<time\b[^>]*>/gi)) {
      if (attr(match[0], 'itemprop') === 'dateModified') accept(attr(match[0], 'datetime'));
    }
  }
  if (!dates.size) {
    const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const match = text.match(/(?:Mis à jour(?: le)?|Mise à jour)\s*:?\s*(\d{1,2})\s+(\S+)\s+(\d{4})/i);
    if (match && months.includes(match[2].toLowerCase())) accept(`${match[3]}-${String(months.indexOf(match[2].toLowerCase()) + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`);
  }
  return dates.size === 1 ? [...dates][0] : undefined;
}

for (const lang of languages) {
  const dir = lang === 'fr' ? root : path.join(root, lang);
  for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.html')).sort()) {
    const file = path.join(dir, name);
    let html = fs.readFileSync(file, 'utf8');
    if (!/<head\b/i.test(html)) continue; // Search Console verification files.
    const route = (lang === 'fr' ? '/' : `/${lang}/`) + (name === 'index.html' ? '' : name.slice(0, -5));
    const destination = redirects.get(route) || migrated[name.slice(0, -5)];
    const translationExcluded = lang !== 'fr' && !indexableTranslatedRoutes.has(route);
    const excluded = technical.has(name) || Boolean(destination) || translationExcluded;
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

const indexableCanonicalUrls = new Set(pages.filter(p => !p.excluded).map(p => p.canonical));

// Only advertise multilingual groups containing real, indexable alternatives.
// A French-only page needs neither a self-alternate nor an x-default.
for (const page of pages) {
  if (!page.excluded) {
    const alternatives = pages.filter(p => p.name === page.name && !p.excluded);
    if (alternatives.length > 1) {
      let annotations = alternatives.map(p => `<link rel="alternate" hreflang="${p.lang}" href="${xml(p.canonical)}">`).join('');
      const french = alternatives.find(p => p.lang === 'fr');
      if (french) annotations += `<link rel="alternate" hreflang="x-default" href="${xml(french.canonical)}">`;
      page.html = page.html.replace('</head>', annotations + '</head>');
    }
  }
  // Keep language navigation and its lang labels, but do not advertise a
  // noindex destination via hreflang (including links outside the <head>).
  page.html = page.html.replace(/<a\b[^>]*>/gi, anchor => {
    if (!attr(anchor, 'hreflang')) return anchor;
    const href = attr(anchor, 'href');
    let target;
    try { target = new URL(href || '', base + page.route); } catch { return anchor; }
    target.search = '';
    target.hash = '';
    return indexableCanonicalUrls.has(target.href) ? anchor
      : anchor.replace(/\s+hreflang\s*=\s*["'][^"']*["']/gi, '');
  });
  if (fs.readFileSync(page.file, 'utf8') !== page.html) fs.writeFileSync(page.file, page.html);
}
const ns = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const included = [];
for (const lang of languages) {
  const entries = pages.filter(p => p.lang === lang && !p.excluded);
  const urls = entries.map(p => {
    const modified = editorialDate(p.html);
    return `<url><loc>${xml(p.canonical)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
  }).join('');
  // Keep empty language sitemap files instead of deleting them. Only nonempty
  // sitemaps are referenced by the index below.
  fs.writeFileSync(path.join(root, `sitemap-${lang}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${ns}">${urls}</urlset>\n`);
  if (entries.length) included.push(lang);
}
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${ns}">${included.map(lang => `<sitemap><loc>${base}/sitemap-${lang}.xml</loc></sitemap>`).join('')}</sitemapindex>\n`);
console.log(`Indexing: ${pages.filter(p => !p.excluded).length} indexable pages; ${unblocked} noindex blocks removed; ${pages.filter(p => p.excluded).length} technical/migrated/unapproved pages excluded.`);

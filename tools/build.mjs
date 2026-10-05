/**
 * Minimaler Build ohne Abhängigkeiten: setzt die Seiten aus src/pages mit den
 * Partials aus src/partials zusammen und schreibt den statischen Prototyp nach public/.
 *
 * Include-Syntax (angelehnt an Twig `{% include 'x' with {...} %}`):
 *   <!-- @include heart-hero label="Herz-Symbol" -->
 * Im Partial werden {{schlüssel}} ersetzt. Sonderfall {{a11y}}: mit `label`
 * wird role="img" + aria-label gesetzt, sonst aria-hidden (dekorativ).
 *
 * Aufruf:
 *   node tools/build.mjs            → public/          (Prototyp, GitHub Pages unter https://herz.rosenbaum.hamburg/:
 *     Einstiegsseite im Wurzelpfad, /patienten/, /zuweiser/, Übersicht unter /prototyp/)
 *   node tools/build.mjs --agentur  → dist/agentur/    (Produktionsfassung für das Theme:
 *     ohne Prototyp-Kopf/-Fuß, ohne noindex/robots.txt, feste Pfade
 *     /herz-ct… und Assets unter ASSET_BASE)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const AGENTUR = process.argv.includes('--agentur');
const ASSET_BASE = '/themes/ohjunge/assets/hct/';
const PAGES_DOMAIN = 'herz.rosenbaum.hamburg';
// Im Theme liegt die Unterseite unter /herz-ct (Prototyp: im Wurzelpfad der eigenen Domain)
const PROD_PREFIX = '/herz-ct';
const out = AGENTUR ? join(root, 'dist', 'agentur') : join(root, 'public');

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function render(html, depth = 0) {
  if (depth > 10) throw new Error('Include-Tiefe überschritten');
  return html.replace(/<!--\s*@include\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (_, name, attrs) => {
    const params = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    params.a11y = params.label
      ? `role="img" aria-label="${escAttr(params.label)}"`
      : 'aria-hidden="true" focusable="false"';
    const partial = readFileSync(join(src, 'partials', `${name}.html`), 'utf8').trimEnd();
    const filled = partial.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, k) => params[k] ?? '');
    return render(filled, depth + 1);
  });
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// Agentur: Assets liegen bereits in der Zielstruktur des Themes (ASSET_BASE)
const assetOut = AGENTUR ? join(out, ...ASSET_BASE.split('/').filter(Boolean)) : join(out, 'assets');
cpSync(join(root, 'assets'), assetOut, { recursive: true });
if (AGENTUR) {
  rmSync(join(assetOut, 'robots-prototyp.txt'));
} else {
  // Prototyp: komplette Sperre für Suchmaschinen (entfällt im Theme)
  cpSync(join(root, 'assets', 'robots-prototyp.txt'), join(out, 'robots.txt'));
  // GitHub Pages: keine Jekyll-Verarbeitung
  writeFileSync(join(out, '.nojekyll'), '');
  // Eigene Domain für GitHub Pages (zusätzlich in Settings → Pages → Custom domain eintragen)
  writeFileSync(join(out, 'CNAME'), `${PAGES_DOMAIN}\n`);
}

/** Produktionsfassung: Prototyp-Rahmen entfernen, relative Pfade auf feste URLs umstellen. */
function toProduction(html, pagePath) {
  html = html
    .replace(/\s*<!-- Prototyp: nicht indexieren[^>]*-->\s*<meta name="robots"[^>]*>/, '')
    .replace(/\s*<link rel="icon"[^>]*>/, '')
    .replace(/\s*<a class="hct-skip"[^>]*>.*?<\/a>/, '')
    .replace(/<header class="hct-proto-header">[\s\S]*?<\/header>/, '<!-- THEME: Seitenkopf und Navigation aus dem Layout -->')
    .replace(/<footer class="hct-proto-footer">[\s\S]*?<\/footer>/, '<!-- THEME: Fußbereich aus dem Layout -->');
  const base = new URL(pagePath, 'https://prototyp.invalid/');
  return html.replace(/\b(href|src)="([^"#][^"]*)"/g, (m, attr, url) => {
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) return m;
    const abs = new URL(url, base);
    let p = abs.pathname;
    if (p.startsWith('/assets/')) p = ASSET_BASE + p.slice('/assets/'.length);
    else p = PROD_PREFIX + (p === '/' ? '' : p.replace(/\/$/, ''));
    return `${attr}="${p}${abs.hash}"`;
  });
}

const pagesDir = join(src, 'pages');
for (const file of walk(pagesDir).filter((f) => f.endsWith('.html'))) {
  const rel = relative(pagesDir, file);
  if (AGENTUR && rel.startsWith('prototyp')) continue; // Prototyp-Übersicht entfällt
  const target = AGENTUR ? join(out, PROD_PREFIX.slice(1), rel) : join(out, rel);
  mkdirSync(dirname(target), { recursive: true });
  let html = render(readFileSync(file, 'utf8'));
  if (AGENTUR) html = toProduction(html, '/' + rel.replace(/index\.html$/, ''));
  writeFileSync(target, html);
  console.log('Seite  ', rel);
}

if (AGENTUR) {
  // Teaser für Startseite und /ct-diagnostik als eigenständiges Snippet
  const snip = join(out, 'snippets');
  mkdirSync(snip, { recursive: true });
  writeFileSync(join(snip, 'teaser-startseite-ct-diagnostik.html'),
    toProduction(render('<!-- @include teaser id="hct-teaser" base="" -->'), '/') + '\n');
  console.log('Snippet', 'snippets/teaser-startseite-ct-diagnostik.html');
}

// Eigenständige SVG-Dateien der Leitbild-Varianten (für Druck, Agentur, CMS-Medien)
const svgDir = join(assetOut, 'svg');
mkdirSync(svgDir, { recursive: true });
const standaloneCss = `<style>.hct-heart__left{fill:#68b1d4}.hct-heart__right{fill:#e2574c}.hct-heart__line{fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round}.hct-heart__aorta{stroke:#fff}.hct-heart__target{fill:none;stroke:#eceae5}.hct-heart__rings{color:rgba(255,255,255,.35)}.hct-heart--small .hct-heart__aorta{stroke:#e2574c}.hct-heart--small .hct-heart__target{stroke:#007aa8}</style>`;
for (const [name, variant] of [['heart-hero', 'hero'], ['heart-small', 'small'], ['heart-mono', 'mono']]) {
  let svg = render(`<!-- @include ${name} id="file" label="Herz-Symbol der Radiologie Dammtor" -->`);
  svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  if (variant === 'hero') svg = svg.replace(/(<svg[^>]*>)/, `$1<rect x="0" y="-10" width="300" height="290" fill="#007aa8"/>`);
  if (variant !== 'mono') svg = svg.replace(/(<svg[^>]*>)/, `$1${standaloneCss}`);
  writeFileSync(join(svgDir, `${name}.svg`), `${svg}\n`);
  console.log('SVG    ', relative(out, join(svgDir, `${name}.svg`)));
}

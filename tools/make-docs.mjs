/**
 * Erzeugt die Druckvorlagen (src/docs/*.html) als PDF nach assets/downloads/ und je ein
 * Vorschaubild der ersten Seite nach assets/img/. Danach `node tools/build.mjs` ausführen.
 * Braucht Playwright mit Chromium (lokal, nicht im CI).
 *   node tools/make-docs.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = [
  ['laufzettel-herz-ct', 'laufzettel-herz-ct-radiologie-dammtor.pdf', 'vorschau-laufzettel.png'],
  ['aufklaerung-herz-ct', 'aufklaerung-herz-ct-radiologie-dammtor.pdf', 'vorschau-aufklaerung.png'],
];

const browser = await chromium.launch();
for (const [src, pdf, png] of DOCS) {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(root, 'src', 'docs', `${src}.html`)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(root, 'assets', 'downloads', pdf), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: 'print' });
  const first = await page.$('.page');
  await first.screenshot({ path: join(root, 'assets', 'img', png) });
  console.log('PDF    ', pdf, '+', png);
}
await browser.close();

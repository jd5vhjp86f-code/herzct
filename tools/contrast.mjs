// Prüft WCAG-Kontraste der Token-Kombinationen. Aufruf: node tools/contrast.mjs
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../assets/css/tokens.css', import.meta.url), 'utf8');
const t = Object.fromEntries([...css.matchAll(/--(hct-[\w-]+):\s*(#[0-9a-f]{3,6})/gi)].map((m) => [m[1], m[2]]));
const lum = (hex) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['hct-white', 'hct-blue', 'Hero-Text'], ['hct-white', 'hct-petrol', ''], ['hct-white', 'hct-petrol-strong', 'Kontaktbox'],
  ['hct-white', 'hct-sage', 'nur Grafik'], ['hct-white', 'hct-red', 'nur Grafik'], ['hct-white', 'hct-red-strong', 'Fläche'], ['hct-red-text', 'hct-white', ''], ['hct-red-text', 'hct-sand', ''], ['hct-taupe-theme', 'hct-white', 'Theme-Text'], ['hct-taupe-theme', 'hct-sand', 'nicht für Text'], ['hct-white', 'hct-lightblue', 'nur Grafik'],
  ['hct-taupe', 'hct-white', ''], ['hct-taupe', 'hct-sand', ''],   ['hct-blue-text', 'hct-white', 'Links'], ['hct-blue-text', 'hct-sand', ''], ['hct-petrol-text', 'hct-white', 'Kicker'], ['hct-petrol-text', 'hct-sand', ''],
  ['hct-sage-text', 'hct-white', ''], ['hct-ink', 'hct-sage', 'Icons/Label'], ['hct-ink', 'hct-lightblue', 'Icons'], ['hct-blue', 'hct-white', ''], ['hct-sage', 'hct-white', 'Grafik ≥3:1?'], ['hct-lightblue', 'hct-white', 'Grafik ≥3:1?'],
];
let fail = 0;
for (const [fg, bg, note] of pairs) {
  const r = ratio(t[fg], t[bg]);
  const ok = r >= 4.5 ? 'AA' : r >= 3 ? 'AA groß/Grafik' : '—';
  console.log(`${fg.padEnd(18)} auf ${bg.padEnd(18)} ${r.toFixed(2).padStart(5)}:1  ${ok.padEnd(15)} ${note}`);
}

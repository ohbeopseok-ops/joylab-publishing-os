import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const cssPath = path.join(root, 'src/styles/growth-leadership-guide-v2.css');
const css = fs.readFileSync(cssPath, 'utf8');

const contracts = [
  { name: 'EP01', html: 'dist/guides/growth-leadership/literature/old-man-and-the-sea/index.html', cssClass: 'le-visual--ep01' },
  { name: 'EP02', html: 'dist/guides/growth-leadership/literature/little-prince/index.html', cssClass: 'le-visual--ep02' },
  { name: 'EP03', html: 'dist/guides/growth-leadership/literature/demian/index.html', cssClass: 'le-visual--ep03' }
];

function normalizeAsset(value) {
  if (!value) return null;
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) return new URL(value).pathname;
  } catch {}
  return value.split('?')[0];
}

function extractOgImage(html) {
  const patterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["'][^>]*>/i
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return match[1];
  }
  return null;
}

function extractCssHeroUrl(cssClass) {
  const marker = '.' + cssClass;
  const start = css.indexOf(marker);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open + 1);
  if (open < 0 || close < 0) return null;
  const block = css.slice(open + 1, close);
  const match = block.match(/url\((['"]?)([^)'\"]+)\1\)/i);
  return match?.[2] ?? null;
}

const failures = [];
const report = [];

for (const contract of contracts) {
  const htmlPath = path.join(root, contract.html);
  if (!fs.existsSync(htmlPath)) {
    failures.push(contract.name + ': built HTML missing: ' + contract.html);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const og = normalizeAsset(extractOgImage(html));
  const hero = normalizeAsset(extractCssHeroUrl(contract.cssClass));
  report.push({ name: contract.name, og, hero });
  if (!og) failures.push(contract.name + ': og:image not found');
  if (!hero) failures.push(contract.name + ': CSS Hero URL not found for .' + contract.cssClass);
  if (og && hero && og !== hero) failures.push(contract.name + ': OG/Hero mismatch: og=' + og + ', hero=' + hero);
}

console.log(JSON.stringify({ gate: 'Asset Contract V2', report }, null, 2));
if (failures.length) {
  console.error('Asset Contract V2 FAILED:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('Asset Contract V2 PASS');

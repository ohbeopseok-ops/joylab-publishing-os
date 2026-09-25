import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'src');
const IDENTITY_FILE = path.join(SOURCE_DIR, 'config', 'siteIdentity.ts');
const EXPECTED = {
  publisherId: 'pub-6938956176929357',
  clientId: 'ca-pub-6938956176929357',
  adsTxtRecord: 'google.com, pub-6938956176929357, DIRECT, f08c47fec0942fa0'
};

function fail(message) {
  console.error(`[AdSense Contract] FAIL: ${message}`);
  process.exitCode = 1;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

const identity = fs.readFileSync(IDENTITY_FILE, 'utf8');
for (const [key, value] of Object.entries(EXPECTED)) {
  if (!identity.includes(`${key}: '${value}'`)) fail(`siteIdentity.ts missing expected ${key}`);
}

const idPattern = /(?:ca-)?pub-\d{16}/g;
for (const file of walk(SOURCE_DIR)) {
  if (file === IDENTITY_FILE) continue;
  if (!/\.(astro|ts|tsx|js|jsx|mjs|md|mdx)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const matches = text.match(idPattern);
  if (matches?.length) {
    fail(`hard-coded AdSense publisher ID outside siteIdentity.ts: ${path.relative(ROOT, file)} -> ${[...new Set(matches)].join(', ')}`);
  }
}

const adsRoute = fs.readFileSync(path.join(SOURCE_DIR, 'pages', 'ads.txt.ts'), 'utf8');
if (!adsRoute.includes('SITE_IDENTITY.adsense.adsTxtRecord')) fail('ads.txt route is not bound to SITE_IDENTITY');

const layout = fs.readFileSync(path.join(SOURCE_DIR, 'layouts', 'BaseLayout.astro'), 'utf8');
if (!layout.includes('SITE_IDENTITY.adsense.clientId')) fail('BaseLayout is not bound to SITE_IDENTITY AdSense clientId');

const dist = path.join(ROOT, 'dist');
if (fs.existsSync(dist)) {
  const adsPath = path.join(dist, 'ads.txt');
  const indexPath = path.join(dist, 'index.html');
  if (!fs.existsSync(adsPath)) fail('dist/ads.txt missing');
  else if (fs.readFileSync(adsPath, 'utf8').trim() !== EXPECTED.adsTxtRecord) fail('dist/ads.txt content mismatch');

  if (!fs.existsSync(indexPath)) fail('dist/index.html missing');
  else {
    const html = fs.readFileSync(indexPath, 'utf8');
    if (!html.includes(`name="google-adsense-account" content="${EXPECTED.clientId}"`)) fail('AdSense account meta tag missing/mismatched');
    const scriptNeedle = `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${EXPECTED.clientId}`;
    const count = html.split(scriptNeedle).length - 1;
    if (count !== 1) fail(`expected exactly one AdSense loader on homepage, found ${count}`);
  }
}

if (!process.exitCode) console.log('[AdSense Contract] PASS');

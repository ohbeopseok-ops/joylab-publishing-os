import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const report = [];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function normalize(value) {
  if (!value) return '';
  const decoded = value.replace(/&amp;/g, '&');
  try {
    if (/^https?:\/\//i.test(decoded)) return new URL(decoded).pathname;
  } catch {}
  return decoded.split('?')[0];
}

function attr(tag, name) {
  const match = tag.match(new RegExp(name + '=["\']([^"\']*)["\']', 'i'));
  return match?.[1] ?? '';
}

function ogImage(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (attr(tag, 'property').toLowerCase() === 'og:image') return attr(tag, 'content');
  }
  return '';
}

function contractTag(html) {
  return (html.match(/<(?:article|section)\b[^>]*data-asset-contract-kind=["\'][^"\']+["\'][^>]*>/i) ?? [])[0] ?? '';
}

function eagerHero(html) {
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (/fetchpriority=["\']high["\']/i.test(tag)) return attr(tag, 'src');
  }
  return '';
}

function localAssetExists(assetPath) {
  if (!assetPath || !assetPath.startsWith('/')) return true;
  const target = path.join(dist, assetPath.replace(/^\//, ''));
  return fs.existsSync(target) && fs.statSync(target).size > 0;
}

function pageFiles(base, kind) {
  return walk(base).filter((file) => {
    if (path.basename(file) !== 'index.html') return false;
    const rel = path.relative(base, file).split(path.sep);
    if (kind === 'book' || kind === 'article') return rel.length === 2;
    return true;
  });
}

const targets = [
  ...pageFiles(path.join(dist, 'articles'), 'article').map((file) => ({ kind: 'article', file })),
  ...pageFiles(path.join(dist, 'books'), 'book').map((file) => ({ kind: 'book', file }))
];

for (const { kind, file } of targets) {
  const html = fs.readFileSync(file, 'utf8');
  const tag = contractTag(html);
  const rel = path.relative(dist, file).split(path.sep).join('/');
  if (!tag) {
    failures.push(rel + ': missing Asset Contract V3 marker');
    continue;
  }

  const declaredKind = attr(tag, 'data-asset-contract-kind');
  const declaredHero = normalize(attr(tag, 'data-asset-contract-hero'));
  const declaredOg = normalize(attr(tag, 'data-asset-contract-og'));
  const renderedHero = normalize(eagerHero(html));
  const renderedOg = normalize(ogImage(html));

  if (declaredKind !== kind) failures.push(rel + ': declared kind=' + declaredKind + ', expected=' + kind);
  if (!renderedOg) failures.push(rel + ': og:image missing');
  if (declaredOg && renderedOg !== declaredOg) failures.push(rel + ': OG mismatch declared=' + declaredOg + ' rendered=' + renderedOg);
  if (!declaredOg) failures.push(rel + ': declared OG path missing');

  if (declaredHero) {
    if (!renderedHero) failures.push(rel + ': declared Hero/Cover exists but no fetchpriority=high image rendered');
    else if (renderedHero !== declaredHero) failures.push(rel + ': Hero mismatch declared=' + declaredHero + ' rendered=' + renderedHero);
  } else if (renderedHero) {
    failures.push(rel + ': rendered Hero exists without declared Hero contract: ' + renderedHero);
  }

  for (const [role, asset] of [['hero', declaredHero], ['og', declaredOg]]) {
    if (asset && !localAssetExists(asset)) failures.push(rel + ': ' + role + ' asset missing from dist: ' + asset);
  }

  report.push({ page: rel, kind, hero: declaredHero || null, og: declaredOg || null, sameAsset: Boolean(declaredHero && declaredOg && declaredHero === declaredOg) });
}

if (!targets.length) failures.push('No Article/Book pages found in dist');

console.log(JSON.stringify({ gate: 'Asset Contract V3', pages: report.length, report }, null, 2));

if (failures.length) {
  console.error('Asset Contract V3 FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Asset Contract V3 PASS: ' + report.length + ' Article/Book pages verified.');

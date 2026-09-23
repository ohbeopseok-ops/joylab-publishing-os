import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const sitemapPath = path.join(dist, 'sitemap.xml');
const failures = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function pageFileFromUrl(loc) {
  const url = new URL(loc);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return path.join(dist, 'index.html');
  return path.join(dist, pathname.replace(/^\//, ''), 'index.html');
}

function extractMeta(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const n = tag.match(/name=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (n === name.toLowerCase()) return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? '';
  }
  return '';
}

function normalizeUrl(value) {
  try { return new URL(value).toString(); } catch { return value; }
}

function extractCanonical(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (rel === 'canonical') return tag.match(/href=["']([^"']+)["']/i)?.[1] ?? '';
  }
  return '';
}

if (!fs.existsSync(sitemapPath)) failures.push('dist/sitemap.xml is missing');

const sitemap = fs.existsSync(sitemapPath) ? read(sitemapPath) : '';
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
  normalizeUrl(m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
);

const duplicates = locs.filter((loc, index) => locs.indexOf(loc) !== index);
for (const loc of new Set(duplicates)) failures.push('duplicate sitemap URL: ' + loc);

for (const loc of locs) {
  const url = new URL(loc);
  if (url.origin !== 'https://aijoylab.kr') failures.push('off-origin sitemap URL: ' + loc);
  if (url.pathname !== '/' && url.pathname.endsWith('/')) failures.push('trailing-slash sitemap URL: ' + loc);
  if (url.pathname === '/search') failures.push('internal search page must not be in sitemap: ' + loc);

  const file = pageFileFromUrl(loc);
  if (!fs.existsSync(file)) {
    failures.push('sitemap URL has no built canonical page: ' + loc);
    continue;
  }
  const html = read(file);
  const canonical = normalizeUrl(extractCanonical(html));
  const robots = extractMeta(html, 'robots').toLowerCase();
  if (canonical !== loc) failures.push('canonical mismatch: sitemap=' + loc + ' canonical=' + canonical);
  if (robots.includes('noindex')) failures.push('noindex page present in sitemap: ' + loc);
}

function expectedIndexablePages(base, prefix) {
  if (!fs.existsSync(base)) return [];
  return walk(base)
    .filter((file) => path.basename(file) === 'index.html')
    .map((file) => {
      const rel = path.relative(base, file).split(path.sep);
      if (prefix === 'books' && rel.length !== 2) return null;
      const slug = rel.slice(0, -1).join('/');
      return normalizeUrl(new URL('/' + prefix + '/' + slug, 'https://aijoylab.kr').toString());
    })
    .filter(Boolean);
}

const expected = [
  ...expectedIndexablePages(path.join(dist, 'articles'), 'articles'),
  ...expectedIndexablePages(path.join(dist, 'books'), 'books'),
  ...expectedIndexablePages(path.join(dist, 'guides'), 'guides')
];

for (const loc of expected) {
  const file = pageFileFromUrl(loc);
  const html = read(file);
  const robots = extractMeta(html, 'robots').toLowerCase();
  if (robots.includes('noindex')) continue;
  if (!locs.includes(loc)) failures.push('indexable built page missing from sitemap: ' + loc);
}

const required = [
  'https://aijoylab.kr/',
  'https://aijoylab.kr/about',
  'https://aijoylab.kr/contact',
  'https://aijoylab.kr/privacy',
  'https://aijoylab.kr/articles',
  'https://aijoylab.kr/books'
];
for (const loc of required) {
  if (!locs.includes(loc)) failures.push('required canonical page missing from sitemap: ' + loc);
}

console.log('Indexability Gate: sitemap URLs=' + locs.length + ', discovered built indexable pages=' + expected.length);
if (failures.length) {
  console.error('Indexability Gate FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('Indexability Gate PASS');

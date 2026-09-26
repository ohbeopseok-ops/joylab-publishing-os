import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const siteOrigin = 'https://aijoylab.kr';
const errors = [];
const notices = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rel(file) {
  return path.relative(dist, file).split(path.sep).join('/');
}

function routeForHtml(file) {
  const r = rel(file);
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'/index.html'.length);
  return '/' + r.replace(/\.html$/, '');
}

function hasNoindex(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some(({ 0: tag }) =>
    /name\s*=\s*["']robots["']/i.test(tag) &&
    /content\s*=\s*["'][^"']*\bnoindex\b/i.test(tag)
  );
}

function internalPath(raw) {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('#')) return null;
  if (/^(?:mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  try {
    const url = new URL(value, siteOrigin);
    if (url.origin !== siteOrigin) return null;
    return decodeURI(url.pathname);
  } catch {
    return null;
  }
}

function candidates(pathname) {
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean) return ['index.html'];
  const out = [clean];
  if (!path.posix.extname(clean)) {
    out.push(clean + '.html', clean + '/index.html');
  }
  return out;
}

if (!fs.existsSync(dist)) {
  console.error('AdSense Site Readiness V1: dist/ missing. Run npm run build first.');
  process.exit(1);
}

const files = walk(dist);
const existing = new Set(files.map(rel));
const htmlFiles = files.filter((file) => file.endsWith('.html'));

let checkedLinks = 0;
const broken = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const sourceRoute = routeForHtml(file);
  const hrefs = [...html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);

  for (const href of hrefs) {
    const pathname = internalPath(href);
    if (!pathname) continue;
    checkedLinks += 1;
    if (candidates(pathname).some((candidate) => existing.has(candidate))) continue;
    const key = sourceRoute + ' -> ' + pathname;
    broken.set(key, (broken.get(key) || 0) + 1);
  }
}

for (const key of broken.keys()) errors.push('broken internal link: ' + key);

const robotsFile = path.join(dist, 'robots.txt');
const sitemapFile = path.join(dist, 'sitemap.xml');

if (!fs.existsSync(robotsFile)) {
  errors.push('robots.txt missing from build output');
} else {
  const robots = fs.readFileSync(robotsFile, 'utf8');
  if (!/Sitemap:\s*https:\/\/aijoylab\.kr\/sitemap\.xml/i.test(robots)) {
    errors.push('robots.txt does not advertise canonical sitemap');
  }
}

const sitemapRoutes = new Set();
if (!fs.existsSync(sitemapFile)) {
  errors.push('sitemap.xml missing from build output');
} else {
  const sitemap = fs.readFileSync(sitemapFile, 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length < 10) errors.push('sitemap has fewer than 10 URLs: ' + locs.length);

  for (const loc of locs) {
    try {
      const url = new URL(loc);
      if (url.origin !== siteOrigin) {
        errors.push('non-canonical sitemap origin: ' + loc);
        continue;
      }
      sitemapRoutes.add(url.pathname.replace(/\/+$/, '') || '/');
      if (!candidates(url.pathname).some((candidate) => existing.has(candidate))) {
        errors.push('sitemap URL has no built page: ' + url.pathname);
      }
    } catch {
      errors.push('invalid sitemap URL: ' + loc);
    }
  }
}

const excludedCoveragePrefixes = ['/ops/', '/labs/'];
const indexableRoutes = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeForHtml(file).replace(/\/+$/, '') || '/';
  if (hasNoindex(html)) continue;
  if (excludedCoveragePrefixes.some((prefix) => route.startsWith(prefix))) continue;
  indexableRoutes.push(route);
}

const sitemapCovered = indexableRoutes.filter((route) => sitemapRoutes.has(route));
const coverage = indexableRoutes.length ? sitemapCovered.length / indexableRoutes.length : 0;
if (coverage < 0.8) {
  errors.push(
    'sitemap coverage below 80%: ' +
    sitemapCovered.length + '/' + indexableRoutes.length +
    ' (' + (coverage * 100).toFixed(1) + '%)'
  );
}

const searchCandidates = ['search/index.html', 'search.html'];
const searchFile = searchCandidates.find((candidate) => existing.has(candidate));
if (!searchFile) {
  errors.push('/search build output missing');
} else {
  const searchHtml = fs.readFileSync(path.join(dist, searchFile), 'utf8');
  if (!hasNoindex(searchHtml)) errors.push('/search must be noindex,follow');
  if (sitemapRoutes.has('/search')) errors.push('/search must not appear in sitemap');
}

for (const file of htmlFiles) {
  const route = routeForHtml(file).replace(/\/+$/, '') || '/';
  if (!/^\/(?:tag|tags)(?:\/|$)/i.test(route)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (!hasNoindex(html)) errors.push(route + ' tag page must be noindex');
  if (sitemapRoutes.has(route)) errors.push(route + ' tag page must not appear in sitemap');
}

notices.push('HTML pages checked: ' + htmlFiles.length);
notices.push('Internal links checked: ' + checkedLinks);
notices.push('Broken internal links: ' + broken.size);
notices.push('Sitemap URLs: ' + sitemapRoutes.size);
notices.push(
  'Sitemap/indexable build coverage: ' +
  sitemapCovered.length + '/' + indexableRoutes.length +
  ' (' + (coverage * 100).toFixed(1) + '%)'
);

for (const notice of notices) console.log('INFO ' + notice);

if (errors.length) {
  console.error('AdSense Site Readiness V1 failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log('PASS AdSense Site Readiness V1');

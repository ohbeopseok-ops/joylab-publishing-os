import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'data', 'articles');
const booksDir = path.join(root, 'src', 'data', 'books');
const homepagePath = path.join(root, 'src', 'pages', 'index.astro');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

function fm(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function bool(frontmatter, key) {
  return scalar(frontmatter, key).toLowerCase() === 'true';
}

function number(frontmatter, key) {
  const raw = scalar(frontmatter, key);
  return raw ? Number(raw) : null;
}

function idFromFile(file) {
  return path.basename(file, '.md');
}

function loadCollection(dir) {
  return walk(dir).map((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const frontmatter = fm(text);
    return {
      id: idFromFile(file),
      title: scalar(frontmatter, 'title'),
      category: scalar(frontmatter, 'category'),
      publishedAt: scalar(frontmatter, 'publishedAt'),
      featuredAt: scalar(frontmatter, 'featuredAt') || null,
      draft: bool(frontmatter, 'draft'),
      homeFeatured: bool(frontmatter, 'homeFeatured'),
      excludeFromLatest: bool(frontmatter, 'excludeFromLatest'),
      homePriority: number(frontmatter, 'homePriority')
    };
  });
}

const failures = [];
const warnings = [];
const articles = loadCollection(articlesDir)
  .filter((item) => !item.draft)
  .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const books = loadCollection(booksDir)
  .filter((item) => !item.draft)
  .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

const editorialCategories = ['투자·경제', 'AI·생산성', '성장·리더십'];
const editorialPicks = editorialCategories
  .map((category) => articles.find((item) => item.category === category))
  .filter(Boolean);
const editorialIds = new Set(editorialPicks.map((item) => item.id));

const homeSlotContractActive = articles.some((item) => item.homeFeatured || item.excludeFromLatest || item.homePriority != null);
const configuredMajor = articles
  .filter((item) => item.homeFeatured)
  .sort((a, b) => (a.homePriority ?? 999) - (b.homePriority ?? 999) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const majorSeedIds = new Set(configuredMajor.map((item) => item.id));
const majorResearch = homeSlotContractActive
  ? [...configuredMajor, ...articles.filter((item) => !majorSeedIds.has(item.id))].slice(0, 4)
  : articles.slice(0, 4);
const majorIds = new Set(majorResearch.map((item) => item.id));
const latestResearch = homeSlotContractActive
  ? articles.filter((item) => !item.excludeFromLatest && !editorialIds.has(item.id) && !majorIds.has(item.id)).slice(0, 5)
  : articles.slice(0, 5);

const featuredBook = [...books].sort((a, b) => {
  const featuredDelta = Date.parse(b.featuredAt || '1970-01-01') - Date.parse(a.featuredAt || '1970-01-01');
  return featuredDelta || Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
})[0] ?? null;

if (editorialPicks.length !== Math.min(3, new Set(articles.map((a) => a.category).filter((c) => editorialCategories.includes(c))).size)) {
  failures.push({ rule: 'editorial-category-coverage', actual: editorialPicks.map((x) => x.category) });
}
if (new Set(editorialPicks.map((x) => x.category)).size !== editorialPicks.length) {
  failures.push({ rule: 'editorial-category-duplicate' });
}
if (majorResearch.length > 4) failures.push({ rule: 'major-max-4', count: majorResearch.length });
if (latestResearch.length > 5) failures.push({ rule: 'latest-max-5', count: latestResearch.length });

for (const item of latestResearch) {
  if (item.excludeFromLatest) failures.push({ rule: 'latest-exclusion-leak', id: item.id });
  if (editorialIds.has(item.id)) failures.push({ rule: 'latest-editorial-overlap', id: item.id });
  if (majorIds.has(item.id)) failures.push({ rule: 'latest-major-overlap', id: item.id });
}
if (!featuredBook && books.length) failures.push({ rule: 'featured-book-selection-missing' });

const homepage = fs.readFileSync(homepagePath, 'utf8');
const sourceRules = [
  {
    rule: 'articles-collection-source',
    ok: /getCollection\('articles'\)/.test(homepage)
  },
  {
    rule: 'books-collection-source',
    ok: /getCollection\('books'\)/.test(homepage)
  },
  {
    rule: 'latest-built-from-articles',
    ok: /const\s+latestResearch\s*=\s*homeSlotContractActive[\s\S]*?articles[\s\S]*?slice\(0,\s*5\)/.test(homepage)
  },
  {
    rule: 'latest-renders-article-links',
    ok: /latestResearch\.map\([\s\S]*?href=\{\`\/articles\/\$\{article\.id\}\`\}/.test(homepage)
  },
  {
    rule: 'books-slot-renders-book-links',
    ok: /featuredBook[\s\S]*?href=\{\`\/books\/\$\{featuredBook\.id\}\`\}/.test(homepage)
  }
];
for (const check of sourceRules) {
  if (!check.ok) failures.push({ rule: check.rule, file: 'src/pages/index.astro' });
}

const allSlotIds = {
  editorial: editorialPicks.map((x) => x.id),
  major: majorResearch.map((x) => x.id),
  latest: latestResearch.map((x) => x.id),
  featuredBook: featuredBook?.id ?? null
};

const report = {
  gate: 'Home Content Slot Contract V1',
  contractActive: homeSlotContractActive,
  totals: {
    publicArticles: articles.length,
    publicBooks: books.length,
    failures: failures.length,
    warnings: warnings.length
  },
  slots: allSlotIds,
  warnings,
  failures
};

const outDir = path.join(root, 'qa-artifacts', 'home-content-slot-contract-v1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error('Home Content Slot Contract V1 BLOCKED');
  process.exit(1);
}
console.log('Home Content Slot Contract V1 PASS');

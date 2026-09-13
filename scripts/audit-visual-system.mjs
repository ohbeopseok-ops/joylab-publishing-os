import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/data/research-image-manifest.json'), 'utf8'));
const curated = JSON.parse(fs.readFileSync(path.join(root, 'src/data/curated-research-images.json'), 'utf8'));
const placement = JSON.parse(fs.readFileSync(path.join(root, 'src/data/research-visual-placement.json'), 'utf8'));

const DEFAULT_HERO = '/images/research/joylab-research-default-hero.svg';
const GENERIC_SUPPORT = new Set([
  '/images/research/joylab-research-signal.svg',
  '/images/research/joylab-research-framework.svg',
  '/images/research/joylab-research-compare.svg'
]);

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const out = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    out[m[1]] = value;
  }
  return out;
}

const articles = fs.readdirSync(articleDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => {
    const id = name.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(articleDir, name), 'utf8');
    const fm = parseFrontmatter(raw);
    return {
      id,
      title: fm.title || id,
      category: fm.category || '',
      series: fm.series || '',
      draft: fm.draft === true,
      featured: fm.featured === true,
      publishedAt: fm.publishedAt || '1970-01-01'
    };
  })
  .filter((article) => !article.draft)
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt) || a.id.localeCompare(b.id));

const home4 = articles.slice(0, 4);
const homeIds = new Set(home4.map((article) => article.id));
const publishedResearch = articles.filter((article) => article.series);

function effectiveVisual(id) {
  return curated[id] || manifest[id] || null;
}

function modeFor(id, visual) {
  if (curated[id]) return 'CURATED_OVERLAY';
  if (visual?.hero?.src && visual.hero.src !== DEFAULT_HERO) return 'CURATED_EXISTING';
  if (visual) return 'AUTO_BASELINE';
  return 'NONE';
}

function priorityFor(article, mode) {
  if (homeIds.has(article.id) && mode === 'AUTO_BASELINE') return 'P0_HOME';
  if (homeIds.has(article.id)) return 'P0_REVIEW';
  if (article.featured && mode === 'AUTO_BASELINE') return 'P1_FEATURED';
  if (mode === 'AUTO_BASELINE' && /compare|comparison|vs-|value-chain/i.test(`${article.id} ${article.title}`)) return 'P1_COMPARE';
  if (mode === 'AUTO_BASELINE') return 'P2_REPLACE';
  return 'P3_MAINTAIN';
}

const audit = publishedResearch.map((article) => {
  const visual = effectiveVisual(article.id);
  const hero = visual?.hero || null;
  const supporting = Array.isArray(visual?.supporting) ? visual.supporting : [];
  const mode = modeFor(article.id, visual);
  const placements = Array.isArray(placement[article.id]?.supporting) ? placement[article.id].supporting : [];
  const defaultHero = hero?.src === DEFAULT_HERO;
  const genericSupportCount = supporting.filter((image) => GENERIC_SUPPORT.has(image?.src)).length;
  const missing = !hero?.src || supporting.length < 2 || supporting.some((image) => !image?.src || !image?.alt);
  const placementComplete = supporting.length > 0 && placements.length >= supporting.length;

  let verdict = 'GOOD';
  let reason = 'Dedicated Hero and semantic placement are both present.';
  if (missing) {
    verdict = 'MISSING';
    reason = 'Hero/supporting/alt contract is incomplete.';
  } else if (defaultHero || genericSupportCount > 0) {
    verdict = 'REPLACE';
    reason = defaultHero ? 'Shared default Hero is still used.' : 'Generic supporting visual is still used.';
  } else if (!placementComplete) {
    verdict = 'REPOSITION';
    reason = `Dedicated visuals exist, but ${supporting.length - placements.length} supporting visual(s) remain unanchored.`;
  }

  return {
    ...article,
    mode,
    verdict,
    reason,
    hero: hero?.src || '',
    supporting: supporting.length,
    placed: placements.length,
    priority: priorityFor(article, mode)
  };
});

const replaceQueue = audit
  .filter((row) => row.verdict === 'REPLACE')
  .sort((a, b) => {
    const rank = { P0_HOME: 0, P0_REVIEW: 1, P1_FEATURED: 2, P1_COMPARE: 3, P2_REPLACE: 4, P3_MAINTAIN: 5 };
    return rank[a.priority] - rank[b.priority] || new Date(b.publishedAt) - new Date(a.publishedAt) || a.id.localeCompare(b.id);
  });

const counts = audit.reduce((acc, row) => {
  acc[row.verdict] = (acc[row.verdict] || 0) + 1;
  acc[row.mode] = (acc[row.mode] || 0) + 1;
  return acc;
}, {});

console.log('VISUAL_AUDIT_SUMMARY ' + JSON.stringify({
  publishedArticles: articles.length,
  publishedResearch: publishedResearch.length,
  home4: home4.map((a) => a.id),
  counts,
  replaceQueueCount: replaceQueue.length
}));

console.log('\n=== HOME 4 ===');
for (const article of home4) {
  const row = audit.find((item) => item.id === article.id);
  const visual = effectiveVisual(article.id);
  const mode = modeFor(article.id, visual);
  console.log(JSON.stringify({
    id: article.id,
    title: article.title,
    publishedAt: article.publishedAt,
    mode,
    hero: visual?.hero?.src || '',
    heroVerdict: visual?.hero?.src === DEFAULT_HERO ? 'REPLACE' : visual?.hero?.src ? 'GOOD' : 'MISSING',
    articleVerdict: row?.verdict || 'N/A'
  }));
}

console.log('\n=== REPLACE QUEUE ===');
for (const row of replaceQueue) {
  console.log(JSON.stringify({ id: row.id, title: row.title, series: row.series, priority: row.priority, reason: row.reason }));
}

console.log('\n=== FULL AUDIT ===');
for (const row of audit) {
  console.log(JSON.stringify({
    id: row.id,
    title: row.title,
    series: row.series,
    mode: row.mode,
    verdict: row.verdict,
    priority: row.priority,
    supporting: row.supporting,
    placed: row.placed,
    reason: row.reason
  }));
}

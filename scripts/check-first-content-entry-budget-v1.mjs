import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const rules = JSON.parse(fs.readFileSync(path.join(root, 'src/data/mobile-experience-contract-v1.json'), 'utf8'));
const articleRoot = path.join(root, 'dist', 'articles');
const outDir = path.join(root, 'qa-artifacts', 'first-content-entry-budget-v1');
fs.mkdirSync(outDir, { recursive: true });

const slugs = fs.existsSync(articleRoot)
  ? fs.readdirSync(articleRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(articleRoot, e.name, 'index.html')))
      .map((e) => e.name)
      .sort()
  : [];

if (!slugs.length) {
  console.error('First Content Entry Budget V1 FAILED: no rendered articles found.');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: rules.firstContentEntry.viewport, deviceScaleFactor: 1 });
const page = await context.newPage();
const results = [];
const failures = [];

for (const slug of slugs) {
  const response = await page.goto(baseURL + '/articles/' + slug, { waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!response || response.status() >= 400) {
    failures.push(slug + ': HTTP ' + (response?.status() ?? 0));
    continue;
  }
  await page.waitForTimeout(40);
  const metrics = await page.evaluate(() => {
    const brief = document.querySelector('#brief-title');
    const firstBodyH2 = document.querySelector('#article-content h2');
    const top = (el) => el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
    return {
      briefTop: top(brief),
      firstBodyH2Top: top(firstBodyH2),
      title: document.querySelector('h1')?.textContent?.trim() ?? ''
    };
  });
  const checks = {
    briefPresent: metrics.briefTop !== null,
    firstBodyH2Present: metrics.firstBodyH2Top !== null,
    briefWithinBudget: metrics.briefTop !== null && metrics.briefTop <= rules.firstContentEntry.researchBriefTopPx,
    firstBodyH2WithinBudget: metrics.firstBodyH2Top !== null && metrics.firstBodyH2Top <= rules.firstContentEntry.firstBodyH2TopPx
  };
  const passed = Object.values(checks).every(Boolean);
  results.push({ slug, ...metrics, checks, passed });
  if (!passed) failures.push(slug + ': ' + Object.entries(checks).filter(([,ok]) => !ok).map(([k])=>k).join(','));
}

await browser.close();

const maxBrief = Math.max(...results.map((r)=>r.briefTop ?? 0));
const maxH2 = Math.max(...results.map((r)=>r.firstBodyH2Top ?? 0));
const summary = {
  generatedAt: new Date().toISOString(),
  articles: results.length,
  budgets: rules.firstContentEntry,
  maxObserved: { researchBriefTopPx: maxBrief, firstBodyH2TopPx: maxH2 },
  failures,
  results
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));

for (const r of results) {
  console.log((r.passed ? 'PASS ' : 'FAIL ') + r.slug + ' brief=' + r.briefTop + ' firstH2=' + r.firstBodyH2Top);
}
if (failures.length) {
  console.error('First Content Entry Budget V1 FAILED: ' + failures.length + ' article(s). Max observed brief=' + maxBrief + ' firstH2=' + maxH2);
  process.exit(1);
}
console.log('First Content Entry Budget V1 PASS: ' + results.length + ' articles. Max observed brief=' + maxBrief + ' firstH2=' + maxH2);

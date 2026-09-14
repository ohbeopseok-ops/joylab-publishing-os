import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/article-archive';
const articlePath = '/articles/china-us-treasury-holdings-2026';
const screenshots = [];
const results = [];
const failures = [];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function triggerLazy(page) {
  await page.evaluate(async () => {
    const step = Math.max(320, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});
}

async function pageHealth(page) {
  return page.evaluate(() => ({
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
    brokenImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src') || 'unknown'),
  }));
}

async function runArticle(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  // Astro preview does not host the Cloudflare Worker analytics route used in production.
  // Mock only this endpoint so unrelated 4xx/5xx and browser errors still fail the GOLD case.
  await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const response = await page.goto(`${baseURL}${articlePath}`, { waitUntil: 'networkidle' });
  await triggerLazy(page);
  const health = await pageHealth(page);
  const structure = await page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.trim() || '';
    const visible = (sel) => {
      const el = document.querySelector(sel); if (!el) return false;
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };
    const hero = document.querySelector('article figure img');
    return {
      h1: text('article h1'),
      cover: visible('.research-cover'),
      layout: visible('.research-layout'),
      content: visible('.research-v2-content'),
      brief: visible('.research-brief'),
      heroOk: Boolean(hero && hero.complete && hero.naturalWidth > 0),
    };
  });
  const name = `article-${viewport.width}`;
  const screenshot = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  screenshots.push(screenshot);
  const checks = {
    httpOk: (response?.status() ?? 0) >= 200 && (response?.status() ?? 0) < 400,
    noOverflow: health.overflow <= 1,
    noBrokenImages: health.brokenImages.length === 0,
    noErrors: errors.length === 0,
    h1Present: structure.h1.length > 10,
    coreStructureVisible: structure.cover && structure.layout && structure.content && structure.brief,
    heroOk: structure.heroOk,
  };
  const passed = Object.values(checks).every(Boolean);
  results.push({ kind: 'article', viewport, checks, health, structure, errors, passed, screenshot });
  if (!passed) failures.push(name);
  await context.close();
}

async function runArchive(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const response = await page.goto(`${baseURL}/#archive`, { waitUntil: 'networkidle' });
  await page.locator('#archive').scrollIntoViewIfNeeded();
  const initialCount = Number((await page.locator('#result-count').textContent())?.trim() || 0);

  await page.locator('#content-search').fill('Aside');
  await page.waitForTimeout(120);
  const searchCount = Number((await page.locator('#result-count').textContent())?.trim() || 0);
  const visibleAfterSearch = await page.locator('.article-card:not(.is-filtered-out):not(.is-page-hidden)').count();

  await page.locator('#clear-filter').click();
  await page.waitForTimeout(100);
  const aiChip = page.locator('.filter-chip', { hasText: 'AI·생산성' });
  await aiChip.click();
  await page.waitForTimeout(120);
  const aiVisibleCategories = await page.locator('.article-card:not(.is-filtered-out):not(.is-page-hidden)').evaluateAll((cards) => cards.map((c) => c.getAttribute('data-category')));
  const aiCount = Number((await page.locator('#result-count').textContent())?.trim() || 0);

  await page.locator('#clear-filter').click();
  await page.waitForTimeout(100);
  const resetCount = Number((await page.locator('#result-count').textContent())?.trim() || 0);
  const loadMore = page.locator('#load-more');
  const loadMoreVisible = await loadMore.isVisible();
  let loadMoreWorked = true;
  if (loadMoreVisible) {
    const before = await page.locator('.article-card:not(.is-page-hidden):not(.is-filtered-out)').count();
    await loadMore.click();
    await page.waitForTimeout(100);
    const after = await page.locator('.article-card:not(.is-page-hidden):not(.is-filtered-out)').count();
    loadMoreWorked = after > before || !(await loadMore.isVisible());
  }

  await triggerLazy(page);
  const health = await pageHealth(page);
  await page.locator('#archive').scrollIntoViewIfNeeded();
  const screenshot = path.join(outputDir, `archive-${viewport.width}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  screenshots.push(screenshot);

  const checks = {
    httpOk: (response?.status() ?? 0) >= 200 && (response?.status() ?? 0) < 400,
    initialContentPresent: initialCount > 0,
    searchNarrows: searchCount > 0 && searchCount < initialCount && visibleAfterSearch > 0,
    categoryFilterCorrect: aiCount > 0 && aiVisibleCategories.length > 0 && aiVisibleCategories.every((c) => c === 'AI·생산성'),
    clearRestores: resetCount === initialCount,
    loadMoreWorked,
    noOverflow: health.overflow <= 1,
    noBrokenImages: health.brokenImages.length === 0,
    noErrors: errors.length === 0,
  };
  const passed = Object.values(checks).every(Boolean);
  results.push({ kind: 'archive', viewport, checks, counts: { initialCount, searchCount, aiCount, resetCount }, health, errors, passed, screenshot });
  if (!passed) failures.push(`archive-${viewport.width}`);
  await context.close();
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) await runArticle(viewport);
for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) await runArchive(viewport);

await browser.close();
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({ baseURL, articlePath, generatedAt: new Date().toISOString(), results }, null, 2));
for (const r of results) console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.kind} ${r.viewport.width}px`);
if (failures.length) {
  console.error(`Article/Archive GOLD QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

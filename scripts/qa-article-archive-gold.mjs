import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/article-archive';
const articlePath = '/articles/china-us-treasury-holdings-2026';
const researchPath = '/research';
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
  await page.waitForTimeout(150);
}

async function pageHealth(page, visibleImagesOnly = false) {
  return page.evaluate((onlyVisible) => {
    const images = [...document.images].filter((img) => !onlyVisible || img.getClientRects().length > 0);
    return {
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
      brokenImages: images.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src') || 'unknown'),
    };
  }, visibleImagesOnly);
}

async function runArticle(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const response = await page.goto(`${baseURL}${articlePath}`, { waitUntil: 'networkidle' });
  await triggerLazy(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});
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
      toc: visible('.toc-card'),
      guideCta: visible('.research-guide-cta'),
      related: visible('.related-card'),
      heroOk: Boolean(hero && hero.complete && hero.naturalWidth > 0),
    };
  });
  const name = `article-${viewport.width}`;
  const screenshot = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  const checks = {
    httpOk: (response?.status() ?? 0) >= 200 && (response?.status() ?? 0) < 400,
    noOverflow: health.overflow <= 1,
    noBrokenImages: health.brokenImages.length === 0,
    noErrors: errors.length === 0,
    h1Present: structure.h1.length > 10,
    coreStructureVisible: structure.cover && structure.layout && structure.content && structure.brief,
    decisionAidsVisible: structure.toc && structure.guideCta && structure.related,
    heroOk: structure.heroOk,
  };
  const passed = Object.values(checks).every(Boolean);
  results.push({ kind: 'article', viewport, checks, health, structure, errors, passed, screenshot });
  if (!passed) failures.push(name);
  await context.close();
}

async function runResearch(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const response = await page.goto(`${baseURL}${researchPath}`, { waitUntil: 'networkidle' });
  const initialCount = Number((await page.locator('#research-count').textContent())?.trim() || 0);

  await page.locator('#research-search').fill('Aside');
  await page.waitForTimeout(120);
  const searchCount = Number((await page.locator('#research-count').textContent())?.trim() || 0);
  const visibleAfterSearch = await page.locator('.research-hub-card:visible').count();

  await page.locator('#research-clear').click();
  await page.waitForTimeout(100);
  const aiChip = page.locator('[data-research-category]', { hasText: 'AI·생산성' });
  await aiChip.click();
  await page.waitForTimeout(120);
  const aiVisibleCategories = await page.locator('.research-hub-card:visible').evaluateAll((cards) => cards.map((c) => c.getAttribute('data-category')));
  const aiCount = Number((await page.locator('#research-count').textContent())?.trim() || 0);

  await page.locator('#research-clear').click();
  await page.waitForTimeout(100);
  const resetCount = Number((await page.locator('#research-count').textContent())?.trim() || 0);
  const loadMore = page.locator('#research-more');
  const loadMoreVisible = await loadMore.isVisible();
  let loadMoreWorked = true;
  if (loadMoreVisible) {
    const before = await page.locator('.research-hub-card:visible').count();
    await loadMore.click();
    await page.waitForTimeout(100);
    const after = await page.locator('.research-hub-card:visible').count();
    loadMoreWorked = after > before || !(await loadMore.isVisible());
  }

  await triggerLazy(page);
  await page.waitForFunction(() => [...document.images].filter((img) => img.getClientRects().length > 0).every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});
  const health = await pageHealth(page, true);
  const screenshot = path.join(outputDir, `research-${viewport.width}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

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
  results.push({ kind: 'research', viewport, checks, counts: { initialCount, searchCount, aiCount, resetCount, visibleAfterSearch, aiVisible: aiVisibleCategories.length }, health, errors, passed, screenshot });
  if (!passed) failures.push(`research-${viewport.width}`);
  await context.close();
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) await runArticle(viewport);
for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) await runResearch(viewport);

await browser.close();
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({ baseURL, articlePath, researchPath, generatedAt: new Date().toISOString(), results }, null, 2));
for (const r of results) console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.kind} ${r.viewport.width}px`);
if (failures.length) {
  console.error(`Article/Research GOLD QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

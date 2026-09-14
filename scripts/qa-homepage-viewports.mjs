import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/homepage';
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1366', width: 1366, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`);
  });

  const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;

  // Trigger lazy-loaded media before measuring image health.
  await page.evaluate(async () => {
    const step = Math.max(320, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 120));
    window.scrollTo(0, 0);
  });

  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const imageState = [...document.images].map((img) => ({
      src: img.getAttribute('src') || 'unknown',
      complete: img.complete,
      naturalWidth: img.naturalWidth,
    }));
    const brokenImages = imageState
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src);
    const viewportWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    const docWidth = document.documentElement.scrollWidth;
    const visible = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    return {
      viewportWidth,
      bodyWidth,
      docWidth,
      overflow: Math.max(bodyWidth, docWidth) - viewportWidth,
      brokenImages,
      imageState,
      keyVisibility: {
        hero: visible('.home-hero'),
        pillars: visible('.home-pillars'),
        majorResearch: visible('.home-research-grid'),
        guide: visible('.home-guide'),
        archive: visible('.home-archive'),
      },
    };
  });

  const screenshot = path.join(outputDir, `${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

  const checks = {
    httpOk: status >= 200 && status < 400,
    noHorizontalOverflow: metrics.overflow <= 1,
    noBrokenImages: metrics.brokenImages.length === 0,
    noPageErrors: pageErrors.length === 0,
    keySectionsVisible: Object.values(metrics.keyVisibility).every(Boolean),
  };
  const passed = Object.values(checks).every(Boolean);
  report.push({ viewport, status, metrics, pageErrors, checks, passed, screenshot });
  if (!passed) failures.push(viewport.name);
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), report }, null, 2));

for (const item of report) {
  console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.viewport.name} overflow=${item.metrics.overflow}px broken=${item.metrics.brokenImages.length} errors=${item.pageErrors.length}`);
}

if (failures.length) {
  console.error(`Homepage viewport QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

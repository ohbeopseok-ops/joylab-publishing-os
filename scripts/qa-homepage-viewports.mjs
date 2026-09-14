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
  const metrics = await page.evaluate(() => {
    const brokenImages = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') || 'unknown');
    const bodyWidth = document.body.scrollWidth;
    const docWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
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

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/growth-literature';
const routes = [
  { name: 'literature-hub', path: '/guides/growth-leadership/literature' },
  { name: 'ep01-old-man-and-sea', path: '/guides/growth-leadership/literature/old-man-and-the-sea' },
  { name: 'performance-coaching', path: '/guides/growth-leadership/playbook/performance-coaching' },
];
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const route of routes) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    const response = await page.goto(`${baseURL}${route.path}`, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;
    const metrics = await page.evaluate(() => {
      const w = window.innerWidth;
      const maxWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
      const h1 = document.querySelector('h1');
      const main = document.querySelector('main');
      const header = document.querySelector('.site-header');
      const visible = (el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
      };
      return {
        overflow: maxWidth - w,
        h1Visible: visible(h1),
        mainVisible: visible(main),
        headerVisible: visible(header),
        h1Text: h1?.textContent?.trim() || '',
      };
    });

    const screenshot = path.join(outputDir, `${route.name}-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    const checks = {
      httpOk: status >= 200 && status < 400,
      noHorizontalOverflow: metrics.overflow <= 1,
      noPageErrors: errors.length === 0,
      h1Visible: metrics.h1Visible,
      mainVisible: metrics.mainVisible,
      headerVisible: metrics.headerVisible,
    };
    const passed = Object.values(checks).every(Boolean);
    if (!passed) failures.push(`${route.name}:${viewport.name}`);
    report.push({ route, viewport, status, metrics, errors, checks, passed, screenshot });
    await context.close();
  }
}

await browser.close();
await fs.writeFile(
  path.join(outputDir, 'report.json'),
  JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), report }, null, 2)
);

for (const item of report) {
  console.log(
    `${item.passed ? 'PASS' : 'FAIL'} ${item.route.name} ${item.viewport.name} overflow=${item.metrics.overflow}px errors=${item.errors.length}`
  );
}
if (failures.length) {
  console.error(`Growth Literature QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

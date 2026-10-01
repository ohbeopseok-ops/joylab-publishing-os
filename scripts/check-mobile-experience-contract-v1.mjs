import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const rules = JSON.parse(fs.readFileSync(path.join(root, 'src/data/mobile-experience-contract-v1.json'), 'utf8'));
const outDir = path.join(root, 'qa-artifacts', 'mobile-experience-contract-v1');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

for (const viewport of rules.viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  for (const item of rules.pages) {
    const page = await context.newPage();
    const response = await page.goto(baseURL + item.path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(250);
    const metrics = await page.evaluate(async () => {
      const fontStarted = performance.now();
      await document.fonts.ready;
      const fontReadyMs = performance.now() - fontStarted;
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : 0;
      const layoutEntries = performance.getEntriesByType('layout-shift');
      const cls = layoutEntries.reduce((sum, entry) => sum + (entry.hadRecentInput ? 0 : entry.value), 0);
      return {
        lcpMs: Math.round(lcp),
        cls: Number(cls.toFixed(4)),
        fontReadyMs: Math.round(fontReadyMs),
        fontsStatus: document.fonts.status,
        bodyFont: getComputedStyle(document.body).fontFamily
      };
    });
    const checks = {
      httpOk: Boolean(response && response.status() >= 200 && response.status() < 400),
      lcpWithinBudget: metrics.lcpMs > 0 && metrics.lcpMs <= rules.budgets.lcpMs,
      clsWithinBudget: metrics.cls <= rules.budgets.cls,
      fontsLoaded: metrics.fontsStatus === 'loaded',
      fontReadyWithinBudget: metrics.fontReadyMs <= rules.budgets.fontReadyMs,
      fontStackValid: rules.font.requiredFamilies.some((family) => metrics.bodyFont.includes(family))
    };
    const passed = Object.values(checks).every(Boolean);
    results.push({ viewport: viewport.name, page: item.name, path: item.path, metrics, checks, passed });
    if (!passed) failures.push(item.name + '/' + viewport.name + ': ' + Object.entries(checks).filter(([,ok]) => !ok).map(([k])=>k).join(','));
    await page.close();
  }
  await context.close();
}
await browser.close();

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), budgets: rules.budgets, failures, results }, null, 2));
for (const r of results) console.log((r.passed ? 'PASS ' : 'FAIL ') + r.page + '/' + r.viewport + ' LCP=' + r.metrics.lcpMs + 'ms CLS=' + r.metrics.cls + ' fontReady=' + r.metrics.fontReadyMs + 'ms');
if (failures.length) {
  console.error('JoyLab Mobile Experience Contract V1 FAILED: ' + failures.join(' | '));
  process.exit(1);
}
console.log('JoyLab Mobile Experience Contract V1 PASS: ' + results.length + ' checks.');

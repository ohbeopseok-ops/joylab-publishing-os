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
    const metrics = await page.evaluate(async () => {
      const started = performance.now();
      await document.fonts.ready;
      return {
        fontReadyMs: Math.round(performance.now() - started),
        fontsStatus: document.fonts.status,
        bodyFont: getComputedStyle(document.body).fontFamily
      };
    });
    const checks = {
      httpOk: Boolean(response && response.status() >= 200 && response.status() < 400),
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

fs.writeFileSync(path.join(outDir, 'font-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), failures, results }, null, 2));
for (const r of results) console.log((r.passed ? 'PASS ' : 'FAIL ') + r.page + '/' + r.viewport + ' fontReady=' + r.metrics.fontReadyMs + 'ms font=' + r.metrics.bodyFont);
if (failures.length) {
  console.error('Mobile Font Rendering Gate V1 FAILED: ' + failures.join(' | '));
  process.exit(1);
}
console.log('Mobile Font Rendering Gate V1 PASS: ' + results.length + ' checks.');

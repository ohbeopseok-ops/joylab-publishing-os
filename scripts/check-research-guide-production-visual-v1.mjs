import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.PRODUCTION_BASE_URL || 'https://aijoylab.kr';
const out = path.join(process.cwd(), 'qa-artifacts', 'research-guide-production-visual-gold');
await fs.mkdir(out, { recursive: true });

const viewports = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];

const pages = [
  { name: 'shipbuilding', path: '/guides/shipbuilding', graphSpan: '.sg-graph-span', rail: '.sg-rail', content: '.sg-content' },
  { name: 'semiconductor', path: '/guides/semiconductor-investing', graphSpan: '.sg-graph-span', rail: '.sg-rail', content: '.sg-content' },
  { name: 'growth-leadership', path: '/guides/growth-leadership', graphSpan: '.sg-graph-span', rail: '.sg-rail', content: '.sg-content' },
  { name: 'financials', path: '/guides/financials-value-up', graphSpan: '.fvg-graph-span', rail: '.fvg-rail', content: '.fvg-content' },
  { name: 'ai-power', path: '/guides/ai-power-infrastructure', graphSpan: '.sg-graph-span', rail: '.sg-rail', content: '.sg-content' }
];

const browser = await chromium.launch({ headless: true });
const failures = [];
const results = [];

async function waitForProductionContract(page, item) {
  const deadline = Date.now() + 8 * 60 * 1000;
  let last = '';
  while (Date.now() < deadline) {
    const response = await page.goto(baseURL + item.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const status = response?.status() ?? 0;
    await page.waitForTimeout(1200);
    const state = await page.evaluate(({ graphSpan, rail, content }) => ({
      graphSpan: !!document.querySelector(graphSpan),
      rail: !!document.querySelector(rail),
      content: !!document.querySelector(content)
    }), item);
    if (status >= 200 && status < 400 && state.graphSpan && state.rail && state.content) return status;
    last = JSON.stringify({ status, ...state });
    await page.waitForTimeout(15000);
  }
  throw new Error('Production contract did not appear for ' + item.path + ': ' + last);
}

for (const viewport of viewports) {
  for (const item of pages) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();

    const status = await waitForProductionContract(page, item);

    const metrics = await page.evaluate(({ graphSpan, rail, content }) => {
      const doc = document.documentElement;
      const span = document.querySelector(graphSpan);
      const railEl = document.querySelector(rail);
      const contentEl = document.querySelector(content);
      const spanRect = span?.getBoundingClientRect();
      const railRect = railEl?.getBoundingClientRect();
      const contentRect = contentEl?.getBoundingClientRect();
      const parentRect = span?.parentElement?.getBoundingClientRect();

      const canvas = span?.querySelector('.rg__canvas');
      const flowWrap = span?.querySelector('.rg__flow-wrap');

      return {
        viewportWidth: window.innerWidth,
        pageScrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
        graphSpanWidth: spanRect?.width ?? 0,
        graphParentWidth: parentRect?.width ?? 0,
        railWidth: railRect?.width ?? 0,
        contentWidth: contentRect?.width ?? 0,
        graphCanvasOverflow: canvas ? canvas.scrollWidth - canvas.clientWidth : 0,
        graphFlowOverflow: flowWrap ? flowWrap.scrollWidth - flowWrap.clientWidth : 0
      };
    }, item);

    const checks = {
      httpOk: status >= 200 && status < 400,
      noPageOverflow: metrics.pageScrollWidth - metrics.viewportWidth <= 1,
      graphUsesFullRow: Math.abs(metrics.graphParentWidth - metrics.graphSpanWidth) <= 2,
      railHealthy: metrics.railWidth >= 260,
      contentHealthy: metrics.contentWidth >= 560,
      noGraphCanvasOverflow: metrics.graphCanvasOverflow <= 1,
      noGraphFlowOverflow: metrics.graphFlowOverflow <= 1
    };

    const passed = Object.values(checks).every(Boolean);
    const screenshot = path.join(out, item.name + '-' + viewport.name + '.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    results.push({ item, viewport, status, metrics, checks, passed, screenshot });
    if (!passed) failures.push(item.name + '/' + viewport.name + ': ' + Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key).join(', '));

    await context.close();
  }
}

await browser.close();

await fs.writeFile(
  path.join(out, 'report.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, results }, null, 2)
);

for (const result of results) {
  console.log(
    (result.passed ? 'PASS' : 'FAIL') + ' ' + result.item.name + '/' + result.viewport.name +
    ' pageOverflow=' + (result.metrics.pageScrollWidth - result.metrics.viewportWidth) +
    ' graphSpan=' + Math.round(result.metrics.graphSpanWidth) +
    ' rail=' + Math.round(result.metrics.railWidth) +
    ' content=' + Math.round(result.metrics.contentWidth)
  );
}

if (failures.length) {
  console.error('\nProduction Visual GOLD failed:\n' + failures.map((x) => '- ' + x).join('\n'));
  process.exit(1);
}

console.log('\nProduction Visual GOLD PASS · 5 guides × 2 desktop viewports');

import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'research-graph-responsive-gold');
await fs.mkdir(out, { recursive: true });

const contract = JSON.parse(await fs.readFile(path.join(process.cwd(), 'config', 'research-graph-responsive-contract-v1.json'), 'utf8'));
if (contract.contract !== 'JoyLab.ResearchGraphResponsive') throw new Error('Invalid responsive contract');
const viewports = contract.viewports;
const pages = contract.pages;

const failures = [];
const results = [];
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  for (const item of pages) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));

    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const benignGoogle =
        (text.includes('[Report Only]') && text.includes("frame-ancestors 'self'")) ||
        text.includes('fundingchoicesmessages.google.com');
      if (!benignGoogle) pageErrors.push('console: ' + text);
    });

    const response = await page.goto(baseURL + item.path, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;
    await page.waitForSelector('[data-research-map-v3]', { timeout: 8000 });

    const firstLastCheck = await page.evaluate(() => {
      const root = document.querySelector('[data-research-map-v3]');
      const canvas = root?.querySelector('[data-rg-canvas]');
      const flowWrap = root?.querySelector('.rg__flow-wrap');
      const grid = root?.querySelector('.rg__grid');
      const columns = [...(root?.querySelectorAll('.rg__column') ?? [])];
      const flowNodes = [...(root?.querySelectorAll('.rg__flow-node') ?? [])];
      const rootRect = root?.getBoundingClientRect();

      const within = (rect, container, tolerance = 1) =>
        rect.left >= container.left - tolerance &&
        rect.right <= container.right + tolerance;

      const canvasRect = canvas?.getBoundingClientRect();
      const firstColumnRect = columns[0]?.getBoundingClientRect();
      const lastColumnRect = columns.at(-1)?.getBoundingClientRect();
      const firstFlowRect = flowNodes[0]?.getBoundingClientRect();
      const lastFlowRect = flowNodes.at(-1)?.getBoundingClientRect();

      return {
        rootWidth: rootRect?.width ?? 0,
        canvasClientWidth: canvas?.clientWidth ?? 0,
        canvasScrollWidth: canvas?.scrollWidth ?? 0,
        flowClientWidth: flowWrap?.clientWidth ?? 0,
        flowScrollWidth: flowWrap?.scrollWidth ?? 0,
        gridWidth: grid?.getBoundingClientRect().width ?? 0,
        columnCount: columns.length,
        flowNodeCount: flowNodes.length,
        firstLastColumnsInsideCanvas:
          !!canvasRect && !!firstColumnRect && !!lastColumnRect &&
          within(firstColumnRect, canvasRect) && within(lastColumnRect, canvasRect),
        firstLastFlowInsideRoot:
          !!rootRect && !!firstFlowRect && !!lastFlowRect &&
          within(firstFlowRect, rootRect) && within(lastFlowRect, rootRect)
      };
    });

    const documentMetrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    }));

    if (viewport.width === 390) {
      const lastFlow = page.locator('.rg__flow-node').last();
      await lastFlow.click();
      const activeId = await lastFlow.getAttribute('data-node-id');
      const activeCount = await page.locator(`.rg__grid [data-node-id="${activeId}"].is-active`).count();
      firstLastCheck.mobileLastNodeSelectable = activeCount === 1;
    }

    const desktopLike = viewport.width >= contract.desktopMinWidth;
    const checks = {
      httpOk: status >= 200 && status < 400,
      graphPresent: firstLastCheck.columnCount === 5 && firstLastCheck.flowNodeCount >= 5,
      noPageOverflow: documentMetrics.scrollWidth - documentMetrics.viewportWidth <= contract.pageOverflowTolerancePx,
      noPageErrors: pageErrors.length === 0,
      noDesktopCanvasOverflow: !desktopLike || firstLastCheck.canvasScrollWidth - firstLastCheck.canvasClientWidth <= contract.desktopInternalOverflowTolerancePx,
      noDesktopFlowOverflow: !desktopLike || firstLastCheck.flowScrollWidth - firstLastCheck.flowClientWidth <= contract.desktopInternalOverflowTolerancePx,
      desktopFirstLastVisible: !desktopLike || (firstLastCheck.firstLastColumnsInsideCanvas && firstLastCheck.firstLastFlowInsideRoot),
      mobileLastNodeSelectable: viewport.width !== 390 || firstLastCheck.mobileLastNodeSelectable === true
    };

    const passed = Object.values(checks).every(Boolean);
    const screenshot = path.join(out, `${item.name}-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    const record = {
      page: item,
      viewport,
      status,
      pageErrors,
      documentMetrics,
      graphMetrics: firstLastCheck,
      checks,
      passed,
      screenshot
    };
    results.push(record);

    if (!passed) {
      failures.push(`${item.name}/${viewport.name}: ${Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key).join(', ')}`);
    }

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
    `${result.passed ? 'PASS' : 'FAIL'} ${result.page.name}/${result.viewport.name} ` +
    `pageOverflow=${result.documentMetrics.scrollWidth - result.documentMetrics.viewportWidth} ` +
    `canvasOverflow=${result.graphMetrics.canvasScrollWidth - result.graphMetrics.canvasClientWidth} ` +
    `flowOverflow=${result.graphMetrics.flowScrollWidth - result.graphMetrics.flowClientWidth}`
  );
}

if (failures.length) {
  console.error('\nResearch Graph Responsive GOLD failed:\n' + failures.map((x) => '- ' + x).join('\n'));
  process.exit(1);
}

console.log('\nResearch Graph Responsive GOLD PASS · 5 graph pages × 4 viewports');

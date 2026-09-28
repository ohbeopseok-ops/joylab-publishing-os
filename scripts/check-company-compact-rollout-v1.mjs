import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outDir = path.join(process.cwd(), 'qa-artifacts', 'company-compact-rollout');
await fs.mkdir(outDir, { recursive: true });

const pages = [
  { name: 'samsung', path: '/articles/samsung-electronics-outlook', signalNode: 'memory-mix', signalId: 'hbm', expectedHub: '/guides/semiconductor-investing' },
  { name: 'sk-hynix', path: '/articles/sk-hynix-outlook', signalNode: 'hbm-execution', signalId: 'hbm4', expectedHub: '/guides/semiconductor-investing' },
  { name: 'kb-financial', path: '/articles/kb-financial-shareholder-return', signalNode: 'capital-buffer', signalId: 'cet1', expectedHub: '/guides/financials-value-up' }
];

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];

const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

for (const target of pages) {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    const response = await page.goto(baseURL + target.path, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;
    const root = page.locator('[data-research-map-v3][data-rg-mode="compact"]');
    await root.waitFor({ state: 'visible' });
    await root.scrollIntoViewIfNeeded();

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('[data-research-map-v3][data-rg-mode="compact"]');
      const flow = root?.querySelector('.rg__flow');
      const detail = root?.querySelector('.rg__detail');
      const pageOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const rootOverflow = root ? root.scrollWidth - root.clientWidth : 9999;
      const rootRect = root?.getBoundingClientRect();
      const flowRect = flow?.getBoundingClientRect();
      const detailRect = detail?.getBoundingClientRect();
      return {
        pageOverflow, rootOverflow, rootHeight: rootRect?.height ?? 0,
        flowNodes: root?.querySelectorAll('.rg__flow-node').length ?? 0,
        hasFullCanvas: !!root?.querySelector('[data-rg-canvas]'),
        flowVisible: !!flowRect && flowRect.bottom > 0 && flowRect.top < window.innerHeight,
        detailVisible: !!detailRect && detailRect.bottom > 0 && detailRect.top < window.innerHeight,
        fullGraphLink: root?.querySelector('.rg__compact-footer a')?.getAttribute('href') ?? ''
      };
    });

    await page.locator(`.rg__flow-node[data-node-id="${target.signalNode}"]`).click();
    const signalBox = page.locator('[data-rg-signals]');
    const signalCount = await signalBox.locator('[data-signal-id]').count();
    const signalVisible = await signalBox.isVisible();
    await signalBox.locator(`[data-signal-id="${target.signalId}"]`).click();
    const expanded = await signalBox.locator(`[data-signal-id="${target.signalId}"]`).getAttribute('aria-expanded');

    const checks = {
      statusOk: status >= 200 && status < 400,
      fourNodeDecisionFlow: metrics.flowNodes === 4,
      matrixHidden: metrics.hasFullCanvas === false,
      flowAndDetailTogether: metrics.flowVisible && metrics.detailVisible,
      noPageOverflow: metrics.pageOverflow <= 1,
      noDesktopRootOverflow: viewport.width < 1000 || metrics.rootOverflow <= 1,
      compactDesktopHeight: viewport.width < 1000 || metrics.rootHeight <= 760,
      threeKeySignals: signalVisible && signalCount === 3,
      signalDisclosureWorks: expanded === 'true',
      fullGraphLinkPresent: metrics.fullGraphLink === target.expectedHub,
      noPageErrors: errors.length === 0
    };

    const pass = Object.values(checks).every(Boolean);
    if (!pass) failed = true;
    results.push({ target: target.name, viewport, status, metrics, signalCount, expanded, checks, errors, pass });
    await page.screenshot({ path: path.join(outDir, `${target.name}-${viewport.name}.png`), fullPage: true });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${target.name}/${viewport.name} flow=${metrics.flowNodes} signals=${signalCount} height=${Math.round(metrics.rootHeight)}`);
    await page.close();
  }
}

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
await browser.close();

if (failed) {
  console.error('Company Compact Rollout Preview QA failed');
  for (const result of results.filter((item) => !item.pass)) {
    console.error('-', result.target, result.viewport.name, Object.entries(result.checks).filter(([, ok]) => !ok).map(([name]) => name).join(', '));
  }
  process.exit(1);
}

console.log('Company Compact Rollout Preview QA PASS · Samsung + SK hynix + KB Financial');

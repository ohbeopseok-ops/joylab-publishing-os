import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outDir = path.join(process.cwd(), 'qa-artifacts', 'samsung-compact-gold');
await fs.mkdir(outDir, { recursive: true });

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];

const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  const response = await page.goto(baseURL + '/articles/samsung-electronics-outlook', { waitUntil: 'networkidle' });
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
      pageOverflow,
      rootOverflow,
      rootHeight: rootRect?.height ?? 0,
      flowNodes: root?.querySelectorAll('.rg__flow-node').length ?? 0,
      hasFullCanvas: !!root?.querySelector('[data-rg-canvas]'),
      flowVisible: !!rootRect && !!flowRect && flowRect.top >= rootRect.top - 1 && flowRect.bottom <= rootRect.bottom + 1,
      detailVisible: !!rootRect && !!detailRect && detailRect.top >= rootRect.top - 1 && detailRect.bottom <= rootRect.bottom + 1,
      fullGraphLink: root?.querySelector('.rg__compact-footer a')?.getAttribute('href') ?? ''
    };
  });

  await page.locator('.rg__flow-node[data-node-id="memory-mix"]').click();
  const signalBox = page.locator('[data-rg-signals]');
  const signalCount = await signalBox.locator('[data-signal-id]').count();
  const signalVisible = await signalBox.isVisible();
  await signalBox.locator('[data-signal-id="hbm"]').click();
  const hbmExpanded = await signalBox.locator('[data-signal-id="hbm"]').getAttribute('aria-expanded');

  const checks = {
    statusOk: status >= 200 && status < 400,
    noPageOverflow: metrics.pageOverflow <= 1,
    noCompactRootOverflow: viewport.width < 640 || metrics.rootOverflow <= 1,
    fourNodeDecisionFlow: metrics.flowNodes === 4,
    matrixHidden: metrics.hasFullCanvas === false,
    flowAndDetailTogether: metrics.flowVisible && metrics.detailVisible,
    desktopCompactHeight: viewport.width < 1000 || metrics.rootHeight <= 720,
    memoryMixSignals: signalVisible && signalCount === 3,
    signalDisclosureWorks: hbmExpanded === 'true',
    fullGraphLinkPresent: metrics.fullGraphLink === '/guides/semiconductor-investing',
    noPageErrors: errors.length === 0
  };

  const pass = Object.values(checks).every(Boolean);
  if (!pass) failed = true;
  results.push({ viewport, status, metrics, signalCount, hbmExpanded, checks, pass, errors });

  await page.screenshot({
    path: path.join(outDir, `samsung-compact-${viewport.name}.png`),
    fullPage: true
  });
  console.log(`${pass ? 'PASS' : 'FAIL'} samsung-compact/${viewport.name} flow=${metrics.flowNodes} rootHeight=${Math.round(metrics.rootHeight)} pageOverflow=${metrics.pageOverflow}`);
  await page.close();
}

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
await browser.close();

if (failed) {
  console.error('Samsung Compact GOLD failed');
  for (const result of results.filter((item) => !item.pass)) {
    console.error('-', result.viewport.name, Object.entries(result.checks).filter(([, ok]) => !ok).map(([name]) => name).join(', '));
  }
  process.exit(1);
}

console.log('Samsung Compact GOLD PASS · 5-second UX proxy satisfied');

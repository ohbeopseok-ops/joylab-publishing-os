import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const registry = JSON.parse(await fs.readFile('docs/qa/GOLD_SCREEN_REGISTRY_V1.json', 'utf8'));
const outDir = path.join(process.cwd(), 'qa-artifacts', 'gold-screen-registry-v1');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const screen of registry.screens) {
  const vp = registry.viewport_contracts[screen.viewport];
  const page = await browser.newPage({ viewport: vp });
  const response = await page.goto(baseURL + screen.path, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;
  if (status < 200 || status >= 400) throw new Error(screen.id + ': HTTP ' + status);

  const metrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const header = document.querySelector('.site-header');
    const bodyWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    return {
      overflow: bodyWidth - window.innerWidth,
      h1Visible: Boolean(h1 && h1.getBoundingClientRect().width > 0 && h1.getBoundingClientRect().height > 0),
      headerVisible: Boolean(header && header.getBoundingClientRect().height > 0),
      bodyHeight: document.documentElement.scrollHeight,
      title: document.title
    };
  });

  if (metrics.overflow > 2) throw new Error(screen.id + ': horizontal overflow ' + metrics.overflow + 'px');
  if (!metrics.headerVisible) throw new Error(screen.id + ': global header missing');
  if (screen.h1 && !metrics.h1Visible) throw new Error(screen.id + ': H1 not visible');
  if (metrics.bodyHeight < vp.height * 0.6) throw new Error(screen.id + ': suspiciously short page');

  const screenshot = path.join(outDir, screen.id + '.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  results.push({ ...screen, status, metrics, screenshot });
  console.log('PASS GOLD SCREEN ' + screen.id);
  await page.close();
}

await browser.close();
await fs.writeFile(
  path.join(outDir, 'report.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
);
console.log('GOLD Screen Registry passed: ' + results.length + '/' + registry.screens.length);

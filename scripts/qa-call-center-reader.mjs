import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const url = '/books/call-center-ai-survival/interactive.html';
const out = path.join(process.cwd(), 'qa-artifacts', 'books', 'call-center-reader');
fs.mkdirSync(out, { recursive: true });

const cases = [
  { name: 'reader-1440', width: 1440, height: 1000 },
  { name: 'reader-1920', width: 1920, height: 1080 }
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const c of cases) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
  const response = await page.goto(base + url, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error(`${c.name}: HTTP ${response?.status()}`);

  await page.locator('#publication-info').waitFor({ state: 'visible' });
  await page.waitForTimeout(150);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(`${c.name}: horizontal overflow ${overflow}px`);

  const metrics = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
    };
    const sidebar = box('#sidebar');
    const paper = box('#paper');
    const header = box('body > header');
    const viewport = box('#viewport');
    const versionNode = document.querySelector('body > header > div:first-child > div > div:last-child');
    const versionLabel = versionNode ? getComputedStyle(versionNode, '::after').content.replaceAll('"', '') : '';
    const links = [...document.querySelectorAll('body > header a')].map((el) => el.getBoundingClientRect().height);
    const expectedCenter = sidebar && viewport ? sidebar.right + viewport.width / 2 : 0;
    const paperCenter = paper ? paper.left + paper.width / 2 : 0;
    return { sidebar, paper, header, viewport, versionLabel, links, centerDelta: Math.abs(paperCenter - expectedCenter) };
  });

  await page.screenshot({ path: path.join(out, `${c.name}.png`), fullPage: false });

  if (!metrics.sidebar || metrics.sidebar.width < 252 || metrics.sidebar.width > 268) {
    throw new Error(`${c.name}: sidebar width outside 260px contract ${JSON.stringify(metrics.sidebar)}`);
  }
  if (!metrics.paper || metrics.paper.width < 780 || metrics.paper.width > 810) {
    throw new Error(`${c.name}: paper width outside 800px contract ${JSON.stringify(metrics.paper)}`);
  }
  if (metrics.centerDelta > 4) {
    throw new Error(`${c.name}: paper not centered in remaining viewport (${metrics.centerDelta}px)`);
  }
  if (!metrics.header || metrics.header.height < 50 || metrics.header.height > 54) {
    throw new Error(`${c.name}: header height outside 52px contract ${JSON.stringify(metrics.header)}`);
  }
  if (!metrics.versionLabel.includes('Interactive Workbook V1.2')) {
    throw new Error(`${c.name}: V1.2 reader label missing (${metrics.versionLabel})`);
  }
  if (metrics.links.some((h) => h < 35)) {
    throw new Error(`${c.name}: header link click target below 36px ${JSON.stringify(metrics.links)}`);
  }

  const tocSize = await page.locator('#toc').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  if (tocSize < 12.5) throw new Error(`${c.name}: TOC type too small (${tocSize}px)`);

  const publicationWidth = await page.locator('#publication-info').evaluate((el) => el.getBoundingClientRect().width);
  if (publicationWidth < 650) throw new Error(`${c.name}: chapter content not using widened paper (${publicationWidth}px)`);

  results.push({ ...c, overflow, metrics, tocSize, publicationWidth });
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));

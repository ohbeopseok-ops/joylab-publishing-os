import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const url = '/books/weight-of-silence/mindmap.html';
const out = path.join(process.cwd(), 'qa-artifacts', 'weight-of-silence-mindmap');
fs.mkdirSync(out, { recursive: true });

const cases = [
  { name: 'mindmap-pc-1440', width: 1440, height: 1000 },
  { name: 'mindmap-mobile-390', width: 390, height: 844 }
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const c of cases) {
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  const response = await page.goto(base + url, { waitUntil: 'domcontentloaded' });
  if (!response || !response.ok()) throw new Error(c.name + ': HTTP ' + response?.status());

  await page.waitForTimeout(1200);
  const shellState = await page.evaluate(() => ({
    hasSvg: Boolean(document.querySelector('#markmapSvg')),
    textCount: document.querySelectorAll('#markmapSvg text').length,
    runtime: window.__joylabMindmapRuntime || null,
    bodyText: (document.body?.innerText || '').slice(0, 500)
  }));
  if (!shellState.hasSvg) {
    throw new Error(c.name + ': mindmap shell missing; state=' + JSON.stringify(shellState) + '; pageErrors=' + pageErrors.join(' | '));
  }

  try {
    await page.waitForFunction(() => document.querySelectorAll('#markmapSvg text').length >= 5, null, { timeout: 12000 });
  } catch (error) {
    const debugState = await page.evaluate(() => ({
      textCount: document.querySelectorAll('#markmapSvg text').length,
      runtime: window.__joylabMindmapRuntime || null,
      hasFallbackGroup: Boolean(document.querySelector('#fallbackMindmapGroup')),
      markmapApi: Boolean(window.markmap),
      bodyText: (document.body?.innerText || '').slice(0, 500)
    }));
    throw new Error(c.name + ': mindmap nodes did not render; state=' + JSON.stringify(debugState) + '; pageErrors=' + pageErrors.join(' | '));
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(c.name + ': horizontal overflow ' + overflow + 'px');

  const nodeCount = await page.locator('#markmapSvg text').count();
  if (nodeCount < 5) throw new Error(c.name + ': markmap nodes missing');

  const zoomIn = page.locator('#btnZoomIn');
  const zoomOut = page.locator('#btnZoomOut');
  const fit = page.locator('#btnFit');
  for (const [name, button] of [['zoom-in', zoomIn], ['zoom-out', zoomOut], ['fit', fit]]) {
    if (!(await button.isVisible())) throw new Error(c.name + ': ' + name + ' control missing');
    await button.click();
    await page.waitForTimeout(180);
  }

  const sidebar = page.locator('#sidebarPanel');
  const toggle = page.locator('#btnToggleSidebar');
  if (!(await toggle.isVisible())) throw new Error(c.name + ': sidebar toggle missing');

  const initiallyHidden = await sidebar.evaluate((el) => el.classList.contains('hidden'));
  await toggle.click();
  await page.waitForTimeout(380);
  const toggledHidden = await sidebar.evaluate((el) => el.classList.contains('hidden'));
  if (initiallyHidden === toggledHidden) throw new Error(c.name + ': sidebar toggle did not change state');

  if (toggledHidden) {
    await toggle.click();
    await page.waitForTimeout(380);
  }
  if (!(await sidebar.isVisible())) throw new Error(c.name + ': sidebar is not visible for tab QA');

  await page.locator('#tabBtnOutline').click();
  if (!(await page.locator('#tabContentOutline').isVisible())) throw new Error(c.name + ': outline tab failed');

  await page.locator('#tabBtnJourney').click();
  if (!(await page.locator('#tabContentJourney').isVisible())) throw new Error(c.name + ': journey tab failed');

  await page.locator('#tabBtnConcepts').click();
  if (!(await page.locator('#tabContentConcepts').isVisible())) throw new Error(c.name + ': concepts tab failed');

  let highlighted = 0;
  const search = page.locator('#nodeSearchInput');
  if (c.width >= 1024) {
    if (!(await search.isVisible())) throw new Error(c.name + ': search input missing');
    await search.fill('쉼표');
    await page.waitForTimeout(200);
    highlighted = await page.locator('#markmapSvg text').evaluateAll((els) =>
      els.filter((el) => el.style.fontWeight === 'bold').length
    );
    if (highlighted < 1) throw new Error(c.name + ': search did not highlight any node');
  }

  if (pageErrors.length) throw new Error(c.name + ': page errors: ' + pageErrors.join(' | '));

  await page.screenshot({ path: path.join(out, c.name + '.png'), fullPage: true });
  results.push({ ...c, nodeCount, overflow, highlighted });
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));

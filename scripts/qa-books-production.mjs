import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = 'https://aijoylab.kr';
const slug = '완벽하지-않아서-스며들-수-있었다';
const encoded = encodeURIComponent(slug);
const landingUrl = `${base}/books/${encoded}`;
const readerUrl = `${landingUrl}/read`;
const outDir = path.resolve('qa-artifacts/books-production');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function audit(name, viewport) {
  const context = await browser.newContext({ viewportSize: viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const landingResponse = await page.goto(landingUrl, { waitUntil: 'networkidle', timeout: 30000 });
  if (!landingResponse?.ok()) throw new Error(`${name} landing HTTP ${landingResponse?.status()}`);
  await page.screenshot({ path: path.join(outDir, `${name}-landing.png`), fullPage: true });

  const title = await page.locator('h1').first().textContent();
  if (!title?.includes('완벽하지 않아서 스며들 수 있었다')) throw new Error(`${name} landing title mismatch`);
  if (await page.locator('#joylab-book-schema').count() !== 1) throw new Error(`${name} Book schema missing`);

  const preview = page.locator('a[data-analytics-event="book_preview_start"]').first();
  if (await preview.count() !== 1) throw new Error(`${name} preview CTA missing`);

  const readerResponse = await page.goto(readerUrl, { waitUntil: 'networkidle', timeout: 30000 });
  if (!readerResponse?.ok()) throw new Error(`${name} reader HTTP ${readerResponse?.status()}`);

  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  if (robots !== 'noindex,follow') throw new Error(`${name} reader robots mismatch: ${robots}`);

  if (await page.getByText('소나무 장작이 타들어 가는 냄새는', { exact: false }).count()) {
    throw new Error(`${name} locked Chapter 2 leaked`);
  }

  const toc = page.locator('#book-reader-toc');
  if (!(await toc.getAttribute('inert')) === null) {}
  await page.locator('#book-toc-open').click();
  if ((await toc.getAttribute('aria-hidden')) !== 'false') throw new Error(`${name} TOC did not open`);
  await page.keyboard.press('Escape');
  if ((await toc.getAttribute('aria-hidden')) !== 'true') throw new Error(`${name} TOC did not close`);

  const fontButton = page.locator('#book-font-family');
  const beforeFont = await fontButton.textContent();
  await fontButton.click();
  const afterFont = await fontButton.textContent();
  if (beforeFont === afterFont) throw new Error(`${name} font control did not change`);

  await page.locator('#book-theme').click();
  if (!(await page.locator('#book-reader').getAttribute('data-theme'))) throw new Error(`${name} theme control failed`);

  await page.screenshot({ path: path.join(outDir, `${name}-reader.png`), fullPage: false });

  const severeConsoleErrors = consoleErrors.filter((line) => !/favicon|Failed to load resource.*404/i.test(line));
  if (severeConsoleErrors.length) {
    fs.writeFileSync(path.join(outDir, `${name}-console-errors.txt`), severeConsoleErrors.join('\n'));
    throw new Error(`${name} console errors: ${severeConsoleErrors.join(' | ')}`);
  }

  await context.close();
}

await audit('desktop-1440', { width: 1440, height: 1000 });
await audit('mobile-390', { width: 390, height: 844 });

await browser.close();

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  landingUrl,
  readerUrl,
  viewports: ['1440x1000', '390x844'],
  result: 'PASS'
}, null, 2) + '\n');

console.log('Books production visual QA passed.');

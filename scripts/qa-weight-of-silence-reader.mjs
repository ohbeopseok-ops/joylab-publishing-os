import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const readerUrl = '/books/weight-of-silence/interactive.html';
const out = path.join(process.cwd(), 'qa-artifacts', 'weight-of-silence-reader');
fs.mkdirSync(out, { recursive: true });

const cases = [
  { name: 'reader-pc-1440', width: 1440, height: 1000 },
  { name: 'reader-mobile-390', width: 390, height: 844 }
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const c of cases) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
  const response = await page.goto(base + readerUrl, { waitUntil: 'domcontentloaded' });
  if (!response || !response.ok()) throw new Error(c.name + ': HTTP ' + response?.status());

  await page.waitForSelector('#chapterContent', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#chapterContent');
    return el && el.textContent && el.textContent.trim().length > 20;
  }, null, { timeout: 15000 });

  const title = await page.locator('#headerBookTitle').textContent();
  if (!title?.includes('악보의 쉼표 사이에 고여 있는 침묵의 무게')) {
    throw new Error(c.name + ': reader title missing');
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(c.name + ': horizontal overflow ' + overflow + 'px');

  const toc = page.locator('#tocSidebar');
  const tocButton = page.locator('#btnToggleToc');
  if (!(await tocButton.isVisible())) throw new Error(c.name + ': TOC toggle missing');
  await tocButton.click();
  await page.waitForTimeout(250);
  await tocButton.click();
  await page.waitForTimeout(250);

  const settings = page.locator('#btnSettings');
  await settings.click();
  const panel = page.locator('#settingsPanel');
  if (!(await panel.isVisible())) throw new Error(c.name + ': settings panel did not open');

  const beforeSize = await page.locator('#fontSizeDisplay').textContent();
  await page.locator('#btnFontInc').click();
  const afterSize = await page.locator('#fontSizeDisplay').textContent();
  if (beforeSize === afterSize) throw new Error(c.name + ': font-size control did not change');

  await page.locator('#btnFontSans').click();
  const fontFamily = await page.locator('#chapterContent').evaluate((el) => el.style.fontFamily);
  if (!fontFamily || !fontFamily.toLowerCase().includes('pretendard')) {
    throw new Error(c.name + ': font-family control did not apply sans font; got ' + fontFamily);
  }

  const beforeChapter = await page.locator('#currentChapterBadge').textContent();
  const next = page.locator('#btnNextChapter');
  if (!(await next.isVisible())) throw new Error(c.name + ': next chapter control missing');
  await next.click();
  await page.waitForTimeout(300);
  const afterChapter = await page.locator('#currentChapterBadge').textContent();
  if (!afterChapter || afterChapter === beforeChapter) throw new Error(c.name + ': next chapter did not advance');

  const prev = page.locator('#btnPrevChapter');
  if (!(await prev.isVisible()) || await prev.isDisabled()) throw new Error(c.name + ': previous chapter did not become available');

  const progressWidth = await page.locator('#readingProgressBar').evaluate((el) => getComputedStyle(el).width);
  if (!progressWidth || progressWidth === '0px') throw new Error(c.name + ': reading progress did not advance');

  await page.evaluate(() => renderChapter(BOOK_DATA.length - 1));
  await page.waitForTimeout(320);
  const completion = page.locator('#readerPackNext');
  if (!(await completion.isVisible())) throw new Error(c.name + ': Reader Pack completion CTA missing');

  const mindmapHref = await completion.locator('[data-reader-pack-cta="mindmap"]').getAttribute('href');
  const booksHref = await completion.locator('[data-reader-pack-cta="books-hub"]').getAttribute('href');
  const researchHrefs = await completion.locator('[data-reader-pack-cta="research"]').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  if (mindmapHref !== '/books/weight-of-silence/mindmap.html') throw new Error(c.name + ': mindmap CTA path drifted');
  if (booksHref !== '/books') throw new Error(c.name + ': Books Hub CTA path drifted');
  if (researchHrefs.length !== 3 || researchHrefs.some((href) => !href?.startsWith('/articles/'))) {
    throw new Error(c.name + ': related research CTA contract failed');
  }

  await page.screenshot({ path: path.join(out, c.name + '.png'), fullPage: true });
  results.push({ ...c, beforeSize, afterSize, fontFamily, beforeChapter, afterChapter, progressWidth, overflow, mindmapHref, booksHref, researchHrefs });
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));

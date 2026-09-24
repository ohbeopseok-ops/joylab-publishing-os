import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'books', 'senior-mom-gemini-390');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

const response = await page.goto(base + '/books/senior-mom-gemini', { waitUntil: 'networkidle' });
if (!response || !response.ok()) throw new Error('detail-390: HTTP ' + response?.status());

const title = page.locator('h1').first();
if (!(await title.isVisible())) throw new Error('detail-390: title missing');
const titleText = (await title.textContent())?.trim() || '';
if (!titleText.includes('시니어인 우리 엄마도 제미나이를 쓴다')) {
  throw new Error('detail-390: title mismatch: ' + titleText);
}

const cover = page.locator('.book-v2-hero__cover img').first();
if (!(await cover.isVisible())) throw new Error('detail-390: cover missing');
const coverBox = await cover.boundingBox();
if (!coverBox || coverBox.width < 180 || coverBox.width > 300) {
  throw new Error('detail-390: cover width out of GOLD range: ' + JSON.stringify(coverBox));
}
if (coverBox.height <= coverBox.width * 1.35) {
  throw new Error('detail-390: cover ratio looks compressed: ' + JSON.stringify(coverBox));
}

const readerCta = page.locator('a[href="/books/senior-mom-gemini/read"]').first();
if (!(await readerCta.isVisible())) throw new Error('detail-390: reader CTA missing');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (overflow > 2) throw new Error('detail-390: horizontal overflow ' + overflow + 'px');

const metrics = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const img = document.querySelector('.book-v2-hero__cover img');
  const cta = document.querySelector('a[href="/books/senior-mom-gemini/read"]');
  const rect = (el) => el ? el.getBoundingClientRect() : null;
  return {
    viewport: { width: innerWidth, height: innerHeight },
    title: rect(h1),
    cover: rect(img),
    cta: rect(cta),
    scrollWidth: document.documentElement.scrollWidth
  };
});

await page.screenshot({ path: path.join(out, 'detail-390.png'), fullPage: true });
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  pass: true,
  titleText,
  overflow,
  metrics
}, null, 2));

await browser.close();
console.log(JSON.stringify({ pass: true, titleText, overflow, metrics }, null, 2));

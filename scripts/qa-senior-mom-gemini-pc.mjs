import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'books', 'senior-mom-gemini-pc');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function checkDetail() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const response = await page.goto(base + '/books/senior-mom-gemini', { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error('detail-1440: HTTP ' + response?.status());

  const hero = page.locator('.book-senior-mom-gemini .book-v2-hero');
  const cover = page.locator('.book-senior-mom-gemini .book-v2-hero__cover img');
  const title = page.locator('.book-senior-mom-gemini .book-v2-hero__copy h1');
  const reader = page.locator('.book-senior-mom-gemini a[href="/books/senior-mom-gemini/read"]').first();

  for (const [name, locator] of [['hero',hero],['cover',cover],['title',title],['reader CTA',reader]]) {
    if (!(await locator.isVisible())) throw new Error('detail-1440: ' + name + ' missing');
  }

  const metrics = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    return {
      hero: rect('.book-senior-mom-gemini .book-v2-hero'),
      shell: rect('.book-senior-mom-gemini .book-v2-hero__shell'),
      cover: rect('.book-senior-mom-gemini .book-v2-hero__cover img'),
      title: rect('.book-senior-mom-gemini .book-v2-hero__copy h1'),
      quote: rect('.book-senior-mom-gemini .book-v2-hero__quote'),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth
    };
  });

  if (!metrics.cover || metrics.cover.width < 250 || metrics.cover.width > 300) {
    throw new Error('detail-1440: cover width outside 250-300px GOLD range ' + JSON.stringify(metrics.cover));
  }
  const ratio = metrics.cover.width / metrics.cover.height;
  if (Math.abs(ratio - 2/3) > 0.025) throw new Error('detail-1440: cover ratio drifted ' + ratio);
  if (!metrics.hero || metrics.hero.height > 590 || metrics.hero.height < 500) {
    throw new Error('detail-1440: hero height outside 500-590px GOLD range ' + JSON.stringify(metrics.hero));
  }
  if (!metrics.shell || metrics.shell.width > 1182) throw new Error('detail-1440: shell wider than 1180px');
  if (!metrics.title || metrics.title.width > 660 || metrics.title.height > 230) {
    throw new Error('detail-1440: title block too large ' + JSON.stringify(metrics.title));
  }
  if (metrics.scrollWidth - metrics.viewportWidth > 2) throw new Error('detail-1440: horizontal overflow');

  const assetText = await page.evaluate(async () => {
    const res = await fetch('/books/senior-mom-gemini/cover.svg', { cache: 'no-store' });
    return await res.text();
  });
  if (assetText.includes('data:image/')) throw new Error('detail-1440: cover still embeds raster data');
  if (!assetText.includes('<svg')) throw new Error('detail-1440: cover is not SVG');

  await page.screenshot({ path: path.join(out, 'detail-1440.png'), fullPage: true });
  results.push({ page:'detail', ...metrics, coverRatio:ratio, vectorOnly:true });
  await page.close();
}

async function checkHub() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const response = await page.goto(base + '/books', { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error('hub-1440: HTTP ' + response?.status());

  const cover = page.locator('.books-v2-launch-hero__cover img');
  const title = page.locator('.books-v2-launch-hero__copy h1');
  const reader = page.locator('.books-v2-launch-hero a[href="/books/senior-mom-gemini/read"]');
  for (const [name, locator] of [['cover',cover],['title',title],['reader CTA',reader]]) {
    if (!(await locator.isVisible())) throw new Error('hub-1440: ' + name + ' missing');
  }

  const metrics = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    return {
      hero: rect('.books-v2-launch-hero'),
      cover: rect('.books-v2-launch-hero__cover img'),
      title: rect('.books-v2-launch-hero__copy h1'),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth
    };
  });

  if (!metrics.cover || metrics.cover.width < 240 || metrics.cover.width > 280) {
    throw new Error('hub-1440: cover width outside 240-280px GOLD range ' + JSON.stringify(metrics.cover));
  }
  if (!metrics.title || metrics.title.width > 690 || metrics.title.height > 210) {
    throw new Error('hub-1440: title block too large ' + JSON.stringify(metrics.title));
  }
  if (!metrics.hero || metrics.hero.height > 570) throw new Error('hub-1440: launch hero too tall ' + JSON.stringify(metrics.hero));
  if (metrics.scrollWidth - metrics.viewportWidth > 2) throw new Error('hub-1440: horizontal overflow');

  await page.screenshot({ path: path.join(out, 'hub-1440.png'), fullPage: true });
  results.push({ page:'hub', ...metrics });
  await page.close();
}



async function checkMidWidth() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 1 });
  const response = await page.goto(base + '/books/senior-mom-gemini', { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error('detail-1024: HTTP ' + response?.status());

  const metrics = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { width:r.width, height:r.height, left:r.left, right:r.right };
    };
    const quote = document.querySelector('.book-senior-mom-gemini .book-v2-hero__quote');
    return {
      shell: rect('.book-senior-mom-gemini .book-v2-hero__shell'),
      cover: rect('.book-senior-mom-gemini .book-v2-hero__cover img'),
      copy: rect('.book-senior-mom-gemini .book-v2-hero__copy'),
      title: rect('.book-senior-mom-gemini .book-v2-hero__copy h1'),
      quoteDisplay: quote ? getComputedStyle(quote).display : null,
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  });

  if (metrics.quoteDisplay !== 'none') throw new Error('detail-1024: quote should be hidden');
  if (!metrics.copy || metrics.copy.width < 500) throw new Error('detail-1024: copy column too narrow ' + JSON.stringify(metrics.copy));
  if (!metrics.cover || metrics.cover.width !== 250) throw new Error('detail-1024: cover width drifted ' + JSON.stringify(metrics.cover));
  if (metrics.overflow > 2) throw new Error('detail-1024: horizontal overflow ' + metrics.overflow);

  await page.screenshot({ path: path.join(out, 'detail-1024.png'), fullPage: true });
  results.push({ page:'detail-1024', ...metrics });
  await page.close();
}

await checkDetail();
await checkMidWidth();
await checkHub();
await browser.close();

fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  pass: true,
  results
}, null, 2));

console.log(JSON.stringify({ pass:true, results }, null, 2));

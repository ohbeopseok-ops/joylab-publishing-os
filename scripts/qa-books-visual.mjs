import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const slug = '완벽하지-않아서-스며들-수-있었다';
const out = path.join(process.cwd(), 'qa-artifacts', 'books');
fs.mkdirSync(out, { recursive: true });

const cases = [
  { name: 'home-desktop', url: '/', width: 1440, height: 1100 },
  { name: 'home-mobile', url: '/', width: 390, height: 844 },
  { name: 'hub-desktop', url: '/books', width: 1440, height: 1100 },
  { name: 'hub-mobile', url: '/books', width: 390, height: 844 },
  { name: 'landing-desktop', url: `/books/${slug}`, width: 1440, height: 1100 },
  { name: 'landing-mobile', url: `/books/${slug}`, width: 390, height: 844 },
  { name: 'reader-desktop', url: `/books/${slug}/read`, width: 1440, height: 1100 },
  { name: 'reader-mobile', url: `/books/${slug}/read`, width: 390, height: 844 }
];

const browser = await chromium.launch({ headless: true });
const results = [];

const assertCoverDecoded = async (page, name) => {
  const cover = page.locator(
    '.home-books-v2__cover img, .books-v2-featured__cover img, .book-v2-hero__cover img'
  ).first();

  if (await cover.count()) {
    await cover.waitFor({ state: 'visible' });
    const state = await cover.evaluate((img) => ({
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
    if (!state.complete || state.naturalWidth <= 0 || state.naturalHeight <= 0) {
      throw new Error(`${name}: featured cover image failed to decode ${JSON.stringify(state)}`);
    }
    return;
  }

  const textCover = page.locator(
    '.home-books-v2__text-cover, .books-v2-featured__cover .books-v2-text-cover, .book-v2-hero__cover .book-v2-text-cover'
  ).first();
  if (!(await textCover.count()) || !(await textCover.isVisible())) {
    throw new Error(`${name}: featured image cover or text cover is not visible`);
  }
};

for (const c of cases) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
  const response = await page.goto(base + c.url, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error(`${c.name}: HTTP ${response?.status()}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(`${c.name}: horizontal overflow ${overflow}px`);

  if (c.name.startsWith('home')) {
    const booksSection = page.locator('.home-books-v2');
    if (!(await booksSection.count())) throw new Error(`${c.name}: homepage Books section missing`);
    if (!(await booksSection.isVisible())) throw new Error(`${c.name}: homepage Books section not visible`);
    await assertCoverDecoded(page, c.name);

    if (c.width >= 900) {
      const booksNav = page.locator('#site-primary-nav a[href="/books"]');
      if (!(await booksNav.isVisible())) throw new Error(`${c.name}: global Books nav not visible`);
      const researchNav = page.locator('#site-primary-nav a[href="/#today-research"]');
      if (!(await researchNav.isVisible())) throw new Error(`${c.name}: global Research nav not visible`);
    }
  } else if (c.name.startsWith('hub')) {
    const heading = page.getByText('분석한 생각을,', { exact: false }).first();
    if (!(await heading.isVisible())) throw new Error(`${c.name}: Books hub hero missing`);
    await assertCoverDecoded(page, c.name);
    const library = page.getByText('현재 출간된 JoyLab Books', { exact: true });
    if (!(await library.isVisible())) throw new Error(`${c.name}: Books library heading missing`);
  } else if (c.name.startsWith('landing')) {
    await page.locator('h1').waitFor();
    await assertCoverDecoded(page, c.name);

    const title = page.getByText('완벽하지 않아서 스며들 수 있었다', { exact: false }).first();
    if (!(await title.isVisible())) throw new Error(`${c.name}: book title not visible`);

    const previewCta = page.getByText('지금 읽기 · 작가의 말 + 1장', { exact: false }).first();
    if (!(await previewCta.isVisible())) throw new Error(`${c.name}: primary reader CTA not visible`);

    const tabs = page.locator('.book-v2-tabs');
    if (!(await tabs.isVisible())) throw new Error(`${c.name}: book sub navigation missing`);

    const locked = page.getByText('전체본 준비 중', { exact: true }).first();
    if (!(await locked.isVisible())) throw new Error(`${c.name}: locked chapter state missing`);
  } else {
    const previewEnd = page.getByText('PREVIEW END', { exact: true }).first();
    if (!(await previewEnd.isVisible())) throw new Error(`${c.name}: preview end not visible`);
    if (await page.getByText('소나무 장작이 타들어 가는 냄새는', { exact: false }).count()) {
      throw new Error(`${c.name}: locked chapter body leaked`);
    }
  }

  await page.screenshot({ path: path.join(out, `${c.name}.png`), fullPage: true });
  results.push({ ...c, overflow });
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));

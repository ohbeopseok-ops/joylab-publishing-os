import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const slug = '완벽하지-않아서-스며들-수-있었다';
const callCenterSlug = 'call-center-ai-survival';
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
  { name: 'reader-mobile', url: `/books/${slug}/read`, width: 390, height: 844 },
  { name: 'call-center-ai-gold-1440', url: `/books/${callCenterSlug}`, width: 1440, height: 1000 },
  { name: 'call-center-ai-gold-1920', url: `/books/${callCenterSlug}`, width: 1920, height: 1080 }
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

const assertCallCenterHeroGold = async (page, c) => {
  const hero = page.locator('.book-call-center-ai-survival .book-v2-hero');
  if (!(await hero.isVisible())) throw new Error(`${c.name}: scoped call-center hero missing`);

  const cover = page.locator('.book-call-center-ai-survival .book-v2-hero__cover img');
  await cover.waitFor({ state: 'visible' });
  const coverBox = await cover.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, ratio: r.width / r.height };
  });
  if (coverBox.left < 0 || coverBox.right > c.width) {
    throw new Error(`${c.name}: cover clipped outside viewport ${JSON.stringify(coverBox)}`);
  }
  if (coverBox.width > 280 || coverBox.width < 190) {
    throw new Error(`${c.name}: cover width outside desktop contract ${JSON.stringify(coverBox)}`);
  }
  if (Math.abs(coverBox.ratio - (2 / 3)) > 0.03) {
    throw new Error(`${c.name}: cover ratio drifted ${JSON.stringify(coverBox)}`);
  }

  const title = page.getByRole('heading', { level: 1, name: '콜센터 AI 생존기' });
  if (!(await title.isVisible())) throw new Error(`${c.name}: title not visible`);

  const primary = page.getByRole('link', { name: /인터랙티브 웹 전자책 읽기/ }).first();
  const secondary = page.getByRole('link', { name: '전체 목차 보기' }).first();
  if (!(await primary.isVisible())) throw new Error(`${c.name}: primary CTA not visible`);
  if (!(await secondary.isVisible())) throw new Error(`${c.name}: secondary CTA not visible`);

  const visual = page.locator('.book-call-center-ai-survival .book-v2-hero__quote');
  if (!(await visual.isVisible())) throw new Error(`${c.name}: right-side hero visual missing`);
  const visualBox = await visual.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const bg = getComputedStyle(el).backgroundImage;
    return { left: r.left, right: r.right, width: r.width, height: r.height, bg };
  });
  if (!visualBox.bg.includes('hero-v2.svg')) throw new Error(`${c.name}: right-side visual asset not applied`);
  if (visualBox.right > c.width || visualBox.left < 0) {
    throw new Error(`${c.name}: right hero visual clipped ${JSON.stringify(visualBox)}`);
  }

  const oldOverline = page.locator('.book-call-center-ai-survival .book-v2-overline');
  if (await oldOverline.isVisible()) throw new Error(`${c.name}: duplicate overline still visible`);

  const topics = page.locator('.book-call-center-ai-survival .book-v2-topics span');
  if ((await topics.count()) < 5) throw new Error(`${c.name}: compact topic chips missing`);
  const maxTopicHeight = Math.max(...await topics.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)));
  if (maxTopicHeight > 34) throw new Error(`${c.name}: topic chips too tall (${maxTopicHeight}px)`);
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
      const researchNav = page.locator('#site-primary-nav a[href="/articles"]:not(.mobile-nav-cta)');
      if (!(await researchNav.isVisible())) throw new Error(`${c.name}: global Research nav not visible`);
    }
  } else if (c.name.startsWith('hub')) {
    const heading = page.getByText('분석한 생각을,', { exact: false }).first();
    if (!(await heading.isVisible())) throw new Error(`${c.name}: Books hub hero missing`);
    await assertCoverDecoded(page, c.name);
    const library = page.getByText('현재 출간된 JoyLab Books', { exact: true });
    if (!(await library.isVisible())) throw new Error(`${c.name}: Books library heading missing`);

    if (c.width >= 1200) {
      const shellWidth = await page.locator('.books-v2-shell').first().evaluate((el) => el.getBoundingClientRect().width);
      if (shellWidth > 1182) throw new Error(`${c.name}: desktop shell wider than 1180px contract (${shellWidth}px)`);

      const featuredBox = await page.locator('.books-v2-featured__cover').evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height, ratio: r.width / r.height };
      });
      const targetRatio = 2 / 3;
      if (Math.abs(featuredBox.ratio - targetRatio) > 0.03) {
        throw new Error(`${c.name}: featured cover ratio drifted ${JSON.stringify(featuredBox)}`);
      }

      const libraryCard = page.locator('.books-v2-book').first();
      if (await libraryCard.count()) {
        const cardBox = await libraryCard.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { width: r.width, height: r.height };
        });
        if (cardBox.width < 1000) throw new Error(`${c.name}: library card should use the full editorial row (${cardBox.width}px)`);
        if (cardBox.height > 340) throw new Error(`${c.name}: library card too tall (${cardBox.height}px)`);
      }
    }
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
  } else if (c.name.startsWith('call-center-ai-gold')) {
    await assertCoverDecoded(page, c.name);
    await assertCallCenterHeroGold(page, c);
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

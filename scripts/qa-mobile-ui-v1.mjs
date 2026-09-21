import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'mobile-ui-v1');
await fs.mkdir(out, { recursive: true });

const cases = [
  { name: 'books', path: '/books', active: 'Books' },
  { name: 'about', path: '/about', active: 'About' },
  { name: 'investing', path: '/guides/investing', active: '투자·경제' },
  { name: 'ai-productivity', path: '/guides/ai-productivity', active: 'AI·생산성' },
  { name: 'growth-leadership', path: '/guides/growth-leadership', active: '성장·리더십' },
  { name: 'research-article', path: '/articles/anthropic-ipo-ai-safety-2026', active: 'Research' },
  { name: 'contact', path: '/contact', active: 'Contact' },
  { name: 'privacy', path: '/privacy', active: null }
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const item of cases) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const response = await page.goto(baseURL + item.path, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error(`${item.name}: HTTP ${response?.status()}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(`${item.name}: horizontal overflow ${overflow}px`);

  const toggle = page.locator('.homepage-nav-toggle');
  if (!(await toggle.isVisible())) throw new Error(`${item.name}: hamburger is not visible`);

  await toggle.click();
  await page.locator('#site-primary-nav').waitFor({ state: 'visible' });

  const shellOpen = await page.locator('#site-nav-shell').evaluate((el) => el.classList.contains('is-open'));
  const bodyLocked = await page.locator('body').evaluate((el) => el.classList.contains('nav-open'));
  if (!shellOpen || !bodyLocked) throw new Error(`${item.name}: mobile nav did not lock correctly`);

  const active = page.locator('#site-primary-nav a[aria-current="page"]');
  const activeCount = await active.count();
  if (item.active) {
    if (activeCount !== 1) throw new Error(`${item.name}: expected 1 active nav item, got ${activeCount}`);
  } else if (activeCount !== 0) {
    throw new Error(`${item.name}: expected no active nav item, got ${activeCount}`);
  }
  const activeText = item.active ? (await active.textContent())?.trim() : null;
  if (item.active && activeText !== item.active) throw new Error(`${item.name}: active nav is "${activeText}", expected "${item.active}"`);

  const cta = page.locator('#site-primary-nav .mobile-nav-cta');
  if (!(await cta.isVisible())) throw new Error(`${item.name}: mobile Today Research CTA missing`);

  const activeStyle = item.active ? await active.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor, minHeight: el.getBoundingClientRect().height };
  }) : null;
  if (activeStyle && activeStyle.minHeight < 44) throw new Error(`${item.name}: active target too small`);

  await page.screenshot({ path: path.join(out, `${item.name}-menu.png`), fullPage: false });

  await page.keyboard.press('Escape');
  const bodyUnlocked = await page.locator('body').evaluate((el) => !el.classList.contains('nav-open'));
  if (!bodyUnlocked) throw new Error(`${item.name}: Escape did not unlock body scroll`);

  if (item.name === 'contact') {
    const field = page.locator('#contact-name');
    const fieldMetrics = await field.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: Number.parseFloat(s.fontSize), height: el.getBoundingClientRect().height };
    });
    if (fieldMetrics.fontSize < 16) throw new Error(`contact: form font-size ${fieldMetrics.fontSize}px is below 16px`);
    if (fieldMetrics.height < 48) throw new Error(`contact: form control height ${fieldMetrics.height}px is below 48px`);
  }

  if (item.name === 'books') {
    await page.locator('#site-footer-v2').scrollIntoViewIfNeeded();
    const footerLink = page.locator('#site-footer-v2 .site-footer-v2__socials a').first();
    const footerHeight = await footerLink.evaluate((el) => el.getBoundingClientRect().height);
    if (footerHeight < 44) throw new Error(`books: footer link height ${footerHeight}px is below 44px`);
  }

  results.push({ ...item, overflow, activeText, activeStyle });
  await page.close();
}

await browser.close();
await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));

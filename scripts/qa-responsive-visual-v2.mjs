import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'responsive-visual-gate-v2');
await fs.mkdir(out, { recursive: true });

const viewports = [
  { name: 'iphone-390', width: 390, height: 844, touch: true },
  { name: 'iphone-430', width: 430, height: 932, touch: true },
  { name: 'ipad-820', width: 820, height: 1180, touch: true },
  { name: 'desktop-1440', width: 1440, height: 900, touch: false }
];

const pages = [
  {
    name: 'home',
    path: '/',
    selectors: ['.home-hero', '.home-pillars', '.home-guide', '.home-archive', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 18, 'iphone-430': 17, 'ipad-820': 12, 'desktop-1440': 18 }
  },
  {
    name: 'about',
    path: '/about',
    selectors: ['.about-v2-hero', '.about-official', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 11.5, 'iphone-430': 10.8, 'ipad-820': 8.5, 'desktop-1440': 9 }
  },
  {
    name: 'contact',
    path: '/contact',
    selectors: ['.contact-hero', '.contact-form-card', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 8.5, 'iphone-430': 8, 'ipad-820': 6.5, 'desktop-1440': 7 }
  },
  {
    name: 'books',
    path: '/books',
    selectors: ['.books-v2-launch-hero', '.books-v2-launch-hero__cover', '.books-v2-library', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 10.5, 'iphone-430': 9.8, 'ipad-820': 8, 'desktop-1440': 9 }
  },
  {
    name: 'research',
    path: '/articles/china-us-treasury-holdings-2026',
    selectors: ['.research-cover', '.research-layout', '.research-v2-content', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 24, 'iphone-430': 23, 'ipad-820': 18, 'desktop-1440': 20 }
  },
  {
    name: 'investing-guide',
    path: '/guides/investing',
    selectors: ['.sg-hero', '.sg-main', '.sg-path', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 13, 'iphone-430': 12, 'ipad-820': 9, 'desktop-1440': 10 }
  },
  {
    name: 'ai-productivity-guide',
    path: '/guides/ai-productivity',
    selectors: ['.sg-hero', '.sg-main', '.sg-path', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 17, 'iphone-430': 16, 'ipad-820': 12, 'desktop-1440': 13 }
  },
  {
    name: 'growth-leadership-guide',
    path: '/guides/growth-leadership',
    selectors: ['.sg-hero', '.sg-main', '.sg-path', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 20, 'iphone-430': 19, 'ipad-820': 14, 'desktop-1440': 15 }
  }
];

const failures = [];
const results = [];
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  for (const item of pages) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));

    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const benignGoogleReportOnlyFrameError =
        text.includes('[Report Only]') &&
        text.includes("Refused to frame 'https://www.google.com/'") &&
        text.includes("frame-ancestors 'self'");
      if (!benignGoogleReportOnlyFrameError) errors.push('console: ' + text);
    });

    const response = await page.goto(baseURL + item.path, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;

    await page.evaluate(async () => {
      document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
      const step = Math.max(360, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      window.scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });

    await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});

    const metrics = await page.evaluate(({ selectors, height, touch }) => {
      const doc = document.documentElement;
      const body = document.body;
      const visible = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' &&
          s.pointerEvents !== 'none' && r.width > 0 && r.height > 0;
      };

      const selectorMetrics = Object.fromEntries(selectors.map((selector) => {
        const el = document.querySelector(selector);
        if (!el) return [selector, null];
        const r = el.getBoundingClientRect();
        return [selector, {
          width: Math.round(r.width),
          height: Math.round(r.height),
          visible: visible(el)
        }];
      }));

      const criticalSelector = [
        'button',
        'select',
        'textarea',
        'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])',
        '.homepage-nav-toggle',
        '.mobile-nav-cta',
        '.site-footer-v2__socials a',
        '.about-official-link',
        '.contact-type-option span',
        '.books-v2-actions a',
        '.home-hero__cta',
        '.sg-card__cta',
        '.growth-hero__cta',
        '.growth-book-feature__actions a'
      ].join(',');

      const criticalTargets = [...document.querySelectorAll(criticalSelector)]
        .filter(visible)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            width: Math.round(r.width),
            height: Math.round(r.height),
            text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 50)
          };
        });

      const tinyTargets = touch
        ? criticalTargets.filter((x) => x.width < 44 || x.height < 44)
        : [];

      const footer = document.querySelector('#site-footer-v2');
      const footerRect = footer?.getBoundingClientRect();
      const socialCards = [...document.querySelectorAll('.site-footer-v2__socials a')].filter(visible);
      const socialHeights = socialCards.map((el) => Math.round(el.getBoundingClientRect().height));
      const images = [...document.images].map((img) => ({
        src: img.getAttribute('src') || 'unknown',
        complete: img.complete,
        width: img.naturalWidth
      }));
      const docHeight = Math.max(doc.scrollHeight, body.scrollHeight);

      return {
        overflow: Math.max(doc.scrollWidth, body.scrollWidth) - window.innerWidth,
        docHeight,
        screenCount: docHeight / height,
        selectorMetrics,
        tinyTargets: tinyTargets.slice(0, 15),
        footerHeight: footerRect ? Math.round(footerRect.height) : null,
        socialMinHeight: socialHeights.length ? Math.min(...socialHeights) : null,
        toggleVisible: visible(document.querySelector('.homepage-nav-toggle')),
        brokenImages: images.filter((img) => !img.complete || img.width === 0).map((img) => img.src)
      };
    }, { selectors: item.selectors, height: viewport.height, touch: viewport.touch });

    const footerBudget = viewport.width <= 430 ? 720 : viewport.width <= 820 ? 680 : 620;
    const expectedToggle = viewport.width <= 640;
    const checks = {
      httpOk: status >= 200 && status < 400,
      noPageErrors: errors.length === 0,
      noHorizontalOverflow: metrics.overflow <= 1,
      noBrokenImages: metrics.brokenImages.length === 0,
      requiredSectionsPresent: item.selectors.every((selector) => {
        const section = metrics.selectorMetrics[selector];
        return Boolean(section && section.visible && section.width > 0 && section.height > 0);
      }),
      densityWithinContract: metrics.screenCount <= item.maxScreens[viewport.name],
      responsiveNav: metrics.toggleVisible === expectedToggle,
      footerWithinContract: metrics.footerHeight === null || metrics.footerHeight <= footerBudget,
      footerTouchTarget: !viewport.touch || metrics.socialMinHeight === null || metrics.socialMinHeight >= 48,
      criticalTouchTargets: metrics.tinyTargets.length === 0
    };

    const passed = Object.values(checks).every(Boolean);
    const screenshot = path.join(out, item.name + '-' + viewport.name + '.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    const record = { viewport, page: item, status, metrics, errors, checks, passed, screenshot };
    results.push(record);
    if (!passed) failures.push(item.name + '/' + viewport.name);
    await context.close();
  }
}

await browser.close();
await fs.writeFile(
  path.join(out, 'report.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, results }, null, 2)
);

for (const r of results) {
  const failed = Object.entries(r.checks).filter(([, ok]) => !ok).map(([name]) => name);
  console.log(
    (r.passed ? 'PASS ' : 'FAIL ') +
    r.page.name + '/' + r.viewport.name +
    ' overflow=' + r.metrics.overflow +
    ' screens=' + r.metrics.screenCount.toFixed(2) +
    ' footer=' + r.metrics.footerHeight +
    ' failed=' + failed.join('|') +
    (r.metrics.tinyTargets.length ? ' tiny=' + JSON.stringify(r.metrics.tinyTargets) : '')
  );
}

if (failures.length) {
  console.error('Responsive Visual Gate V2 failed: ' + failures.join(', '));
  process.exit(1);
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'mobile-visual-regression-v1');
await fs.mkdir(out, { recursive: true });

const viewports = [
  { name: 'iphone-390', width: 390, height: 844, mobile: true },
  { name: 'iphone-430', width: 430, height: 932, mobile: true },
  { name: 'ipad-820', width: 820, height: 1180, mobile: false }
];

const pages = [
  {
    name: 'about',
    path: '/about',
    selectors: ['.about-v2-hero', '.about-v2-summary', '.about-official', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 11.5, 'iphone-430': 10.8, 'ipad-820': 8.5 }
  },
  {
    name: 'contact',
    path: '/contact',
    selectors: ['.contact-hero', '.contact-aside', '.contact-form-card', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 8.5, 'iphone-430': 8.0, 'ipad-820': 6.5 }
  },
  {
    name: 'books',
    path: '/books',
    selectors: ['.books-v2-hero', '.books-v2-featured', '.books-v2-categories', '.books-v2-library', '#site-footer-v2'],
    maxScreens: { 'iphone-390': 10.5, 'iphone-430': 9.8, 'ipad-820': 8.0 }
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
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push('console: ' + msg.text());
    });

    const response = await page.goto(baseURL + item.path, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;

    const metrics = await page.evaluate(({ selectors, mobile, height }) => {
      const doc = document.documentElement;
      const body = document.body;
      const visible = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && s.pointerEvents !== 'none' && r.width > 0 && r.height > 0;
      };
      const selectorMetrics = Object.fromEntries(selectors.map((selector) => {
        const el = document.querySelector(selector);
        if (!el) return [selector, null];
        const r = el.getBoundingClientRect();
        return [selector, { width: Math.round(r.width), height: Math.round(r.height) }];
      }));

      const criticalSelector = [
        'button',
        'input',
        'select',
        'textarea',
        '.homepage-nav-toggle',
        '.mobile-nav-cta',
        '.site-footer-v2__socials a',
        '.about-official-link',
        '.books-v2-actions a'
      ].join(',');
      const interactive = [...document.querySelectorAll(criticalSelector)]
        .filter(visible)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            type: el instanceof HTMLInputElement ? el.type : '',
            width: Math.round(r.width),
            height: Math.round(r.height),
            text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 60)
          };
        });

      const tinyTargets = interactive.filter((x) => {
        if (x.tag === 'INPUT' && ['checkbox','radio','hidden'].includes(x.type)) return false;
        if (['INPUT','SELECT','TEXTAREA'].includes(x.tag)) return x.height < 44;
        return x.height < 44 || x.width < 44;
      });

      const footer = document.querySelector('#site-footer-v2');
      const footerRect = footer?.getBoundingClientRect();
      const officialCards = [...document.querySelectorAll('.site-footer-v2__socials a')].filter(visible);
      const officialHeights = officialCards.map((el) => Math.round(el.getBoundingClientRect().height));
      const docHeight = Math.max(doc.scrollHeight, body.scrollHeight);

      return {
        width: window.innerWidth,
        height,
        overflow: Math.max(doc.scrollWidth, body.scrollWidth) - window.innerWidth,
        docHeight,
        screenCount: docHeight / height,
        toggleVisible: visible(document.querySelector('.homepage-nav-toggle')),
        selectorMetrics,
        tinyTargets: tinyTargets.slice(0, 12),
        footerHeight: footerRect ? Math.round(footerRect.height) : null,
        officialCardMinHeight: officialHeights.length ? Math.min(...officialHeights) : null,
        mobile
      };
    }, { selectors: item.selectors, mobile: viewport.mobile, height: viewport.height });

    const checks = {
      httpOk: status >= 200 && status < 400,
      noPageErrors: errors.length === 0,
      noHorizontalOverflow: metrics.overflow <= 1,
      allSelectorsPresent: item.selectors.every((selector) => metrics.selectorMetrics[selector]),
      navResponsive: viewport.mobile ? metrics.toggleVisible === true : true,
      densityWithinContract: metrics.screenCount <= item.maxScreens[viewport.name],
      footerWithinContract: metrics.footerHeight === null || metrics.footerHeight <= (viewport.mobile ? 720 : 680),
      footerTouchTargets: metrics.officialCardMinHeight === null || metrics.officialCardMinHeight >= 48,
      noCriticalTinyTargets: metrics.tinyTargets.length === 0
    };

    if (item.name === 'about' && viewport.mobile) {
      const h = metrics.selectorMetrics['.about-v2-summary']?.height ?? 9999;
      checks.aboutSummaryCompact = h <= 360;
    }

    if (item.name === 'contact' && viewport.mobile) {
      const optionHeights = await page.locator('.contact-type-option span').evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().height))
      );
      checks.contactTypeTargets = optionHeights.length > 0 && Math.min(...optionHeights) >= 44 && Math.max(...optionHeights) <= 64;
    }

    if (item.name === 'books' && viewport.mobile) {
      const categoryHeights = await page.locator('.books-v2-category-grid article').evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().height))
      );
      checks.booksCategoryDensity = categoryHeights.length > 0 && Math.max(...categoryHeights) <= 220;
    }

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
  const failedChecks = Object.entries(r.checks).filter(([, ok]) => !ok).map(([name]) => name);
  console.log((r.passed ? 'PASS ' : 'FAIL ') + r.page.name + '/' + r.viewport.name +
    ' overflow=' + r.metrics.overflow + 'px screens=' + r.metrics.screenCount.toFixed(2) +
    ' footer=' + r.metrics.footerHeight + 'px failed=' + failedChecks.join('|'));
}

if (failures.length) {
  console.error('Mobile Visual Regression Gate V1 failed: ' + failures.join(', '));
  process.exit(1);
}

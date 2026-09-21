import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/growth-literature-gold';

const targets = [
  {
    name: 'growth-home',
    route: '/guides/growth-leadership',
    required: ['.growth-hero', '.growth-hero__actions', '.growth-extension', '.growth-rail-discovery'],
  },
  {
    name: 'literature',
    route: '/guides/growth-leadership/literature',
    required: ['.ll-hero', '.ll-featured', '.ll-series', '.ll-playbook'],
  },
  {
    name: 'ep01',
    route: '/guides/growth-leadership/literature/old-man-and-the-sea',
    required: ['.le-hero', '.le-visual--ep01', '.le-research-brief', '.le-key-takeaways', '.le-action', '.le-faq', '.le-next'],
  },
  {
    name: 'ep02',
    route: '/guides/growth-leadership/literature/little-prince',
    required: ['.le-hero', '.le-visual--ep02', '.le-research-brief', '.le-key-takeaways', '.le-action', '.le-faq', '.le-next'],
  },
  {
    name: 'playbook',
    route: '/guides/growth-leadership/playbook/performance-coaching',
    required: ['.lp-hero', '.lp-principle', '.lp-questions', '.lp-gold'],
  },
];

const viewports = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const target of targets) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const pageErrors = [];

    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`);
    });

    const response = await page.goto(`${baseURL}${target.route}`, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;

    const metrics = await page.evaluate((required) => {
      const viewportWidth = window.innerWidth;
      const bodyWidth = document.body.scrollWidth;
      const docWidth = document.documentElement.scrollWidth;
      const visible = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const hero = document.querySelector('.le-visual--ep01, .le-visual--ep02');
      const heroBg = hero ? getComputedStyle(hero).backgroundImage : '';
      return {
        overflow: Math.max(bodyWidth, docWidth) - viewportWidth,
        requiredVisible: Object.fromEntries(required.map((selector) => [selector, visible(selector)])),
        heroBackgroundConnected: hero ? (hero.classList.contains('le-visual--ep01') ? heroBg.includes('ep01-old-man-and-the-sea.webp') : heroBg.includes('ep02-little-prince.webp')) : null,
        title: document.title,
      };
    }, target.required);

    const heroAssetDecoded = ['ep01', 'ep02'].includes(target.name)
      ? await page.evaluate(async (name) => {
          const src = name === 'ep01'
            ? '/images/leadership/literature/ep01-old-man-and-the-sea.webp'
            : '/images/leadership/literature/ep02-little-prince.webp';
          return await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({
              ok: img.naturalWidth > 0 && img.naturalHeight > 0,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
            img.onerror = () => resolve({ ok: false, width: 0, height: 0 });
            img.src = src + '?qa=' + Date.now();
          });
        }, target.name)
      : { ok: true, width: null, height: null };

    const checks = {
      httpOk: status >= 200 && status < 400,
      noHorizontalOverflow: metrics.overflow <= 1,
      noPageErrors: pageErrors.length === 0,
      requiredVisible: Object.values(metrics.requiredVisible).every(Boolean),
      heroConnected: ['ep01','ep02'].includes(target.name) ? metrics.heroBackgroundConnected === true : true,
      heroAssetDecoded: heroAssetDecoded.ok === true,
      ep02Dimensions: target.name === 'ep02' ? heroAssetDecoded.width === 1200 && heroAssetDecoded.height === 675 : true,
      titlePresent: Boolean(metrics.title),
    };

    const screenshot = path.join(outputDir, `${target.name}-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    const passed = Object.values(checks).every(Boolean);
    report.push({ target, viewport, status, metrics, heroAssetDecoded, pageErrors, checks, passed, screenshot });
    if (!passed) failures.push(`${target.name}-${viewport.name}`);

    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${target.name} ${viewport.name} overflow=${metrics.overflow}px errors=${pageErrors.length}`
    );

    await context.close();
  }
}

await browser.close();

await fs.writeFile(
  path.join(outputDir, 'report.json'),
  JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), report }, null, 2)
);

if (failures.length) {
  console.error(`Growth Literature GOLD QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

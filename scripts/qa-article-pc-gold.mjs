import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/article-pc';
const articlePath = '/articles/anthropic-ipo-ai-safety-2026';
const viewports = [
  { width: 1440, height: 900 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
];
const results = [];
const failures = [];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function pageHealth(page) {
  return page.evaluate(() => ({
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
    brokenImages: [...document.images]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') || 'unknown'),
  }));
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];

  await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

  const response = await page.goto(`${baseURL}${articlePath}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});
  const health = await pageHealth(page);

  const structure = await page.evaluate(() => {
    const h1 = document.querySelector('.research-cover h1');
    const cover = document.querySelector('.research-cover');
    const heroFigure = document.querySelector('.research-v2-shell.article-shell > figure');
    const cta = document.querySelector('.homepage-nav-cta');
    const toggle = document.querySelector('.homepage-nav-toggle');

    const visible = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };

    const h1Style = h1 ? getComputedStyle(h1) : null;
    const lineHeight = h1Style ? Number.parseFloat(h1Style.lineHeight) : 0;
    const h1Height = h1 ? h1.getBoundingClientRect().height : 0;
    const h1Lines = lineHeight > 0 ? Math.round(h1Height / lineHeight) : 0;
    const coverRect = cover?.getBoundingClientRect();
    const heroRect = heroFigure?.getBoundingClientRect();
    const ctaStyle = cta ? getComputedStyle(cta) : null;
    const toggleStyle = toggle ? getComputedStyle(toggle) : null;

    return {
      h1Text: h1?.textContent?.trim() || '',
      h1Lines,
      h1FontSize: h1Style ? Number.parseFloat(h1Style.fontSize) : 0,
      coverHeight: coverRect?.height ?? 0,
      heroTop: heroRect?.top ?? Number.POSITIVE_INFINITY,
      heroVisibleAboveFold: Boolean(heroRect && heroRect.top < window.innerHeight && heroRect.bottom > 0),
      ctaVisible: visible(cta),
      ctaColor: ctaStyle?.color || '',
      toggleHidden: !toggle || toggleStyle?.display === 'none' || !visible(toggle),
    };
  });

  const checks = {
    httpOk: (response?.status() ?? 0) >= 200 && (response?.status() ?? 0) < 400,
    noOverflow: health.overflow <= 1,
    noBrokenImages: health.brokenImages.length === 0,
    noErrors: errors.length === 0,
    titleCorrect: structure.h1Text === 'AI는 늦추자, IPO는 간다｜앤트로픽 2조 달러 상장이 던진 질문',
    titleTwoLines: structure.h1Lines === 2,
    compactCover: structure.coverHeight <= 390,
    heroVisibleAboveFold: structure.heroVisibleAboveFold,
    headerCtaVisible: structure.ctaVisible,
    desktopToggleHidden: structure.toggleHidden,
  };

  const passed = Object.values(checks).every(Boolean);
  const name = `article-pc-${viewport.width}`;
  const screenshot = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });

  results.push({ viewport, checks, health, structure, errors, passed, screenshot });
  if (!passed) failures.push(name);
  console.log(`${passed ? 'PASS' : 'FAIL'} Article PC GOLD ${viewport.width}px`, structure);

  await context.close();
}

await browser.close();
await fs.writeFile(
  path.join(outputDir, 'report.json'),
  JSON.stringify({ baseURL, articlePath, generatedAt: new Date().toISOString(), results }, null, 2),
);

if (failures.length) {
  console.error(`Article PC GOLD QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/homepage';
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1366', width: 1366, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1600', width: 1600, height: 1000 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];
const pcFidelityWidths = new Set([1440, 1600, 1920]);

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const message = msg.text();
    const benignGoogleReportOnlyFrameError =
      message.includes('[Report Only]') &&
      message.includes("Refused to frame 'https://www.google.com/'") &&
      message.includes("frame-ancestors 'self'");
    if (!benignGoogleReportOnlyFrameError) pageErrors.push(`console: ${message}`);
  });

  const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;

  // Trigger lazy-loaded media with instant QA-only scrolling, then return to the real first viewport.
  await page.evaluate(async () => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
    const step = Math.max(320, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 120));
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 2000 }).catch(() => {});
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const imageState = [...document.images].map((img) => ({
      src: img.getAttribute('src') || 'unknown',
      complete: img.complete,
      naturalWidth: img.naturalWidth,
    }));
    const brokenImages = imageState
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src);
    const viewportWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    const docWidth = document.documentElement.scrollWidth;
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
    const visible = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, width: r.width, height: r.height };
    };

    const heroTitle = rect('#home-title');
    const heroDesc = rect('.home-hero__desc');
    const editorial = rect('.home-hero__today');
    const guide = rect('.home-guide');
    const navShell = rect('#site-nav-shell');
    const homeShell = rect('.home-v2');
    const leadArticle = document.querySelector('.editorial-main-feature');
    const leadRect = rect('.editorial-main-feature');
    const leadImage = leadArticle?.querySelector('img');
    const companionArticles = [...document.querySelectorAll('.editorial-side-feature')];
    const leadHref = leadArticle?.getAttribute('href') || '';
    const companionHrefs = companionArticles.map((el) => el.getAttribute('href') || '');
    const topicHrefs = [...document.querySelectorAll('.editorial-hero__topics a')].map((el) => el.getAttribute('href'));
    const featureIsNavy = Boolean(leadArticle && getComputedStyle(leadArticle).backgroundColor === 'rgb(7, 25, 56)');
    const featuredStructureValid = Boolean(
      leadArticle && leadRect && leadRect.top < window.innerHeight &&
      leadHref.startsWith('/articles/') &&
      leadImage?.naturalWidth > 0 &&
      companionArticles.length === 2 &&
      companionHrefs.every((href) => href.startsWith('/articles/')) &&
      new Set([leadHref, ...companionHrefs]).size === 3 &&
      new Set(topicHrefs).size === 3 &&
      topicHrefs.includes('/guides/investing') &&
      topicHrefs.includes('/guides/ai-productivity') &&
      topicHrefs.includes('/guides/growth-leadership')
    );
    const archiveDescription = document.querySelector('.home-archive .article-card p');
    const search = document.querySelector('#content-search');
    const tag = document.querySelector('#tag-filter');
    const majorHeading = [...document.querySelectorAll('.home-section-title h2')].find((el) => el.textContent?.trim() === '주요 리서치');
    const latestHeading = [...document.querySelectorAll('.home-section-title h2')].find((el) => el.textContent?.trim() === '최신 업데이트');
    const archiveHeading = document.querySelector('.home-archive .home-section-title h2');
    const heroCta = document.querySelector('.home-hero__cta');

    const identityCue = Boolean(
      heroTitle && heroDesc &&
      text('#home-title').includes('생각을 분석하고') &&
      text('#home-title').includes('분석을 실행으로') &&
      text('.home-hero__desc').includes('독립 리서치 미디어') &&
      heroTitle.top >= 0 && heroTitle.bottom <= window.innerHeight &&
      heroDesc.bottom <= window.innerHeight
    );
    const whatToReadCue = Boolean(
      editorial && editorial.top >= 0 && editorial.top < window.innerHeight &&
      featuredStructureValid &&
      featureIsNavy &&
      heroCta?.getAttribute('href') === '#today-research'
    );
    const whereToStartCue = Boolean(
      guide &&
      text('#guide-title') === 'Research Guide' &&
      text('.home-guide .home-eyebrow') === 'START HERE' &&
      guide.top <= window.innerHeight * 3.2
    );

    return {
      viewportWidth,
      bodyWidth,
      docWidth,
      overflow: Math.max(bodyWidth, docWidth) - viewportWidth,
      brokenImages,
      imageState,
      keyVisibility: {
        hero: visible('.home-hero'),
        pillars: visible('.home-pillars'),
        majorResearch: visible('.home-research-grid'),
        guide: visible('.home-guide'),
        archive: visible('.home-archive'),
      },
      fidelity: {
        navHomeLeftDelta: navShell && homeShell ? Math.abs(navShell.left - homeShell.left) : null,
        navHomeRightDelta: navShell && homeShell ? Math.abs(navShell.right - homeShell.right) : null,
        featureIsNavy,
        featuredStructureValid,
        featuredArticleCount: Number(Boolean(leadArticle)) + companionArticles.length,
        featuredHrefs: [leadHref, ...companionHrefs],
        topicHrefs,
        archiveDescriptionClamp: archiveDescription ? getComputedStyle(archiveDescription).webkitLineClamp : null,
        searchPlaceholder: search?.getAttribute('placeholder') || '',
        tagDefaultLabel: tag?.querySelector('option')?.textContent?.trim() || '',
        sectionLabels: {
          editorial: text('#feature-section-title'),
          major: majorHeading?.textContent?.trim() || '',
          latest: latestHeading?.textContent?.trim() || '',
          archive: archiveHeading?.textContent?.trim() || '',
        },
      },
      tenSecondFlow: {
        identityCue,
        whatToReadCue,
        whereToStartCue,
        featuredStructureValid,
        featureIsNavy,
        featureTop: leadRect?.top ?? null,
        guideTop: guide?.top ?? null,
      },
    };
  });

  const screenshot = path.join(outputDir, `${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

  const checks = {
    httpOk: status >= 200 && status < 400,
    noHorizontalOverflow: metrics.overflow <= 1,
    noBrokenImages: metrics.brokenImages.length === 0,
    noPageErrors: pageErrors.length === 0,
    keySectionsVisible: Object.values(metrics.keyVisibility).every(Boolean),
  };

  if (pcFidelityWidths.has(viewport.width)) {
    checks.pcShellAligned = (metrics.fidelity.navHomeLeftDelta ?? 999) <= 1 && (metrics.fidelity.navHomeRightDelta ?? 999) <= 1;
    checks.featureVisualIdentity = metrics.fidelity.featureIsNavy === true; 
    checks.featuredContentIntegrity = metrics.fidelity.featuredStructureValid === true && metrics.fidelity.featuredArticleCount === 3;
    checks.archiveDescriptionThreeLines = metrics.fidelity.archiveDescriptionClamp === '3';
    checks.archiveSearchGeneralized = metrics.fidelity.searchPlaceholder === '기업·기술·시장·업무·리더십 키워드 검색' && metrics.fidelity.tagDefaultLabel === '전체 주제';
    checks.researchHierarchyClear = metrics.fidelity.sectionLabels.editorial === '주요 리서치' && metrics.fidelity.sectionLabels.major === '주요 리서치' && metrics.fidelity.sectionLabels.latest === '최신 업데이트' && metrics.fidelity.sectionLabels.archive === '전체 리서치';
    checks.tenSecondComprehension = metrics.tenSecondFlow.identityCue === true && metrics.tenSecondFlow.whatToReadCue === true && metrics.tenSecondFlow.whereToStartCue === true && metrics.tenSecondFlow.featuredStructureValid === true;
  }

  const passed = Object.values(checks).every(Boolean);
  report.push({ viewport, status, metrics, pageErrors, checks, passed, screenshot });
  if (!passed) failures.push(viewport.name);
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), report }, null, 2));

for (const item of report) {
  const flow = item.viewport.width >= 1440 ? ` flow=${item.checks.tenSecondComprehension ? 'PASS' : 'FAIL'}` : '';
  console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.viewport.name} overflow=${item.metrics.overflow}px broken=${item.metrics.brokenImages.length} errors=${item.pageErrors.length}${flow}`);
}

if (failures.length) {
  console.error(`Homepage viewport QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

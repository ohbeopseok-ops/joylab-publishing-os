import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/about-activation';
const viewports = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
  { name: 'desktop-1920', width: 1920, height: 1080, mobile: false },
];

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
    if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`);
  });

  const response = await page.goto(`${baseURL}/about`, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;

  const metrics = await page.evaluate(() => {
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
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
    const schemaNode = document.getElementById('joylab-identity-schema');
    let schema = null;
    try { schema = schemaNode ? JSON.parse(schemaNode.textContent || '{}') : null; } catch {}
    const graph = schema?.['@graph'] || [];
    const org = graph.find((node) => node?.['@id'] === 'https://aijoylab.kr/#organization');
    const founder = graph.find((node) => node?.['@id'] === 'https://aijoylab.kr/#founder');
    const channelLinks = [...document.querySelectorAll('.about-official-link')].map((link) => ({
      label: link.querySelector('strong')?.textContent?.trim() || '',
      href: link.getAttribute('href') || '',
      placement: link.getAttribute('data-analytics-placement') || '',
      event: link.getAttribute('data-analytics-event') || '',
    }));
    return {
      overflow: Math.max(bodyWidth, docWidth) - viewportWidth,
      heroVisible: visible('.about-v2-hero'),
      officialVisible: visible('.about-official'),
      ctaVisible: visible('.about-v2-cta'),
      toggleVisible: visible('.homepage-nav-toggle'),
      officialTitle: text('#about-official-title'),
      operatorLabel: [...document.querySelectorAll('.about-v2-summary small')].at(-1)?.textContent?.trim() || '',
      operatorValue: [...document.querySelectorAll('.about-v2-summary strong')].at(-1)?.textContent?.trim() || '',
      channelLinks,
      organizationSameAs: Array.isArray(org?.sameAs) ? org.sameAs : [],
      founderSameAs: Array.isArray(founder?.sameAs) ? founder.sameAs : [],
    };
  });

  const expectedChannels = ['Threads', 'X', 'LinkedIn', 'Naver Blog', 'YouTube', 'Instagram', 'RSS'];
  const socialLinks = metrics.channelLinks.filter((item) => item.label !== 'RSS');
  const rssLink = metrics.channelLinks.find((item) => item.label === 'RSS');
  const checks = {
    httpOk: status >= 200 && status < 400,
    noHorizontalOverflow: metrics.overflow <= 1,
    noPageErrors: pageErrors.length === 0,
    heroVisible: metrics.heroVisible,
    officialChannelsVisible: metrics.officialVisible,
    ctaVisible: metrics.ctaVisible,
    officialChannelsComplete: expectedChannels.every((label) => metrics.channelLinks.some((item) => item.label === label)) && metrics.channelLinks.length === 7,
    socialAnalyticsWired: socialLinks.length === 6 && socialLinks.every((item) => item.event === 'social_click' && item.placement === 'about'),
    rssNotMisclassifiedAsSocial: Boolean(rssLink) && rssLink.event === '' && rssLink.placement === '',
    operatorIdentityClear: metrics.operatorLabel === 'FOUNDER & OPERATOR' && metrics.operatorValue === '오법석 · AIJoyLab',
    organizationSameAs: ['https://blog.naver.com/joy014', 'https://www.instagram.com/aijoylab/', 'https://x.com/shark01479', 'https://www.youtube.com/@superhalabe100'].every((url) => metrics.organizationSameAs.includes(url)),
    founderSameAs: ['https://www.threads.com/@ohbeopseok', 'https://www.linkedin.com/in/%EB%B2%95%EC%84%9D-%EC%98%A4-b3273633b/'].every((url) => metrics.founderSameAs.includes(url)),
    navToggleResponsive: viewport.mobile ? metrics.toggleVisible === true : metrics.toggleVisible === false,
  };

  const screenshot = path.join(outputDir, `${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  const passed = Object.values(checks).every(Boolean);
  report.push({ viewport, status, metrics, pageErrors, checks, passed, screenshot });
  if (!passed) failures.push(viewport.name);
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), report }, null, 2));

for (const item of report) {
  console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.viewport.name} overflow=${item.metrics.overflow}px errors=${item.pageErrors.length} toggle=${item.metrics.toggleVisible ? 'visible' : 'hidden'} channels=${item.metrics.channelLinks.length}`);
}

if (failures.length) {
  console.error(`About Activation QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

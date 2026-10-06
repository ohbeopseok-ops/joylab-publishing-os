import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const beforeURL = process.env.EVIDENCE_BEFORE_URL || 'https://aijoylab.kr';
const afterURL = process.env.EVIDENCE_AFTER_URL || 'http://127.0.0.1:4321';
const out = path.join(process.cwd(), 'qa-artifacts', 'homepage-visual-evidence-v1');
await fs.mkdir(out, { recursive: true });

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 }
];

const browser = await chromium.launch({ headless: true });

async function capture(label, baseURL, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  const response = await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 45000 });
  const status = response?.status() ?? 0;
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const visible = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0;
    };
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const all = [...document.querySelectorAll('body *')].filter(visible);
    const raisedSurfaces = all.filter((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const radius = Number.parseFloat(s.borderTopLeftRadius) || 0;
      const shadow = s.boxShadow && s.boxShadow !== 'none';
      const bg = s.backgroundColor;
      return r.width >= 180 && r.height >= 70 && (radius >= 18 || shadow) && bg !== 'rgba(0, 0, 0, 0)';
    });
    const pillLike = all.filter((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const radius = Number.parseFloat(s.borderTopLeftRadius) || 0;
      return r.width >= 40 && r.height >= 20 && r.height <= 60 && radius >= Math.min(999, r.height / 2 - 1);
    });
    const gradientText = all.filter((el) => {
      const s = getComputedStyle(el);
      return (s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') && s.backgroundImage !== 'none';
    });
    const hoverLiftCandidates = [...document.querySelectorAll('.home-research-card,.home-guide-step,.home-archive .article-card')]
      .filter(visible).length;

    const hero = rect('.home-hero');
    const pillars = rect('.home-pillars');
    const guide = rect('.home-guide');
    const books = rect('.home-books-v2__grid');
    const latest = rect('.home-section--latest');
    const title = rect('#home-title');
    const cta = rect('.home-hero__cta');
    const editorial = rect('.home-hero__today');

    return {
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      docHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      hero, pillars, guide, books, latest,
      firstScreen: {
        titleVisible: Boolean(title && title.top >= 0 && title.bottom <= innerHeight),
        ctaVisible: Boolean(cta && cta.top >= 0 && cta.top <= innerHeight),
        editorialStartsAboveFold: Boolean(editorial && editorial.top < innerHeight)
      },
      semanticCounts: {
        pillars: document.querySelectorAll('.home-pillar').length,
        featuredHubs: document.querySelectorAll('.home-treasury-card').length,
        majorResearchCards: document.querySelectorAll('.home-research-card').length,
        guideSteps: document.querySelectorAll('.home-guide-step').length
      },
      antiSlopEvidence: {
        raisedSurfaces: raisedSurfaces.length,
        pillLike: pillLike.length,
        gradientText: gradientText.length,
        hoverLiftCandidateCollectionItems: hoverLiftCandidates
      }
    };
  });

  const screenshot = path.join(out, label + '-' + viewport.name + '.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await context.close();
  return { label, baseURL, viewport, status, errors, metrics, screenshot };
}

const records = [];
for (const viewport of viewports) {
  records.push(await capture('before-production', beforeURL, viewport));
  records.push(await capture('after-pr', afterURL, viewport));
}
await browser.close();

const comparisons = viewports.map((viewport) => {
  const before = records.find((r) => r.label === 'before-production' && r.viewport.name === viewport.name);
  const after = records.find((r) => r.label === 'after-pr' && r.viewport.name === viewport.name);
  const b = before.metrics.antiSlopEvidence;
  const a = after.metrics.antiSlopEvidence;
  return {
    viewport: viewport.name,
    overflowBefore: before.metrics.overflow,
    overflowAfter: after.metrics.overflow,
    firstScreenAfter: after.metrics.firstScreen,
    antiSlopDelta: {
      raisedSurfaces: a.raisedSurfaces - b.raisedSurfaces,
      pillLike: a.pillLike - b.pillLike,
      gradientText: a.gradientText - b.gradientText
    },
    semanticCountsAfter: after.metrics.semanticCounts
  };
});

const hardFailures = comparisons.flatMap((c) => {
  const f = [];
  if (c.overflowAfter > 1) f.push(c.viewport + ': horizontal overflow');
  if (!c.firstScreenAfter.titleVisible) f.push(c.viewport + ': home title not visible in first screen');
  if (!c.firstScreenAfter.ctaVisible && c.viewport !== 'mobile-390') f.push(c.viewport + ': primary CTA not visible in first screen');
  if (c.antiSlopDelta.gradientText > 0) f.push(c.viewport + ': gradient-text count regressed');
  return f;
});

const report = { generatedAt: new Date().toISOString(), beforeURL, afterURL, comparisons, records, hardFailures };
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));

const md = [
  '# Homepage Visual Evidence V1',
  '',
  'Before: ' + beforeURL,
  'After: ' + afterURL,
  '',
  '| Viewport | Overflow before→after | Raised surfaces Δ | Pill-like Δ | Gradient text Δ |',
  '|---|---:|---:|---:|---:|',
  ...comparisons.map((c) => '| ' + c.viewport + ' | ' + c.overflowBefore + '→' + c.overflowAfter + ' | ' + c.antiSlopDelta.raisedSurfaces + ' | ' + c.antiSlopDelta.pillLike + ' | ' + c.antiSlopDelta.gradientText + ' |'),
  '',
  hardFailures.length ? '## BLOCKERS\n' + hardFailures.map((x) => '- ' + x).join('\n') : '## Verdict\nPASS — no hard visual-evidence regression detected.',
  '',
  '> Counts are evidence for review, not automatic proof of design quality. Existing Responsive Visual Gate V2 remains authoritative for layout budgets and touch/accessibility checks.'
].join('\n');
await fs.writeFile(path.join(out, 'summary.md'), md);

console.log(md);
if (hardFailures.length) process.exit(1);

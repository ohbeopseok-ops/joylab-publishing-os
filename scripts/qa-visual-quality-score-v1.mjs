import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.VQ_BASE_URL || 'http://127.0.0.1:4321';
const outDir = path.join(process.cwd(), 'qa-artifacts', 'visual-quality-score-v1');
await fs.mkdir(outDir, { recursive: true });

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 800 }
];

const families = [
  {
    name: 'homepage',
    path: '/',
    signatures: ['.home-hero', '.home-pillars', '.home-guide'],
    purposeTerms: ['JoyLab', '리서치'],
    evidenceTerms: ['Fact', 'Interpretation', 'Scenario', 'Action']
  },
  {
    name: 'research-article',
    path: '/articles/semiconductor-giant-shoulder-flow',
    signatures: ['.research-cover', '.research-layout', '#article-content'],
    purposeTerms: ['반도체', '수급'],
    evidenceTerms: ['Fact', 'Interpretation', 'Scenario', 'Action']
  },
  {
    name: 'guide',
    path: '/guides/semiconductor-investing',
    signatures: ['.sg-hero', '.sg-main'],
    purposeTerms: ['반도체', '투자'],
    evidenceTerms: ['Fact', 'Interpretation', 'Scenario', 'Action']
  },
  {
    name: 'books',
    path: '/books',
    signatures: ['.books-v2-launch-hero', '.books-v2-library'],
    purposeTerms: ['JoyLab', 'Books'],
    evidenceTerms: ['책', '리서치']
  }
];

const browser = await chromium.launch({ headless: true });
const records = [];
const criticals = [];

for (const family of families) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    await page.route('**/__analytics/event', (route) => route.fulfill({ status: 204, body: '' }));

    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    const response = await page.goto(baseURL + family.path, { waitUntil: 'networkidle', timeout: 45000 });
    const status = response?.status() ?? 0;

    await page.evaluate(async () => {
      document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
      const step = Math.max(360, Math.floor(innerHeight * .8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });

    const m = await page.evaluate(({ signatures, purposeTerms, evidenceTerms, familyName }) => {
      const visible = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0;
      };
      const text = document.body.innerText || '';
      const h1s = [...document.querySelectorAll('h1')].filter(visible);
      const h2s = [...document.querySelectorAll('h2')].filter(visible);
      const links = [...document.querySelectorAll('a[href]')].filter(visible);
      const buttons = [...document.querySelectorAll('button')].filter(visible);
      const images = [...document.images].filter(visible);
      const bodyStyle = getComputedStyle(document.body);
      const main = document.querySelector('main') || document.querySelector('.home-v2') || document.body;
      const mainStyle = getComputedStyle(main);
      const all = [...document.querySelectorAll('body *')].filter(visible);

      const unlabeledControls = [...buttons, ...links].filter((el) => {
        const label = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
        return !label;
      });

      const brokenImages = images.filter((img) => !img.complete || img.naturalWidth === 0);
      const meaningfulAltRatio = images.length
        ? images.filter((img) => (img.getAttribute('alt') || '').trim() || img.getAttribute('aria-hidden') === 'true').length / images.length
        : 1;

      const raised = all.filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const radius = parseFloat(s.borderTopLeftRadius) || 0;
        const shadow = s.boxShadow && s.boxShadow !== 'none';
        return r.width >= 180 && r.height >= 70 && (radius >= 18 || shadow);
      });

      const pillLike = all.filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const radius = parseFloat(s.borderTopLeftRadius) || 0;
        return r.width >= 40 && r.height >= 20 && r.height <= 60 && radius >= Math.max(12, r.height / 2 - 1);
      });

      const gradientText = all.filter((el) => {
        const s = getComputedStyle(el);
        return (s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') && s.backgroundImage !== 'none';
      });

      const signatureState = Object.fromEntries(signatures.map((selector) => {
        const el = document.querySelector(selector);
        return [selector, Boolean(el && visible(el))];
      }));

      const viewportWidth = innerWidth;
      const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - viewportWidth;
      const firstH1 = h1s[0]?.getBoundingClientRect();
      const firstPrimaryLink = links.find((a) => {
        const s = getComputedStyle(a);
        const r = a.getBoundingClientRect();
        return r.width >= 100 && r.height >= 36 && (s.fontWeight >= '600' || a.className.toString().includes('cta'));
      });
      const primaryRect = firstPrimaryLink?.getBoundingClientRect();

      let distinctive = 0;
      if (familyName === 'homepage') distinctive = document.querySelector('.home-hero__method') ? 10 : 7;
      if (familyName === 'research-article') distinctive = document.querySelector('.research-cover') && document.querySelector('#article-content') ? 10 : 6;
      if (familyName === 'guide') distinctive = document.querySelector('.sg-path') || text.includes('Fact → Interpretation → Scenario → Action') ? 10 : 6;
      if (familyName === 'books') distinctive = document.querySelector('.books-v2-launch-hero__cover') || document.querySelector('.books-v2-library') ? 10 : 6;

      const purpose = Math.min(10,
        (h1s.length === 1 ? 4 : 0) +
        (purposeTerms.every((term) => text.toLowerCase().includes(term.toLowerCase())) ? 4 : 2) +
        (firstH1 && firstH1.top < innerHeight ? 2 : 0)
      );

      const hierarchy = Math.min(10,
        (h1s.length === 1 ? 4 : 0) +
        (h2s.length >= 2 ? 3 : h2s.length === 1 ? 2 : 0) +
        (h1s[0] && h2s[0] && parseFloat(getComputedStyle(h1s[0]).fontSize) > parseFloat(getComputedStyle(h2s[0]).fontSize) ? 3 : 1)
      );

      const brand = Math.min(10,
        (text.includes('JoyLab') ? 4 : 0) +
        (getComputedStyle(document.body).color !== 'rgb(0, 0, 0)' ? 2 : 1) +
        (document.querySelector('#site-footer-v2') ? 2 : 0) +
        (document.querySelector('.brand') || document.querySelector('[class*="brand"]') ? 2 : 1)
      );

      const fontSize = parseFloat(bodyStyle.fontSize) || 16;
      const lineHeight = parseFloat(bodyStyle.lineHeight) || fontSize * 1.5;
      const readability = Math.min(10,
        (fontSize >= 16 ? 4 : fontSize >= 15 ? 2 : 0) +
        (lineHeight / fontSize >= 1.45 ? 3 : 1) +
        (parseFloat(mainStyle.maxWidth) !== 0 || main.getBoundingClientRect().width <= 1440 ? 3 : 1)
      );

      const evidence = Math.min(10,
        (evidenceTerms.some((term) => text.toLowerCase().includes(term.toLowerCase())) ? 5 : 2) +
        (text.includes('출처') || text.includes('Source') || text.includes('Research') || familyName === 'books' ? 3 : 1) +
        (brokenImages.length === 0 ? 2 : 0)
      );

      const interaction = Math.min(10,
        (links.length >= 3 ? 4 : links.length > 0 ? 2 : 0) +
        (unlabeledControls.length === 0 ? 4 : unlabeledControls.length <= 2 ? 2 : 0) +
        (primaryRect && primaryRect.width > 0 ? 2 : 1)
      );

      const responsive = Math.min(10,
        (overflow <= 1 ? 6 : 0) +
        (firstH1 && firstH1.left >= -1 && firstH1.right <= innerWidth + 1 ? 2 : 0) +
        (document.documentElement.scrollWidth <= innerWidth + 1 ? 2 : 0)
      );

      const accessibility = Math.min(10,
        (h1s.length === 1 ? 3 : 0) +
        (unlabeledControls.length === 0 ? 3 : unlabeledControls.length <= 2 ? 1 : 0) +
        (meaningfulAltRatio >= .9 ? 2 : meaningfulAltRatio >= .75 ? 1 : 0) +
        (document.querySelector('main') || document.querySelector('[role="main"]') ? 2 : 1)
      );

      let antiSlop = 10;
      if (gradientText.length > 0) antiSlop -= 2;
      if (raised.length > 18) antiSlop -= 2;
      if (pillLike.length > 20) antiSlop -= 2;
      if (all.filter((el) => {
        const s = getComputedStyle(el);
        return s.boxShadow && s.boxShadow !== 'none';
      }).length > 30) antiSlop -= 1;
      antiSlop = Math.max(0, antiSlop);

      return {
        viewportWidth,
        overflow,
        h1Count: h1s.length,
        h2Count: h2s.length,
        linkCount: links.length,
        unlabeledControls: unlabeledControls.length,
        imageCount: images.length,
        brokenImages: brokenImages.length,
        meaningfulAltRatio,
        signatureState,
        antiSlopEvidence: {
          raisedSurfaces: raised.length,
          pillLike: pillLike.length,
          gradientText: gradientText.length
        },
        scores: {
          purposeClarity: purpose,
          informationHierarchy: hierarchy,
          brandFit: brand,
          distinctiveComposition: distinctive,
          typographyReadability: readability,
          evidencePresentation: evidence,
          interactionClarity: interaction,
          responsiveQuality: responsive,
          accessibilityCues: accessibility,
          antiSlopCompliance: antiSlop
        }
      };
    }, { signatures: family.signatures, purposeTerms: family.purposeTerms, evidenceTerms: family.evidenceTerms, familyName: family.name });

    const missingSignatures = Object.entries(m.signatureState).filter(([, ok]) => !ok).map(([selector]) => selector);
    const localCritical = [];
    if (status < 200 || status >= 400) localCritical.push('HTTP ' + status);
    if (m.overflow > 1) localCritical.push('horizontal overflow ' + m.overflow + 'px');
    if (m.h1Count !== 1) localCritical.push('primary H1 count=' + m.h1Count);
    if (missingSignatures.length) localCritical.push('missing signatures: ' + missingSignatures.join(', '));
    if (m.unlabeledControls > 0) localCritical.push('unlabeled interactive controls=' + m.unlabeledControls);
    if (m.brokenImages > 0) localCritical.push('broken images=' + m.brokenImages);

    const total = Object.values(m.scores).reduce((sum, value) => sum + value, 0);
    const verdict = localCritical.length ? 'BLOCK' : total >= 90 ? 'GOLD' : total >= 80 ? 'PASS' : total >= 70 ? 'REWORK' : 'BLOCK';
    const screenshot = path.join(outDir, family.name + '-' + viewport.name + '.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    const record = { family, viewport, status, metrics: m, score: total, verdict, critical: localCritical, screenshot, pageErrors };
    records.push(record);
    if (localCritical.length) criticals.push(family.name + '/' + viewport.name + ': ' + localCritical.join('; '));
    await context.close();
  }
}

await browser.close();

const familySummary = families.map((family) => {
  const rows = records.filter((r) => r.family.name === family.name);
  const average = Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length);
  const min = Math.min(...rows.map((r) => r.score));
  const verdict = rows.some((r) => r.verdict === 'BLOCK') ? 'BLOCK' : min >= 90 ? 'GOLD' : min >= 80 ? 'PASS' : min >= 70 ? 'REWORK' : 'BLOCK';
  return { family: family.name, average, min, verdict };
});

const overallAverage = Math.round(familySummary.reduce((sum, x) => sum + x.average, 0) / familySummary.length);
const overallVerdict = criticals.length ? 'BLOCK' : familySummary.some((x) => x.verdict === 'BLOCK') ? 'BLOCK' : familySummary.some((x) => x.verdict === 'REWORK') ? 'REWORK' : overallAverage >= 90 ? 'GOLD' : 'PASS';

const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  overallAverage,
  overallVerdict,
  familySummary,
  criticals,
  records
};
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

const lines = [
  '# JoyLab Visual Quality Score V1',
  '',
  '- Overall average: **' + overallAverage + '/100**',
  '- Verdict: **' + overallVerdict + '**',
  '- Critical findings: **' + criticals.length + '**',
  '',
  '| Family | Average | Minimum | Verdict |',
  '|---|---:|---:|---|',
  ...familySummary.map((x) => '| ' + x.family + ' | ' + x.average + ' | ' + x.min + ' | ' + x.verdict + ' |'),
  '',
  '## Per viewport',
  '',
  '| Route | Viewport | Score | Verdict | Raised | Pills | Gradient text |',
  '|---|---|---:|---|---:|---:|---:|',
  ...records.map((r) => '| ' + r.family.name + ' | ' + r.viewport.name + ' | ' + r.score + ' | ' + r.verdict + ' | ' + r.metrics.antiSlopEvidence.raisedSurfaces + ' | ' + r.metrics.antiSlopEvidence.pillLike + ' | ' + r.metrics.antiSlopEvidence.gradientText + ' |'),
  '',
  criticals.length ? '## Critical\n' + criticals.map((x) => '- ' + x).join('\n') : '## Critical\n- None',
  '',
  '> Score is evidence. Existing family-specific GOLD gates and Release Gate remain authoritative.'
];
await fs.writeFile(path.join(outDir, 'summary.md'), lines.join('\n'));
console.log(lines.join('\n'));

if (criticals.length || familySummary.some((x) => x.min < 80)) process.exit(1);

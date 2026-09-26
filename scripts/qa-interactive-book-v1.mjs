import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/interactive-book-v1';
const route = '/labs/work-to-system-interactive';

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const viewport of [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const pageErrors = [];

  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const message = msg.text();
    const benignReportOnly =
      message.includes('[Report Only]') &&
      message.includes('Content Security Policy');
    if (!benignReportOnly) pageErrors.push(`console: ${message}`);
  });

  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;

  await page.locator('[data-interaction-id="memory-debt"] input').first().fill('내일 다시 확인할 상담사 Follow-up');
  await page.waitForTimeout(300);

  const riskCard = page.locator('[data-interaction-id="externalize-memory"]');
  await riskCard.locator('input[type="checkbox"]').nth(0).check();
  await riskCard.locator('input[type="checkbox"]').nth(1).check();

  const personaCard = page.locator('[data-interaction-id="persona0-moment"]');
  const personaInputs = personaCard.locator('textarea');
  await personaInputs.nth(0).fill('고객센터 현장 리더');
  await personaInputs.nth(1).fill('상담 직후');
  await personaInputs.nth(2).fill('현장을 이동하며 휴대폰으로');
  await personaInputs.nth(3).fill('20초 안에 기록');
  await page.waitForTimeout(300);

  await page.locator('#series02-open-records').click();
  await page.waitForTimeout(100);

  const metrics = await page.evaluate(() => {
    const score = document.querySelector('[data-interaction-id="externalize-memory"] .book-interactive-score strong')?.textContent?.trim();
    const band = document.querySelector('[data-interaction-id="externalize-memory"] .book-interactive-score em')?.textContent?.trim();
    const debtStatus = document.querySelector('[data-interaction-id="memory-debt"] .book-interactive-status')?.textContent?.trim();
    const personaStatus = document.querySelector('[data-interaction-id="persona0-moment"] .book-interactive-status')?.textContent?.trim();
    const panel = document.getElementById('book-interactive-panel');
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content');
    const raw = localStorage.getItem('joylab-book-work-to-system-lab-interactive-forms');
    const forms = raw ? JSON.parse(raw) : {};
    const viewportWidth = window.innerWidth;
    const overflow = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - viewportWidth;
    return {
      score,
      band,
      debtStatus,
      personaStatus,
      panelOpen: panel?.classList.contains('is-open') ?? false,
      hasSavedResultsHeading: Array.from(document.querySelectorAll('#book-interactive-panel-body h3')).some((el) => el.textContent?.trim() === '실습 결과'),
      artifactCount: document.getElementById('book-artifact-count')?.textContent?.trim(),
      formsKeys: Object.keys(forms).sort(),
      robots,
      overflow
    };
  });

  const checks = {
    httpOk: status >= 200 && status < 400,
    noindex: metrics.robots === 'noindex,nofollow',
    noHorizontalOverflow: metrics.overflow <= 1,
    noPageErrors: pageErrors.length === 0,
    memoryDebtSaved: metrics.formsKeys.some((key) => key.endsWith(':memory-debt')),
    memoryDebtComplete: metrics.debtStatus?.includes('완료 조건 충족') === true,
    riskScoreIsTwo: metrics.score === '2',
    riskBandMedium: metrics.band === 'MEDIUM',
    personaSaved: metrics.formsKeys.some((key) => key.endsWith(':persona0-moment')),
    personaComplete: metrics.personaStatus?.includes('Canvas 완료') === true,
    recordsPanelOpen: metrics.panelOpen === true,
    savedResultsVisible: metrics.hasSavedResultsHeading === true,
    threeArtifacts: Number(metrics.artifactCount) >= 3
  };

  const screenshot = path.join(outputDir, `series02-ch01-03-${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

  const passed = Object.values(checks).every(Boolean);
  report.push({ viewport, status, metrics, pageErrors, checks, passed, screenshot });
  if (!passed) failures.push(viewport.name);

  console.log(`${passed ? 'PASS' : 'FAIL'} Interactive Book V1 ${viewport.name} score=${metrics.score} band=${metrics.band} artifacts=${metrics.artifactCount}`);
  await context.close();
}

await browser.close();

await fs.writeFile(
  path.join(outputDir, 'report.json'),
  JSON.stringify({ baseURL, route, generatedAt: new Date().toISOString(), report }, null, 2)
);

if (failures.length) {
  console.error(`Interactive Book V1 QA failed: ${failures.join(', ')}`);
  process.exit(1);
}

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

  const sourceCard = page.locator('[data-interaction-id="stt-source-summary"]');
  await sourceCard.locator('textarea').nth(0).fill('김 상담사 오늘 결합 할인 문의에서 설명이 길어져 고객이 다시 물었고 두 번째에는 순서를 잡아 이해시켰음. 내일 오전 다시 모니터링.');
  await sourceCard.locator('textarea').nth(1).fill('결합할인 설명 순서 개선 필요, 내일 오전 재모니터링.');
  await sourceCard.locator('input[type="checkbox"]').check();

  const fragmentCard = page.locator('[data-interaction-id="memory-fragment-builder"]');
  const fragmentInputs = fragmentCard.locator('textarea');
  await fragmentInputs.nth(0).fill('김 상담사');
  await fragmentInputs.nth(1).fill('고객 설명 중 답변을 두 차례 끊고 다음 안내로 넘어감');
  await fragmentInputs.nth(2).fill('다음 요금 문의 1건 재모니터링');

  const contractCard = page.locator('[data-interaction-id="mini-data-contract"]');
  await contractCard.locator('.book-interactive-object-card input').nth(0).check();
  await contractCard.locator('.book-interactive-object-card input').nth(1).check();
  await contractCard.locator('.book-interactive-object-card input').nth(2).check();
  let relationSelects = contractCard.locator('.book-interactive-relation-row select');
  await relationSelects.nth(0).selectOption('person');
  await relationSelects.nth(1).selectOption('fragment');
  await relationSelects.nth(2).selectOption('fragment');
  await relationSelects.nth(3).selectOption('followup');

  const policyCard = page.locator('[data-interaction-id="kpi-change-policy"]');
  const scenarios = policyCard.locator('.book-interactive-scenario');
  await scenarios.nth(0).locator('button').nth(1).click();
  await scenarios.nth(1).locator('button').nth(1).click();
  await scenarios.nth(2).locator('button').nth(1).click();

  const firstScreen = page.locator('[data-interaction-id="first-screen-decision"]');
  const decisionCards = firstScreen.locator('.book-interactive-decision-card');
  await decisionCards.nth(0).locator('button').nth(0).click();
  await decisionCards.nth(2).locator('button').nth(1).click();
  await decisionCards.nth(4).locator('button').nth(1).click();

  const capture = page.locator('[data-interaction-id="one-line-capture"]');
  await capture.locator('textarea').nth(0).fill('김 상담사가 결합할인 문의에서 설명이 길어 고객이 다시 물었고, 두 번째에는 순서를 잡아 이해시켰다. 내일 오전 다시 모니터링.');
  await capture.locator('textarea').nth(1).fill('결합할인 설명 순서 개선, 내일 재모니터링');

  const postSave = page.locator('[data-interaction-id="post-save-flow"]');
  await postSave.locator('.book-interactive-flow-option').nth(0).click();
  await postSave.locator('.book-interactive-flow-option').nth(1).click();

  const density = page.locator('[data-interaction-id="information-density"]');
  await density.locator('.book-interactive-density-options button[data-value="5"]').click();
  await density.locator('textarea').fill('현장에서는 최근 흐름만 빠르게 확인하면 되므로 5건이면 충분하다.');

  await page.waitForTimeout(350);
  await page.locator('#series02-open-records').click();
  await page.waitForTimeout(100);

  const metrics = await page.evaluate(() => {
    const score = document.querySelector('[data-interaction-id="externalize-memory"] .book-interactive-score strong')?.textContent?.trim();
    const band = document.querySelector('[data-interaction-id="externalize-memory"] .book-interactive-score em')?.textContent?.trim();
    const debtStatus = document.querySelector('[data-interaction-id="memory-debt"] .book-interactive-status')?.textContent?.trim();
    const personaStatus = document.querySelector('[data-interaction-id="persona0-moment"] .book-interactive-status')?.textContent?.trim();
    const sourceStatus = document.querySelector('[data-interaction-id="stt-source-summary"] .book-interactive-status')?.textContent?.trim();
    const fragmentStatus = document.querySelector('[data-interaction-id="memory-fragment-builder"] .book-interactive-status')?.textContent?.trim();
    const contractStatus = document.querySelector('[data-interaction-id="mini-data-contract"] .book-interactive-status')?.textContent?.trim();
    const policyStatus = document.querySelector('[data-interaction-id="kpi-change-policy"] .book-interactive-status')?.textContent?.trim();
    const firstScreenStatus = document.querySelector('[data-interaction-id="first-screen-decision"] .book-interactive-status')?.textContent?.trim();
    const oneLineStatus = document.querySelector('[data-interaction-id="one-line-capture"] .book-interactive-status')?.textContent?.trim();
    const postSaveStatus = document.querySelector('[data-interaction-id="post-save-flow"] .book-interactive-status')?.textContent?.trim();
    const densityStatus = document.querySelector('[data-interaction-id="information-density"] .book-interactive-status')?.textContent?.trim();
    const oneLineCounter = document.querySelector('[data-interaction-id="one-line-capture"] .book-interactive-char-counter')?.textContent?.trim();
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
      sourceStatus,
      fragmentStatus,
      contractStatus,
      policyStatus,
      firstScreenStatus,
      oneLineStatus,
      postSaveStatus,
      densityStatus,
      oneLineCounter,
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
    sourceSummaryComplete: metrics.sourceStatus?.includes('Source / Summary Pair 완료') === true,
    fragmentComplete: metrics.fragmentStatus?.includes('Canvas 완료') === true,
    contractComplete: metrics.contractStatus?.includes('Mini Data Contract 완료') === true,
    policyComplete: metrics.policyStatus?.includes('KPI 변경 규칙 완료') === true,
    sourceSaved: metrics.formsKeys.some((key) => key.endsWith(':stt-source-summary')),
    fragmentSaved: metrics.formsKeys.some((key) => key.endsWith(':memory-fragment-builder')),
    contractSaved: metrics.formsKeys.some((key) => key.endsWith(':mini-data-contract')),
    policySaved: metrics.formsKeys.some((key) => key.endsWith(':kpi-change-policy')),
    firstScreenComplete: metrics.firstScreenStatus?.includes('First Screen 결정 완료') === true,
    oneLineComplete: metrics.oneLineStatus?.includes('One-line Capture 완료') === true,
    oneLineWithinLimit: Number(metrics.oneLineCounter?.split('/')[0]?.trim()) <= 40,
    postSaveComplete: metrics.postSaveStatus?.includes('다음 행동 2개 확정') === true,
    densityComplete: metrics.densityStatus?.includes('Information Density 결정 완료') === true,
    firstScreenSaved: metrics.formsKeys.some((key) => key.endsWith(':first-screen-decision')),
    oneLineSaved: metrics.formsKeys.some((key) => key.endsWith(':one-line-capture')),
    postSaveSaved: metrics.formsKeys.some((key) => key.endsWith(':post-save-flow')),
    densitySaved: metrics.formsKeys.some((key) => key.endsWith(':information-density')),
    recordsPanelOpen: metrics.panelOpen === true,
    savedResultsVisible: metrics.hasSavedResultsHeading === true,
    elevenArtifacts: Number(metrics.artifactCount) >= 11
  };

  const screenshot = path.join(outputDir, `series02-ch01-11-${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

  const passed = Object.values(checks).every(Boolean);
  report.push({ viewport, status, metrics, pageErrors, checks, passed, screenshot });
  if (!passed) failures.push(viewport.name);

  console.log(`${passed ? 'PASS' : 'FAIL'} Interactive Book V1 Ch01-11 ${viewport.name} score=${metrics.score} band=${metrics.band} artifacts=${metrics.artifactCount}`);
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

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import contract from '../config/monetization-layout-contract-v2.json' with { type: 'json' };

const baseURL = process.env.QA_BASE_URL || 'https://aijoylab.kr';
const outDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/monetization-layout-production-v2';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const viewportByName = new Map(contract.viewports.map((viewport) => [viewport.name, viewport]));
const reports = [];

async function measureState(target, viewport, state) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });

  await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());
  await page.addInitScript(({ state, height }) => {
    const apply = () => {
      document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
        el.dataset.adStatus = state;
        if (state === 'filled') {
          el.style.height = `${height}px`;
          el.style.minHeight = `${height}px`;
        } else {
          el.style.height = '0px';
          el.style.minHeight = '0px';
        }
      });
    };
    new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }, { state, height: contract.states.filled.syntheticHeightPx });

  const response = await page.goto(baseURL + target.path, { waitUntil: 'networkidle' });
  if (!response || response.status() >= 400) {
    throw new Error(`${target.name}/${viewport.name}/${state}: production page failed`);
  }
  await page.waitForTimeout(300);

  const measurement = await page.evaluate(({ selectors, state }) => {
    const before = document.querySelector(selectors.before);
    const ad = document.querySelector(selectors.ad);
    const after = document.querySelector(selectors.after);
    if (!before || !ad || !after) {
      return { missing: true, found: { before: !!before, ad: !!ad, after: !!after } };
    }

    const br = before.getBoundingClientRect();
    const ar = ad.getBoundingClientRect();
    const xr = after.getBoundingClientRect();
    const style = getComputedStyle(ad);

    return {
      missing: false,
      state,
      pageHeightPx: document.documentElement.scrollHeight,
      beforeToAdPx: ar.top - br.bottom,
      adToAfterPx: xr.top - ar.bottom,
      adMarginTopPx: Number.parseFloat(style.marginTop) || 0,
      adMarginBottomPx: Number.parseFloat(style.marginBottom) || 0,
      adWidthPx: ar.width,
      adHeightPx: ar.height,
      adDisplay: style.display,
      pageOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  }, { selectors: target.selectors, state });

  if (measurement.missing) {
    throw new Error(`${target.name}/${viewport.name}/${state}: selector missing ${JSON.stringify(measurement.found)}`);
  }

  if (state === 'filled') {
    if (measurement.adDisplay === 'none' || measurement.adHeightPx <= 0) {
      throw new Error(`${target.name}/${viewport.name}: filled ad is not visible`);
    }
    if (measurement.adMarginTopPx < contract.states.filled.minOuterSpacingPx ||
        measurement.adMarginTopPx > contract.states.filled.maxOuterSpacingPx) {
      throw new Error(`${target.name}/${viewport.name}: top spacing ${measurement.adMarginTopPx}px outside contract`);
    }
    if (measurement.adMarginBottomPx < contract.states.filled.minOuterSpacingPx ||
        measurement.adMarginBottomPx > contract.states.filled.maxOuterSpacingPx) {
      throw new Error(`${target.name}/${viewport.name}: bottom spacing ${measurement.adMarginBottomPx}px outside contract`);
    }
    if (measurement.adWidthPx > contract.limits.slotMaxWidthPx + 0.75) {
      throw new Error(`${target.name}/${viewport.name}: ad width ${measurement.adWidthPx}px exceeds contract`);
    }
  } else if (measurement.adHeightPx + measurement.adMarginTopPx + measurement.adMarginBottomPx >
             contract.states.unfilled.maxReservedOuterHeightPx + 0.75) {
    throw new Error(`${target.name}/${viewport.name}: unfilled reserved height exceeds contract`);
  }

  if (measurement.pageOverflowPx > contract.limits.horizontalOverflowPx + 0.75) {
    throw new Error(`${target.name}/${viewport.name}/${state}: horizontal overflow ${measurement.pageOverflowPx}px`);
  }

  if (state === 'filled') {
    await page.screenshot({
      path: path.join(outDir, `${target.surface}-${viewport.name}-filled.png`),
      fullPage: true
    });
  }

  await page.close();
  return measurement;
}

try {
  for (const target of contract.productionTargets) {
    for (const viewportName of target.viewportNames) {
      const viewport = viewportByName.get(viewportName);
      if (!viewport) throw new Error(`${target.name}: unknown viewport ${viewportName}`);

      const unfilled = await measureState(target, viewport, 'unfilled');
      const filled = await measureState(target, viewport, 'filled');

      const pageHeightDeltaPx = filled.pageHeightPx - unfilled.pageHeightPx;
      const pageHeightDeltaPct = unfilled.pageHeightPx > 0
        ? Number(((pageHeightDeltaPx / unfilled.pageHeightPx) * 100).toFixed(3))
        : 0;

      const distanceFields = target.distanceFields || {
        beforeToAd: 'beforeToAdPx',
        adToAfter: 'adToAfterPx'
      };

      const row = {
        surface: target.surface,
        target: target.name,
        path: target.path,
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        pageHeightUnfilledPx: unfilled.pageHeightPx,
        pageHeightFilledPx: filled.pageHeightPx,
        pageHeightDeltaPx,
        pageHeightDeltaPct,
        [distanceFields.beforeToAd]: filled.beforeToAdPx,
        [distanceFields.adToAfter]: filled.adToAfterPx,
        adMarginTopPx: filled.adMarginTopPx,
        adMarginBottomPx: filled.adMarginBottomPx,
        adWidthPx: filled.adWidthPx,
        adHeightPx: filled.adHeightPx,
        pageOverflowPx: filled.pageOverflowPx
      };

      reports.push(row);
      console.log('PRODUCTION PASS', JSON.stringify(row));
    }
  }
} finally {
  await browser.close();
}

const report = {
  schemaVersion: 2,
  name: 'JoyLab Monetization Layout Production Smoke V2',
  baseURL,
  measuredAt: new Date().toISOString(),
  contract: {
    spacingPx: [contract.states.filled.minOuterSpacingPx, contract.states.filled.maxOuterSpacingPx],
    slotMaxWidthPx: contract.limits.slotMaxWidthPx,
    horizontalOverflowPx: contract.limits.horizontalOverflowPx,
    verticalDensityKpi: contract.verticalDensityKpi
  },
  measurements: reports
};

await fs.writeFile(path.join(outDir, 'measurements.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Monetization Layout Production Smoke V2 PASS · book + guide + Vertical Density KPI written');

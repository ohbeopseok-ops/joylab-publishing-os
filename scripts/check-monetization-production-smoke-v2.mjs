import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import contract from '../config/monetization-layout-contract-v2.json' with { type: 'json' };

const baseURL = process.env.QA_BASE_URL || 'https://aijoylab.kr';
const outDir = process.env.QA_OUTPUT_DIR || 'qa-artifacts/monetization-layout-production-v2';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const rows = [];

try {
  for (const viewport of contract.viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });

    await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());
    await page.addInitScript(({ height }) => {
      const fill = () => {
        document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
          el.dataset.adStatus = 'filled';
          el.style.height = `${height}px`;
          el.style.minHeight = `${height}px`;
        });
      };
      new MutationObserver(fill).observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener('DOMContentLoaded', fill, { once: true });
    }, { height: contract.states.filled.syntheticHeightPx });

    const response = await page.goto(baseURL + contract.productionRegression.path, { waitUntil: 'networkidle' });
    if (!response || response.status() >= 400) throw new Error(`${viewport.name}: production page failed`);
    await page.waitForTimeout(300);

    const measurement = await page.evaluate((selectors) => {
      const author = document.querySelector(selectors.author);
      const ad = document.querySelector(selectors.ad);
      const graph = document.querySelector(selectors.graph);
      if (!author || !ad || !graph) {
        return {
          missing: true,
          found: { author: !!author, ad: !!ad, graph: !!graph }
        };
      }

      const ar = author.getBoundingClientRect();
      const dr = ad.getBoundingClientRect();
      const gr = graph.getBoundingClientRect();
      const style = getComputedStyle(ad);

      return {
        missing: false,
        authorToAdPx: dr.top - ar.bottom,
        adToGraphPx: gr.top - dr.bottom,
        adMarginTopPx: Number.parseFloat(style.marginTop) || 0,
        adMarginBottomPx: Number.parseFloat(style.marginBottom) || 0,
        adWidthPx: dr.width,
        adHeightPx: dr.height,
        pageOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      };
    }, contract.productionRegression.selectors);

    if (measurement.missing) throw new Error(`${viewport.name}: production regression selector missing ${JSON.stringify(measurement.found)}`);
    if (measurement.adMarginTopPx < contract.states.filled.minOuterSpacingPx || measurement.adMarginTopPx > contract.states.filled.maxOuterSpacingPx) {
      throw new Error(`${viewport.name}: ad top spacing ${measurement.adMarginTopPx}px outside contract`);
    }
    if (measurement.adMarginBottomPx < contract.states.filled.minOuterSpacingPx || measurement.adMarginBottomPx > contract.states.filled.maxOuterSpacingPx) {
      throw new Error(`${viewport.name}: ad bottom spacing ${measurement.adMarginBottomPx}px outside contract`);
    }
    if (measurement.adWidthPx > contract.limits.slotMaxWidthPx + 0.75) throw new Error(`${viewport.name}: ad width overflow ${measurement.adWidthPx}px`);
    if (measurement.pageOverflowPx > contract.limits.horizontalOverflowPx + 0.75) throw new Error(`${viewport.name}: page horizontal overflow ${measurement.pageOverflowPx}px`);

    const row = {
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      ...measurement
    };
    rows.push(row);

    await page.screenshot({
      path: path.join(outDir, `${viewport.name}-ax-customer-center.png`),
      fullPage: true
    });

    console.log('PRODUCTION PASS', JSON.stringify(row));
    await page.close();
  }
} finally {
  await browser.close();
}

const report = {
  schemaVersion: 2,
  name: 'JoyLab Monetization Layout Production Smoke V2',
  baseURL,
  path: contract.productionRegression.path,
  measuredAt: new Date().toISOString(),
  contract: {
    spacingPx: [contract.states.filled.minOuterSpacingPx, contract.states.filled.maxOuterSpacingPx],
    slotMaxWidthPx: contract.limits.slotMaxWidthPx,
    horizontalOverflowPx: contract.limits.horizontalOverflowPx
  },
  measurements: rows
};

await fs.writeFile(path.join(outDir, 'measurements.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Monetization Layout Production Smoke V2 PASS · measurements.json written');

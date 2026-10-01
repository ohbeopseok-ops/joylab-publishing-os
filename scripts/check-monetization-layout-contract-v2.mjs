import { chromium } from 'playwright';
import contract from '../config/monetization-layout-contract-v2.json' with { type: 'json' };

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const epsilon = 0.75;

try {
  for (const target of contract.targets.filter((item) => item.active)) {
    for (const viewport of contract.viewports) {
      for (const state of ['filled', 'unfilled']) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height }
        });

        await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());
        await page.addInitScript(() => {
          window.__joylabCls = 0;
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) window.__joylabCls += entry.value;
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch {}
        });

        const response = await page.goto(baseURL + target.path, { waitUntil: 'networkidle' });
        if (!response || response.status() >= 400) {
          throw new Error(`${target.name}/${viewport.name}/${state}: page failed to load`);
        }

        await page.evaluate(({ state, filledHeight }) => {
          document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
            el.dataset.adStatus = state;
            el.style.height = state === 'filled' ? `${filledHeight}px` : '0px';
            el.style.minHeight = state === 'filled' ? `${filledHeight}px` : '0px';
          });
        }, { state, filledHeight: contract.states.filled.syntheticHeightPx });
        await page.waitForTimeout(50);

        const result = await page.evaluate(({ placement }) => {
          const slot = document.querySelector(`[data-ad-placement="${placement}"]`);
          if (!slot) return { missing: true };

          const rect = slot.getBoundingClientRect();
          const parentRect = slot.parentElement?.getBoundingClientRect() ?? rect;
          const style = getComputedStyle(slot);
          const marginTop = Number.parseFloat(style.marginTop) || 0;
          const marginBottom = Number.parseFloat(style.marginBottom) || 0;
          const outerHeight = rect.height + marginTop + marginBottom;
          const viewportWidth = document.documentElement.clientWidth;
          const horizontalOverflow = Math.max(
            0,
            document.documentElement.scrollWidth - viewportWidth
          );
          const widthOverrun = Math.max(
            0,
            rect.width - parentRect.width,
            -rect.left,
            rect.right - viewportWidth
          );

          return {
            missing: false,
            display: style.display,
            width: rect.width,
            height: rect.height,
            outerHeight,
            marginTop,
            marginBottom,
            parentWidth: parentRect.width,
            horizontalOverflow,
            widthOverrun,
            cls: Number(window.__joylabCls || 0)
          };
        }, { placement: target.placement });

        if (result.missing) {
          throw new Error(`${target.name}/${viewport.name}/${state}: ad slot missing`);
        }

        if (result.horizontalOverflow > contract.limits.horizontalOverflowPx + epsilon) {
          throw new Error(`${target.name}/${viewport.name}/${state}: horizontal overflow ${result.horizontalOverflow}px`);
        }

        if (result.widthOverrun > contract.limits.maxWidthOverrunPx + epsilon) {
          throw new Error(`${target.name}/${viewport.name}/${state}: max-width overrun ${result.widthOverrun}px`);
        }

        if (state === 'filled') {
          if (result.display === 'none' || result.height <= 0) {
            throw new Error(`${target.name}/${viewport.name}/filled: slot is not visible`);
          }
          if (result.width > contract.limits.slotMaxWidthPx + epsilon) {
            throw new Error(`${target.name}/${viewport.name}/filled: slot width ${result.width}px exceeds ${contract.limits.slotMaxWidthPx}px`);
          }
          for (const [edge, value] of [['top', result.marginTop], ['bottom', result.marginBottom]]) {
            if (value < contract.states.filled.minOuterSpacingPx - epsilon || value > contract.states.filled.maxOuterSpacingPx + epsilon) {
              throw new Error(`${target.name}/${viewport.name}/filled: ${edge} spacing ${value}px outside ${contract.states.filled.minOuterSpacingPx}-${contract.states.filled.maxOuterSpacingPx}px`);
            }
          }
        } else {
          if (result.outerHeight > contract.states.unfilled.maxReservedOuterHeightPx + epsilon) {
            throw new Error(`${target.name}/${viewport.name}/unfilled: reserved outer height ${result.outerHeight}px exceeds ${contract.states.unfilled.maxReservedOuterHeightPx}px`);
          }
        }

        if (result.cls > contract.limits.clsMax + 0.001) {
          throw new Error(`${target.name}/${viewport.name}/${state}: CLS ${result.cls.toFixed(4)} exceeds ${contract.limits.clsMax}`);
        }

        console.log('PASS', target.surface, target.name, viewport.name, state, JSON.stringify(result));
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

console.log('Monetization Layout Contract V2 PASS · Article/Guide/Books · 390/1280/1440 · filled/unfilled');

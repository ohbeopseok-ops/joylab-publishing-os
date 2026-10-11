// Read-only mobile layout audit. Run against a local preview; no production writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const output = path.join(process.cwd(), 'qa-artifacts', 'mobile-viewport-audit');
const widths = [360, 390, 430];
const routes = ['/', '/articles', '/books', '/about', '/contact', '/guides/investing'];
const issues = [];
const results = [];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const route of routes) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
      const label = (route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')) + '-' + width;
      try {
        const response = await page.goto(new URL(route, baseURL).href, { waitUntil: 'networkidle', timeout: 30000 });
        if (!response?.ok()) throw new Error('HTTP ' + (response?.status() ?? 'no-response'));
        await page.evaluate(() => document.fonts.ready);
        const measurement = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const scrollOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
          const offenders = [...document.querySelectorAll('body *')].filter(el => {
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') return false;
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.height > 0 && (box.right > vw + 2 || box.left < -2);
          }).slice(0, 12).map(el => ({
            tag: el.tagName.toLowerCase(),
            className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
            right: Math.round(el.getBoundingClientRect().right),
            left: Math.round(el.getBoundingClientRect().left)
          }));
          return { scrollOverflow, offenders };
        });
        await page.screenshot({ path: path.join(output, label + '.png'), fullPage: true });
        const result = { route, width, status: 'ok', ...measurement };
        results.push(result);
        if (measurement.scrollOverflow > 2 || measurement.offenders.length) {
          issues.push({ route, width, ...measurement });
        }
      } catch (error) {
        issues.push({ route, width, error: String(error.message || error) });
        results.push({ route, width, status: 'error', error: String(error.message || error) });
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), results, issues }, null, 2));
console.log(JSON.stringify({ tested: results.length, failures: issues.length, report: path.join(output, 'report.json'), issues }, null, 2));
if (issues.length) process.exitCode = 1;

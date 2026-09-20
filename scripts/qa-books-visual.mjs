import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const slug = '완벽하지-않아서-스며들-수-있었다';
const out = path.join(process.cwd(), 'qa-artifacts', 'books');
fs.mkdirSync(out, { recursive: true });

const cases = [
  { name: 'landing-desktop', url: `/books/${slug}`, width: 1440, height: 1100 },
  { name: 'landing-mobile', url: `/books/${slug}`, width: 390, height: 844 },
  { name: 'reader-desktop', url: `/books/${slug}/read`, width: 1440, height: 1100 },
  { name: 'reader-mobile', url: `/books/${slug}/read`, width: 390, height: 844 }
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const c of cases) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
  const response = await page.goto(base + c.url, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error(`${c.name}: HTTP ${response?.status()}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(`${c.name}: horizontal overflow ${overflow}px`);

  if (c.name.startsWith('landing')) {
    await page.locator('h1').waitFor();
    if (!(await page.getByText('완벽하지 않아서 스며들 수 있었다', { exact: false }).count())) {
      throw new Error(`${c.name}: book title missing`);
    }
    if (!(await page.getByText('작가의 말과 1장 읽기', { exact: false }).count())) {
      throw new Error(`${c.name}: reader CTA missing`);
    }
  } else {
    if (!(await page.getByText('PREVIEW END', { exact: true }).count())) {
      throw new Error(`${c.name}: preview end missing`);
    }
    if (await page.getByText('소나무 장작이 타들어 가는 냄새는', { exact: false }).count()) {
      throw new Error(`${c.name}: locked chapter body leaked`);
    }
  }

  await page.screenshot({ path: path.join(out, `${c.name}.png`), fullPage: true });
  results.push({ ...c, overflow });
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));

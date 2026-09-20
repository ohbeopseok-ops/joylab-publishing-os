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

    const cover = page.locator('img[src="/books/imperfect/cover.webp"]').first();
    if (!(await cover.count())) throw new Error(`${c.name}: cover image element missing`);
    await cover.waitFor({ state: 'visible' });
    const coverState = await cover.evaluate((img) => ({
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
    if (!coverState.complete || coverState.naturalWidth <= 0 || coverState.naturalHeight <= 0) {
      throw new Error(`${c.name}: cover image failed to decode ${JSON.stringify(coverState)}`);
    }
    const title = page.getByText('완벽하지 않아서 스며들 수 있었다', { exact: false }).first();
    if (!(await title.isVisible())) throw new Error(`${c.name}: book title not visible`);

    const previewCta = page.getByText('작가의 말과 1장 읽기', { exact: false }).first();
    if (!(await previewCta.isVisible())) throw new Error(`${c.name}: reader CTA not visible`);
  } else {
    const previewEnd = page.getByText('PREVIEW END', { exact: true }).first();
    if (!(await previewEnd.isVisible())) throw new Error(`${c.name}: preview end not visible`);
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

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const sourcePath = path.join(root, 'src/data/studio/series-02-epub-source.json');
const defaultOut = path.join(root, 'dist/studio/exports/series-02-memory-debt-print.pdf');
const selfTestOut = path.join(root, 'qa-artifacts/studio-print-v1/series-02-memory-debt-print.pdf');

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function renderHtml(book) {
  const toc = book.chapters.map((chapter, i) =>
    `<li><span>${String(i + 1).padStart(2,'0')}</span><b>${esc(chapter.title)}</b></li>`
  ).join('');

  const chapters = book.chapters.map((chapter, i) => {
    const body = chapter.body.map((p) => `<p>${esc(p)}</p>`).join('');
    return `
      <section class="chapter">
        <p class="kicker">CHAPTER ${String(i + 1).padStart(2,'0')}</p>
        <h1>${esc(chapter.title)}</h1>
        <div class="prose">${body}</div>
        <aside class="practice">
          <strong>실행 질문</strong>
          <p>${esc(chapter.practice)}</p>
        </aside>
      </section>`;
  }).join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${esc(book.title)}</title>
<style>
  @page { size: A5; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Noto Sans CJK KR", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
    color: #17171a;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover {
    min-height: 170mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    break-after: page;
  }
  .brand { color: #b98527; font-size: 9pt; font-weight: 800; letter-spacing: .14em; }
  .cover h1 { font-size: 28pt; line-height: 1.18; letter-spacing: -.04em; margin: 18mm 0 6mm; word-break: keep-all; }
  .cover h2 { font-size: 12pt; line-height: 1.6; color: #716a62; font-weight: 500; margin: 0; }
  .cover .meta { border-top: .5pt solid #d8d0c2; padding-top: 7mm; font-size: 9.5pt; color: #6f6962; }
  .toc { break-after: page; }
  .toc h1 { font-size: 21pt; margin: 0 0 10mm; }
  .toc ol { list-style: none; margin: 0; padding: 0; }
  .toc li { display: grid; grid-template-columns: 13mm 1fr; gap: 4mm; padding: 4mm 0; border-bottom: .4pt solid #e9e3da; }
  .toc li span { color: #b98527; font-size: 9pt; font-weight: 800; }
  .toc li b { font-size: 11pt; }
  .chapter { break-before: page; }
  .chapter:first-of-type { break-before: auto; }
  .kicker { color: #b98527; font-size: 8.5pt; font-weight: 800; letter-spacing: .12em; margin: 0 0 5mm; }
  .chapter h1 { font-size: 21pt; line-height: 1.25; letter-spacing: -.035em; margin: 0 0 9mm; word-break: keep-all; }
  .prose p { font-size: 10.8pt; line-height: 1.95; margin: 0 0 5.2mm; word-break: keep-all; orphans: 3; widows: 3; }
  .practice { margin-top: 9mm; padding: 6mm; border-left: 2.5mm solid #c99737; background: #f7efe1; break-inside: avoid; }
  .practice strong { display: block; font-size: 9pt; color: #7f5b1d; margin-bottom: 3mm; }
  .practice p { font-size: 10pt; line-height: 1.7; margin: 0; word-break: keep-all; }
  .footer-note { margin-top: 12mm; padding-top: 4mm; border-top: .4pt solid #e9e3da; font-size: 8pt; color: #8b847c; }
</style>
</head>
<body>
  <section class="cover">
    <div>
      <div class="brand">JOYLAB · SERIES 02</div>
      <h1>${esc(book.title)}</h1>
      <h2>${esc(book.description)}</h2>
    </div>
    <div class="meta">
      <div>${esc(book.creator)} · ${esc(book.publisher)}</div>
      <div>Print PDF Generator V1 · A5</div>
    </div>
  </section>

  <section class="toc">
    <div class="brand">TABLE OF CONTENTS</div>
    <h1>목차</h1>
    <ol>${toc}</ol>
    <p class="footer-note">이 PDF는 JoyLab Studio의 Source Manuscript에서 생성된 인쇄용 V1 출력물입니다.</p>
  </section>

  ${chapters}
</body>
</html>`;
}

function validatePdf(buffer) {
  if (buffer.length < 5000) throw new Error('Print PDF too small');
  if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('Print PDF magic missing');
  if (!buffer.includes(Buffer.from('%%EOF'))) throw new Error('Print PDF EOF missing');
}

const book = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const html = renderHtml(book);
const outArg = process.argv.find((x) => x.startsWith('--out='));
const selfTest = process.argv.includes('--self-test');
const out = outArg ? path.resolve(root, outArg.slice(6)) : (selfTest ? selfTestOut : defaultOut);

fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  const buffer = await page.pdf({
    format: 'A5',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  validatePdf(buffer);
  fs.writeFileSync(out, buffer);
  console.log(`Studio Print PDF Generator V1: ${path.relative(root, out)} · ${buffer.length} bytes · ${book.chapters.length} chapters`);
  if (selfTest) console.log('Studio Print PDF Generator V1 self-test PASS');
} finally {
  await browser.close();
}

const base = process.env.QA_BASE_URL || 'https://aijoylab.kr';
const deploySha = process.env.GITHUB_SHA || Date.now().toString();
const fresh = (path) => path + (path.includes('?') ? '&' : '?') + 'deploy=' + encodeURIComponent(deploySha);

const routes = [
  { path: '/studio/', markers: ['INTERACTIVE PUBLISHING STUDIO','전자책·종이책·인터랙티브 북'] },
  { path: '/studio/projects/series-02/', markers: ['Series 02','OUTPUT STATUS','15 READY'] },
  { path: '/studio/projects/series-02/manuscript/', markers: ['MANUSCRIPT EDITOR','Series 02'] },
  { path: '/studio/projects/series-02/interactive/', markers: ['INTERACTIVE','Series 02','chapter-15','Same Data, Different UI'] },
  { path: '/studio/projects/series-02/validation/', markers: ['VALIDATION','Studio Gate 결과'] },
  { path: '/studio/projects/series-02/preview/', markers: ['MULTI OUTPUT PREVIEW','Mobile','EPUB','Print'] },
  { path: '/studio/projects/series-02/export/', markers: ['EXPORT','EPUB','Print PDF','REAL'] },
  { path: '/studio/releases/series-02/v1.0.0/', markers: ['PUBLISHED RELEASE','15 / 15','RELEASE GATE','GOLD','series-02-v1.0.0'] }
];

async function fetchText(path) {
  const res = await fetch(base + fresh(path), { redirect: 'follow', cache: 'no-store' });
  if (res.status !== 200) throw new Error(path + ' expected 200, got ' + res.status);
  const text = await res.text();
  if (!text.trim()) throw new Error(path + ' returned empty body');
  return { res, text };
}

for (const route of routes) {
  const { text } = await fetchText(route.path);
  if (!text.includes('name="robots" content="noindex,follow"')) {
    throw new Error(route.path + ' must remain noindex,follow');
  }
  for (const marker of route.markers) {
    if (!text.includes(marker)) throw new Error(route.path + ' marker missing: ' + marker);
  }
  console.log('PASS', route.path);
}

const epubPath = '/studio/exports/series-02-memory-debt.epub';
const pdfPath = '/studio/exports/series-02-memory-debt-print.pdf';
const manifestPath = '/studio/exports/export-provenance-v1.json';
const crypto = await import('node:crypto');
const digest = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let verified = false;
let lastError = null;

for (let attempt = 1; attempt <= 8 && !verified; attempt++) {
  try {
    const nonce = '&verify=' + attempt + '-' + Date.now();
    const epub = await fetch(base + fresh(epubPath) + nonce, { redirect: 'follow', cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
    if (epub.status !== 200) throw new Error(epubPath + ' expected 200, got ' + epub.status);
    const bytes = Buffer.from(await epub.arrayBuffer());
    if (bytes.length < 1000) throw new Error('EPUB binary too small');
    if (bytes.readUInt32LE(0) !== 0x04034b50) throw new Error('EPUB is not a ZIP container');
    if (bytes.indexOf(Buffer.from('mimetypeapplication/epub+zip')) < 0) throw new Error('EPUB mimetype missing');
    for (const marker of ['META-INF/container.xml','OEBPS/content.opf','OEBPS/nav.xhtml','OEBPS/chapter-1.xhtml']) {
      if (bytes.indexOf(Buffer.from(marker)) < 0) throw new Error('EPUB binary marker missing: ' + marker);
    }

    const pdf = await fetch(base + fresh(pdfPath) + nonce, { redirect: 'follow', cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
    if (pdf.status !== 200) throw new Error(pdfPath + ' expected 200, got ' + pdf.status);
    const pdfBytes = Buffer.from(await pdf.arrayBuffer());
    if (pdfBytes.length < 5000) throw new Error('Print PDF binary too small');
    if (pdfBytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('Print PDF magic missing');
    if (pdfBytes.indexOf(Buffer.from('%%EOF')) < 0) throw new Error('Print PDF EOF missing');

    const manifestRes = await fetch(base + fresh(manifestPath) + nonce, { redirect: 'follow', cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
    if (manifestRes.status !== 200) throw new Error(manifestPath + ' expected 200, got ' + manifestRes.status);
    const manifest = await manifestRes.json();
    if (manifest.contract !== 'JoyLab Export Provenance Manifest V1') throw new Error('provenance contract mismatch');
    const epubRecord = manifest.artifacts?.find((x) => x.id === 'epub');
    const pdfRecord = manifest.artifacts?.find((x) => x.id === 'printPdf');
    if (!epubRecord || !pdfRecord) throw new Error('provenance artifact records missing');
    if (epubRecord.sha256 !== digest(bytes)) throw new Error('EPUB provenance hash mismatch');
    if (pdfRecord.sha256 !== digest(pdfBytes)) throw new Error('PDF provenance hash mismatch');

    console.log('PASS', epubPath, bytes.length + ' bytes');
    console.log('PASS', pdfPath, pdfBytes.length + ' bytes');
    console.log('PASS', manifestPath, manifest.source?.sha256, 'attempt=' + attempt);
    verified = true;
  } catch (error) {
    lastError = error;
    console.warn('Studio artifact coherence pending', 'attempt=' + attempt, error.message);
    if (attempt < 8) await sleep(3000);
  }
}

if (!verified) throw lastError ?? new Error('Studio artifact coherence failed');

console.log('Studio Production Smoke V1 PASS');

const base = process.env.QA_BASE_URL || 'https://aijoylab.kr';

const routes = [
  { path: '/studio/', markers: ['INTERACTIVE PUBLISHING STUDIO','전자책·종이책·인터랙티브 북'] },
  { path: '/studio/projects/series-02/', markers: ['Series 02','OUTPUT STATUS'] },
  { path: '/studio/projects/series-02/validation/', markers: ['VALIDATION','Studio Gate 결과'] },
  { path: '/studio/projects/series-02/preview/', markers: ['MULTI OUTPUT PREVIEW','Mobile','EPUB','Print'] },
  { path: '/studio/projects/series-02/export/', markers: ['EXPORT','EPUB','REAL'] }
];

async function fetchText(path) {
  const res = await fetch(base + path, { redirect: 'follow' });
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
const epub = await fetch(base + epubPath, { redirect: 'follow' });
if (epub.status !== 200) throw new Error(epubPath + ' expected 200, got ' + epub.status);
const bytes = Buffer.from(await epub.arrayBuffer());
if (bytes.length < 1000) throw new Error('EPUB binary too small');
if (bytes.readUInt32LE(0) !== 0x04034b50) throw new Error('EPUB is not a ZIP container');
if (bytes.indexOf(Buffer.from('mimetypeapplication/epub+zip')) < 0) throw new Error('EPUB mimetype missing');
for (const marker of ['META-INF/container.xml','OEBPS/content.opf','OEBPS/nav.xhtml','OEBPS/chapter-1.xhtml']) {
  if (bytes.indexOf(Buffer.from(marker)) < 0) throw new Error('EPUB binary marker missing: ' + marker);
}
console.log('PASS', epubPath, bytes.length + ' bytes');
console.log('Studio Production Smoke V1 PASS');

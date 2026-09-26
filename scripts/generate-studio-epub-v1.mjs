import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src/data/studio/series-02-source.json');
const defaultOut = path.join(root, 'public/studio/exports/series-02-memory-debt.epub');

const xml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { time, date: dosDate };
}

function zipStore(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const stamp = dosDateTime(new Date('2026-09-26T00:00:00'));

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
}

function chapterXhtml(chapter, index) {
  const paragraphs = chapter.body.map((p) => `<p>${xml(p)}</p>`).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko" lang="ko">
<head><title>${xml(chapter.title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head>
<body>
<main>
<p class="kicker">CHAPTER ${String(index + 1).padStart(2,'0')}</p>
<h1>${xml(chapter.title)}</h1>
${paragraphs}
<section class="practice"><h2>실행 질문</h2><p>${xml(chapter.practice)}</p></section>
</main>
</body>
</html>`;
}

export function buildEpub(book) {
  const modified = '2026-09-26T00:00:00Z';
  const manifestItems = book.chapters.map((ch, i) => `<item id="ch${i+1}" href="chapter-${i+1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n');
  const spine = book.chapters.map((_, i) => `<itemref idref="ch${i+1}"/>`).join('\n');
  const navItems = book.chapters.map((ch, i) => `<li><a href="chapter-${i+1}.xhtml">${xml(ch.title)}</a></li>`).join('\n');

  const entries = [
    { name: 'mimetype', data: 'application/epub+zip' },
    { name: 'META-INF/container.xml', data: `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>` },
    { name: 'OEBPS/content.opf', data: `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:joylab:${xml(book.bookId)}</dc:identifier>
<dc:title>${xml(book.title)}</dc:title>
<dc:language>${xml(book.language)}</dc:language>
<dc:creator>${xml(book.creator)}</dc:creator>
<dc:publisher>${xml(book.publisher)}</dc:publisher>
<dc:description>${xml(book.description)}</dc:description>
<meta property="dcterms:modified">${modified}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="styles.css" media-type="text/css"/>
${manifestItems}
</manifest>
<spine>${spine}</spine>
</package>` },
    { name: 'OEBPS/nav.xhtml', data: `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ko">
<head><title>목차</title><link rel="stylesheet" type="text/css" href="styles.css"/></head>
<body><nav epub:type="toc" id="toc"><h1>목차</h1><ol>${navItems}</ol></nav></body></html>` },
    { name: 'OEBPS/styles.css', data: `body{font-family:serif;line-height:1.85;color:#17171a;margin:0;padding:5% 8%;}main{max-width:42em;margin:0 auto;}h1{font-size:1.8em;line-height:1.25;}p{margin:0 0 1.2em;}.kicker{font-family:sans-serif;font-size:.75em;letter-spacing:.12em;color:#9a742b}.practice{margin-top:2em;padding:1.2em;border-left:.28em solid #c99737;background:#f6efe2}.practice h2{font-size:1em;margin-top:0}` },
    ...book.chapters.map((chapter, i) => ({ name: `OEBPS/chapter-${i+1}.xhtml`, data: chapterXhtml(chapter, i) }))
  ];
  return zipStore(entries);
}

function validateBinary(buffer) {
  const mime = Buffer.from('mimetypeapplication/epub+zip', 'utf8');
  if (buffer.length < 1000) throw new Error('EPUB too small');
  if (buffer.indexOf(mime) < 0) throw new Error('EPUB mimetype entry missing');
  for (const marker of ['META-INF/container.xml','OEBPS/content.opf','OEBPS/nav.xhtml','OEBPS/chapter-1.xhtml']) {
    if (buffer.indexOf(Buffer.from(marker)) < 0) throw new Error('EPUB entry missing: ' + marker);
  }
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const readyIds = new Set(source.publicationProfile?.readyChapterIds || []);
const book = { ...source, chapters: source.chapters.filter((ch) => ch.manuscriptStatus === 'ready' && readyIds.has(ch.id)) };
if (!book.chapters.length) throw new Error('No release-ready chapters in canonical Series 02 source');
const buffer = buildEpub(book);
validateBinary(buffer);

if (process.argv.includes('--self-test')) {
  console.log(`Studio EPUB Generator V1 self-test PASS · ${buffer.length} bytes · ${book.chapters.length} chapters`);
  process.exit(0);
}

const outArg = process.argv.find((x) => x.startsWith('--out='));
const out = outArg ? path.resolve(root, outArg.slice(6)) : defaultOut;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buffer);
console.log(`Studio EPUB Generator V1: ${path.relative(root, out)} · ${buffer.length} bytes`);

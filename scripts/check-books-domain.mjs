import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const bookSlug = '완벽하지-않아서-스며들-수-있었다';
const bookPath = path.join(root, 'src/data/books', `${bookSlug}.md`);
const chapterDir = path.join(root, 'src/data/book-chapters/imperfect');

if (!fs.existsSync(bookPath)) throw new Error('Book metadata missing.');
if (!fs.existsSync(chapterDir)) throw new Error('Chapter directory missing.');

const book = fs.readFileSync(bookPath, 'utf8');
const previewChapterCount = Number(book.match(/^previewChapterCount:\s*(\d+)\s*$/m)?.[1]);
if (!Number.isInteger(previewChapterCount)) throw new Error('previewChapterCount missing or invalid.');
if (/979-11-987654-3-2|E-BOOK-2026-0920/.test(book)) {
  throw new Error('Placeholder bibliographic identifier detected.');
}

const files = fs.readdirSync(chapterDir).filter((name) => name.endsWith('.md')).sort();
if (files.length !== 11) throw new Error(`Expected 11 chapters, found ${files.length}.`);

const rows = files.map((name) => {
  const raw = fs.readFileSync(path.join(chapterDir, name), 'utf8');
  const order = Number(raw.match(/^order:\s*(\d+)\s*$/m)?.[1]);
  const preview = raw.match(/^preview:\s*(true|false)\s*$/m)?.[1] === 'true';
  const slug = raw.match(/^bookSlug:\s*(.+)\s*$/m)?.[1]?.trim();
  if (slug !== bookSlug) throw new Error(`${name}: bookSlug mismatch.`);
  if (!Number.isInteger(order)) throw new Error(`${name}: invalid order.`);
  return { name, order, preview };
}).sort((a,b) => a.order - b.order);

for (let i=0;i<rows.length;i++) {
  if (rows[i].order !== i) throw new Error(`Chapter order gap at ${rows[i].name}: expected ${i}, got ${rows[i].order}.`);
}

const previewOrders = rows.filter((row) => row.preview).map((row) => row.order);
if (JSON.stringify(previewOrders) !== JSON.stringify([0,1])) {
  throw new Error(`Preview contract mismatch: ${previewOrders.join(',')}`);
}
const numberedPreviewCount = rows.filter((row) => row.order >= 1 && row.preview).length;
if (numberedPreviewCount !== previewChapterCount) {
  throw new Error(`previewChapterCount mismatch: metadata=${previewChapterCount}, actual=${numberedPreviewCount}`);
}

for (const required of [
  'src/pages/books/index.astro',
  'src/pages/books/[slug]/index.astro',
  'src/styles/books.css'
]) {
  if (!fs.existsSync(path.join(root, required))) throw new Error(`Missing required file: ${required}`);
}

console.log('Books Domain Core self-test passed.');
console.table(rows);

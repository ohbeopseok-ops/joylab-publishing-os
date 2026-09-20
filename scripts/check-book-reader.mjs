import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const slug = '완벽하지-않아서-스며들-수-있었다';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

const files = walk(dist);
const reader = files.find((file) => file.endsWith(path.join('books', slug, 'read', 'index.html')));
if (!reader) throw new Error('Built reader page not found.');

const html = fs.readFileSync(reader, 'utf8');

for (const required of [
  'name="robots" content="noindex,follow"',
  '찻잔에 손끝을 얹으며',
  '다도 테이블 위의 실핏줄',
  'PREVIEW END',
  'book-reader-toc',
  'book-reading-progress-bar',
  'book-font-family',
  'aria-hidden="true" inert'
]) {
  if (!html.includes(required)) throw new Error(`Missing reader contract marker: ${required}`);
}

if (html.includes('소나무 장작이 타들어 가는 냄새는')) {
  throw new Error('Locked Chapter 2 body leaked into preview HTML.');
}

if (!/rel="canonical" href="https:\/\/aijoylab\.kr\/books\//.test(html)) {
  throw new Error('Reader canonical does not point to book landing.');
}

const landing = files.find((file) => file.endsWith(path.join('books', slug, 'index.html')));
if (!landing) throw new Error('Book landing build output not found.');

const landingSource = fs.readFileSync(
  path.join(root, 'src/pages/books/[slug]/index.astro'),
  'utf8'
);
if (!landingSource.includes('/read')) {
  throw new Error('Book landing source does not link to reader.');
}

console.log('Book Web Reader V1 build contract passed.');
console.log(reader);

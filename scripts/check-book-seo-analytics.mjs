import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const slug = '완벽하지-않아서-스며들-수-있었다';
const landingPath = path.join(root, 'dist', 'books', slug, 'index.html');
const readerPath = path.join(root, 'dist', 'books', slug, 'read', 'index.html');

if (!fs.existsSync(landingPath)) throw new Error('Book landing build output missing.');
if (!fs.existsSync(readerPath)) throw new Error('Book reader build output missing.');

const landing = fs.readFileSync(landingPath, 'utf8');
const reader = fs.readFileSync(readerPath, 'utf8');

const expectedCanonical = new URL(`/books/${slug}`, 'https://aijoylab.kr').toString();

if (!landing.includes('name="robots" content="index,follow"')) {
  throw new Error('Book landing must be index,follow.');
}
if (!landing.includes(`rel="canonical" href="${expectedCanonical}"`)) {
  throw new Error('Book landing canonical mismatch.');
}
if (!reader.includes('name="robots" content="noindex,follow"')) {
  throw new Error('Book reader must be noindex,follow.');
}
if (!reader.includes(`rel="canonical" href="${expectedCanonical}"`)) {
  throw new Error('Book reader canonical must point to landing.');
}

const schemaMatch = landing.match(/<script id="joylab-book-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!schemaMatch) throw new Error('Book JSON-LD missing from landing.');

let schema;
try {
  schema = JSON.parse(schemaMatch[1]);
} catch (error) {
  throw new Error(`Book JSON-LD is invalid JSON: ${error.message}`);
}

if (schema['@context'] !== 'https://schema.org') throw new Error('Book schema context mismatch.');
if (!Array.isArray(schema['@graph'])) throw new Error('Book schema graph missing.');

const book = schema['@graph'].find((node) => node['@type'] === 'Book');
const page = schema['@graph'].find((node) => node['@type'] === 'WebPage');
if (!book) throw new Error('Book entity missing.');
if (!page) throw new Error('WebPage entity missing.');
if (book.name !== '완벽하지 않아서 스며들 수 있었다') throw new Error('Book name mismatch.');
if (book.author?.['@id'] !== 'https://aijoylab.kr/#founder') throw new Error('Book author identity link mismatch.');
if (book.url !== expectedCanonical) throw new Error('Book schema URL mismatch.');
if (page.mainEntity?.['@id'] !== book['@id']) throw new Error('WebPage mainEntity must reference Book.');

const serialized = JSON.stringify(schema);
if (/979-11-987654-3-2|E-BOOK-2026-0920/.test(serialized)) {
  throw new Error('Placeholder bibliographic identifier leaked into Book schema.');
}

if (reader.includes('joylab-book-schema')) {
  throw new Error('Book schema must not be duplicated on reader page.');
}

for (const event of [
  'book_preview_start',
  'book_reader_progress_25',
  'book_reader_progress_50',
  'book_reader_progress_75',
  'book_reader_complete'
]) {
  const source = event === 'book_preview_start' ? landing : reader;
  if (!source.includes(event)) throw new Error(`Analytics event missing: ${event}`);
}

if (!landing.includes('data-analytics-target="' + slug + '"')) {
  throw new Error('Preview analytics target missing book slug.');
}

console.log('Book SEO + Analytics Gate passed.');
console.log(JSON.stringify({
  canonical: expectedCanonical,
  bookId: book['@id'],
  author: book.author?.['@id'],
  events: [
    'book_preview_start',
    'book_reader_progress_25',
    'book_reader_progress_50',
    'book_reader_progress_75',
    'book_reader_complete'
  ]
}, null, 2));

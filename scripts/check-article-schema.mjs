import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distArticles = path.join(root, 'dist/articles');

function validateSchema(schema, file) {
  const errors = [];
  if (schema['@context'] !== 'https://schema.org') errors.push('@context');
  if (schema['@type'] !== 'Article') errors.push('@type');
  for (const field of ['@id', 'headline', 'description', 'url', 'datePublished', 'dateModified', 'author', 'publisher', 'mainEntityOfPage']) {
    if (!schema[field]) errors.push(field);
  }
  if (schema.publisher?.['@id'] !== 'https://aijoylab.kr/#organization') errors.push('publisher.@id');
  if (!String(schema.mainEntityOfPage?.['@id'] || '').endsWith('#webpage')) errors.push('mainEntityOfPage.@id');
  if (schema.url && !String(schema['@id'] || '').startsWith(schema.url)) errors.push('@id/url mismatch');
  if (schema.datePublished && Number.isNaN(Date.parse(schema.datePublished))) errors.push('datePublished format');
  if (schema.dateModified && Number.isNaN(Date.parse(schema.dateModified))) errors.push('dateModified format');
  if (errors.length) throw new Error(`${file}: invalid Article schema => ${errors.join(', ')}`);
}

function schemaFromHtml(html, file) {
  const match = html.match(/<script[^>]*id=["']joylab-article-schema["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error(`${file}: missing #joylab-article-schema`);
  let schema;
  try {
    schema = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${file}: invalid JSON-LD JSON: ${error.message}`);
  }
  validateSchema(schema, file);
  return schema;
}

if (process.argv.includes('--self-test')) {
  const sample = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': 'https://aijoylab.kr/articles/test#article',
    headline: 'Test',
    description: 'Test description',
    url: 'https://aijoylab.kr/articles/test',
    datePublished: '2026-09-20T00:00:00.000Z',
    dateModified: '2026-09-20T00:00:00.000Z',
    author: { '@type': 'Organization', name: 'JoyLab' },
    publisher: { '@type': 'Organization', '@id': 'https://aijoylab.kr/#organization', name: 'JoyLab' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://aijoylab.kr/articles/test#webpage' }
  };
  validateSchema(sample, 'self-test');
  console.log('Article Schema Gate self-test passed.');
  process.exit(0);
}

if (!fs.existsSync(distArticles)) throw new Error('dist/articles not found. Run npm run build first.');

const files = [];
for (const entry of fs.readdirSync(distArticles, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexFile = path.join(distArticles, entry.name, 'index.html');
  if (fs.existsSync(indexFile)) files.push(indexFile);
}
if (!files.length) throw new Error('No built article pages found.');

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  schemaFromHtml(html, path.relative(root, file));
}
console.log(`Article Schema Gate passed for ${files.length} built articles.`);

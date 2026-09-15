import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const generatedDir = path.join(root, 'distribution/generated');
const goldDir = path.join(root, 'distribution/gold');
const outRoot = path.join(root, 'dist/ops/distribution');

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status}`);
}

function isPublishedArticle(file) {
  const text = fs.readFileSync(path.join(articleDir, file), 'utf8');
  return !/^draft:\s*true\s*$/m.test(text);
}

function buildOne(slug) {
  const goldPack = path.join(goldDir, slug, 'distribution-pack.json');
  let packPath = goldPack;

  if (!fs.existsSync(goldPack)) {
    runNode('scripts/build-distribution-pack.mjs', ['--slug', slug]);
    packPath = path.join(generatedDir, slug, 'distribution-pack.json');
  }

  const outPath = path.join(outRoot, slug, 'index.html');
  runNode('scripts/build-distribution-review-html.mjs', ['--manifest', packPath, '--out', outPath]);
  return outPath;
}

if (process.argv.includes('--self-test')) {
  const temp = path.join(root, '.tmp-mobile-review-self-test');
  fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });
  if (!fs.existsSync(path.join(root, 'scripts/build-distribution-review-html.mjs'))) throw new Error('Review HTML generator missing.');
  if (!fs.existsSync(articleDir)) throw new Error('Article directory missing.');
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('Distribution mobile page builder self-test passed.');
  process.exit(0);
}

fs.mkdirSync(outRoot, { recursive: true });
const slugs = fs.readdirSync(articleDir)
  .filter((file) => file.endsWith('.md'))
  .filter(isPublishedArticle)
  .map((file) => file.replace(/\.md$/, ''))
  .sort();

let count = 0;
for (const slug of slugs) {
  buildOne(slug);
  count += 1;
}

const marker = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  pageCount: count,
  routePattern: '/ops/distribution/<article-slug>'
};
fs.writeFileSync(path.join(outRoot, '_mobile-review.json'), `${JSON.stringify(marker, null, 2)}\n`);
console.log(`Distribution Review Mobile V1 pages created: ${count}`);

import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'src/pages/studio/index.astro',
  'src/pages/studio/demo/index.astro',
  'src/pages/studio/projects/series-02/index.astro',
  'src/pages/studio/projects/series-02/manuscript/index.astro',
  'src/pages/studio/projects/series-02/interactive/index.astro',
  'src/pages/studio/projects/series-02/validation/index.astro',
  'src/pages/studio/projects/series-02/preview/index.astro',
  'src/pages/studio/projects/series-02/export/index.astro',
  'src/pages/studio/releases/series-02/v1.0.0/index.astro',
  'src/lib/studio/interactive-block-contract.ts',
  'src/data/studio/series-02-demo.ts',
  'config/contracts/interactive-block-v1.schema.json',
  'scripts/generate-studio-epub-v1.mjs',
  'scripts/generate-studio-print-pdf-v1.mjs',
  'scripts/preflight-studio-print-pdf-v1.mjs',
  'scripts/generate-export-provenance-v1.mjs',
  'src/data/studio/series-02-source.json',
  'scripts/check-series-02-source-v1.mjs'
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.resolve(file))) failures.push('missing: ' + file);
}

for (const file of requiredFiles.filter((f) => f.endsWith('.astro'))) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('robots="noindex,follow"')) failures.push('noindex missing: ' + file);
}

const demo = fs.readFileSync('src/data/studio/series-02-demo.ts', 'utf8');
for (const marker of ['memory-debt-self-assessment','memory-debt-risk-score','persona-zero-moment-canvas','sendResponsesToServer: false']) {
  if (!demo.includes(marker)) failures.push('demo contract marker missing: ' + marker);
}
const interactiveChapterIds = [...demo.matchAll(/chapterId:\s*'chapter-(\\d{2})'/g)].map((m) => m[1]);
if (interactiveChapterIds.length !== 15) failures.push('interactive workbook must contain exactly 15 chapter blocks');
if (new Set(interactiveChapterIds).size !== 15) failures.push('interactive workbook chapter ids must be unique 01-15');
for (let i=1;i<=15;i++) {
  const id=String(i).padStart(2,'0');
  if (!interactiveChapterIds.includes(id)) failures.push('interactive chapter missing: chapter-' + id);
}

const preview = fs.readFileSync('src/pages/studio/projects/series-02/preview/index.astro','utf8');
for (const mode of ['mobile','tablet','desktop','epub','print']) {
  if (!preview.includes('data-view="' + mode + '"')) failures.push('preview mode missing: ' + mode);
}

const exp = fs.readFileSync('src/pages/studio/projects/series-02/export/index.astro','utf8');
if (!exp.includes('/studio/exports/series-02-memory-debt.epub')) failures.push('real EPUB export link missing');
if (!exp.includes('/studio/exports/series-02-memory-debt-print.pdf')) failures.push('real Print PDF export link missing');
if (!exp.includes('/studio/exports/export-provenance-v1.json')) failures.push('export provenance manifest link missing');

if (failures.length) {
  console.error('JoyLab Studio Gate V1: FAIL');
  failures.forEach((x)=>console.error('- '+x));
  process.exit(1);
}
console.log('JoyLab Studio Gate V1: PASS');

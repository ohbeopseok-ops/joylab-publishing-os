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
  'src/lib/studio/interactive-block-contract.ts',
  'src/data/studio/series-02-demo.ts',
  'config/contracts/interactive-block-v1.schema.json',
  'scripts/generate-studio-epub-v1.mjs',
  'src/data/studio/series-02-epub-source.json'
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

const preview = fs.readFileSync('src/pages/studio/projects/series-02/preview/index.astro','utf8');
for (const mode of ['mobile','tablet','desktop','epub','print']) {
  if (!preview.includes('data-view="' + mode + '"')) failures.push('preview mode missing: ' + mode);
}

const exp = fs.readFileSync('src/pages/studio/projects/series-02/export/index.astro','utf8');
if (!exp.includes('/studio/exports/series-02-memory-debt.epub')) failures.push('real EPUB export link missing');
if (!exp.includes("Print PDF','status:'SIMULATED'") && !exp.includes("name:'Print PDF',status:'SIMULATED'")) failures.push('Print PDF must remain simulated until its generator exists');

if (failures.length) {
  console.error('JoyLab Studio Gate V1: FAIL');
  failures.forEach((x)=>console.error('- '+x));
  process.exit(1);
}
console.log('JoyLab Studio Gate V1: PASS');

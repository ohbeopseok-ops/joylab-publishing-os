import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const items = [
  { ep:'EP04', page:'src/pages/guides/growth-leadership/literature/metamorphosis.astro', asset:'public/images/leadership/literature/ep04-metamorphosis.webp' },
  { ep:'EP05', page:'src/pages/guides/growth-leadership/literature/animal-farm.astro', asset:'public/images/leadership/literature/ep05-animal-farm.webp' },
  { ep:'EP06', page:'src/pages/guides/growth-leadership/literature/1984.astro', asset:'public/images/leadership/literature/ep06-1984.webp' },
  { ep:'EP07', page:'src/pages/guides/growth-leadership/literature/the-stranger.astro', asset:'public/images/leadership/literature/ep07-the-stranger.webp' },
];

const failures = [];
for (const item of items) {
  const pagePath = path.join(root, item.page);
  const assetPath = path.join(root, item.asset);
  const publicRef = '/' + item.asset.replace(/^public\//, '');
  let page = '';
  try { page = await fs.readFile(pagePath, 'utf8'); }
  catch { failures.push(`${item.ep}: page missing: ${item.page}`); continue; }

  try {
    await fs.access(assetPath);
    const meta = await sharp(assetPath).metadata();
    if (meta.width !== 1200 || meta.height !== 675) {
      failures.push(`${item.ep}: image must be 1200x675, got ${meta.width}x${meta.height}`);
    }
    if (meta.format !== 'webp') failures.push(`${item.ep}: image must be WebP`);
  } catch {
    failures.push(`${item.ep}: hero image missing: ${item.asset}`);
  }

  const absoluteRef = 'https://aijoylab.kr' + publicRef;
  if (!page.includes(`image="${publicRef}"`)) failures.push(`${item.ep}: BaseLayout image prop missing`);
  if (!page.includes(absoluteRef)) failures.push(`${item.ep}: Article schema image missing`);
}

if (failures.length) {
  console.error('Literature Image Gate FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('Literature Image Gate PASSED: EP04-EP07 hero/OG/schema assets are complete.');

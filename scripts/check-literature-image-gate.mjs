import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const indexPath = path.join(root, 'src/pages/guides/growth-leadership/literature/index.astro');
const indexSource = await fs.readFile(indexPath, 'utf8');

const episodePattern = /\{ ep: '(EP\d+)'[^\n]*href: '([^']+)'[^\n]*image: '([^']+)'[^\n]*live: true \}/g;
const episodes = [...indexSource.matchAll(episodePattern)].map((m) => ({
  ep: m[1],
  href: m[2],
  image: m[3],
}));

const failures = [];
if (!episodes.length) failures.push('No live literature episodes with image contracts were found in index.astro');

for (const item of episodes) {
  const slug = item.href.split('/').filter(Boolean).at(-1);
  const pagePath = path.join(root, 'src/pages/guides/growth-leadership/literature', `${slug}.astro`);
  const assetPath = path.join(root, 'public', item.image.replace(/^\//, ''));
  const absoluteRef = 'https://aijoylab.kr' + item.image;

  let page = '';
  try {
    page = await fs.readFile(pagePath, 'utf8');
  } catch {
    failures.push(`${item.ep}: page missing: ${pagePath}`);
    continue;
  }

  try {
    await fs.access(assetPath);
    const meta = await sharp(assetPath).metadata();
    if (meta.width !== 1200 || meta.height !== 675) {
      failures.push(`${item.ep}: image must be 1200x675, got ${meta.width}x${meta.height}`);
    }
    if (meta.format !== 'webp') failures.push(`${item.ep}: image must be WebP`);
  } catch {
    failures.push(`${item.ep}: hero image missing: ${item.image}`);
  }

  if (!page.includes(`image="${item.image}"`)) {
    failures.push(`${item.ep}: BaseLayout image prop missing or mismatched: ${item.image}`);
  }
  if (!page.includes(absoluteRef)) {
    failures.push(`${item.ep}: Article schema image missing or mismatched: ${absoluteRef}`);
  }
  if (!page.includes(`le-visual--${item.ep.toLowerCase()}`)) {
    failures.push(`${item.ep}: episode hero visual selector missing`);
  }
}

const expectedLiveCount = (indexSource.match(/live: true/g) || []).length;
if (episodes.length !== expectedLiveCount) {
  failures.push(`Image contract coverage mismatch: live=${expectedLiveCount}, contracted=${episodes.length}`);
}

if (failures.length) {
  console.error('Literature Image Gate FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log(`Literature Image Gate PASSED: ${episodes.length} live episodes have 1200x675 WebP + Hero/OG/Schema wiring.`);

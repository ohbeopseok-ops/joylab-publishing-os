import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const HARD_GATE_THROUGH = Number(process.env.LITERATURE_HARD_GATE_THROUGH || 7);
const indexPath = path.join(root, 'src/pages/guides/growth-leadership/literature/index.astro');
const indexSource = await fs.readFile(indexPath, 'utf8');

const rowPattern = /\{ ep: '(EP\d+)'[^\n]*href: '([^']+)'([^\n]*)live: true \}/g;
const liveEpisodes = [...indexSource.matchAll(rowPattern)].map((m) => {
  const imageMatch = m[3].match(/image: '([^']+)'/);
  return { ep:m[1], href:m[2], image:imageMatch?.[1] || null, number:Number(m[1].slice(2)) };
});

const failures = [];
const warnings = [];
for (const item of liveEpisodes) {
  const hard = item.number <= HARD_GATE_THROUGH;
  const issue = (msg) => (hard ? failures : warnings).push(`${item.ep}: ${msg}`);

  if (!item.image) {
    issue('image contract not registered yet');
    continue;
  }

  const slug = item.href.split('/').filter(Boolean).at(-1);
  const pagePath = path.join(root, 'src/pages/guides/growth-leadership/literature', `${slug}.astro`);
  const assetPath = path.join(root, 'public', item.image.replace(/^\//, ''));
  const absoluteRef = 'https://aijoylab.kr' + item.image;

  let page = '';
  try { page = await fs.readFile(pagePath, 'utf8'); }
  catch { issue(`page missing: ${pagePath}`); continue; }

  try {
    await fs.access(assetPath);
    const meta = await sharp(assetPath).metadata();
    if (meta.width !== 1200 || meta.height !== 675) issue(`image must be 1200x675, got ${meta.width}x${meta.height}`);
    if (meta.format !== 'webp') issue('image must be WebP');
  } catch {
    issue(`hero image missing: ${item.image}`);
  }

  if (!page.includes(`image="${item.image}"`)) issue(`BaseLayout image prop missing or mismatched: ${item.image}`);
  if (!page.includes(absoluteRef)) issue(`Article schema image missing or mismatched: ${absoluteRef}`);
  if (!page.includes(`le-visual--${item.ep.toLowerCase()}`)) issue('episode hero visual selector missing');
}

for (const warning of warnings) console.warn('AUDIT - ' + warning);

if (failures.length) {
  console.error(`Literature Image Gate FAILED (hard gate through EP${String(HARD_GATE_THROUGH).padStart(2,'0')})`);
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log(`Literature Image Gate PASSED through EP${String(HARD_GATE_THROUGH).padStart(2,'0')}; later live episodes remain in audit mode.`);

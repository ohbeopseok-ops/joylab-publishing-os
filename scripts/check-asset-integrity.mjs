import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceRoots = [path.join(root, 'src'), path.join(root, 'public')];
const sourceExts = new Set(['.astro', '.md', '.mdx', '.json', '.css', '.js', '.mjs', '.ts', '.tsx', '.html']);
const rasterExts = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif']);
const failures = [];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const refs = new Set();
for (const base of sourceRoots) {
  for (const file of walk(base)) {
    if (!sourceExts.has(path.extname(file).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

    for (const match of text.matchAll(/(?:https:\/\/aijoylab\.kr)?(\/images\/[A-Za-z0-9_./%()\-]+\.(?:webp|png|jpe?g|avif))/gi)) {
      refs.add(match[1]);
    }
  }
}

let decoded = 0;
for (const ref of refs) {
  const clean = decodeURIComponent(ref.split('?')[0]);
  const file = path.join(root, 'public', clean.replace(/^\//, ''));

  if (!fs.existsSync(file)) {
    failures.push(`${ref}: referenced raster asset is missing`);
    continue;
  }

  try {
    const image = sharp(file, { failOn: 'error' });
    const meta = await image.metadata();
    if (!meta.width || !meta.height) throw new Error('missing dimensions');
    await image.raw().toBuffer();
    decoded += 1;

    if (clean.startsWith('/images/leadership/literature/')) {
      const ratio = meta.width / meta.height;
      const target = 16 / 9;
      if (Math.abs(ratio - target) > 0.01) {
        failures.push(`${ref}: Literature Hero/OG must be 16:9; got ${meta.width}x${meta.height}`);
      }
    }
  } catch (error) {
    failures.push(`${ref}: active asset decode failed: ${error.message}`);
  }
}

console.log(`Asset Integrity Gate: decoded ${decoded} active raster assets; checked ${refs.size} active source references.`);

if (failures.length) {
  console.error('Asset Integrity Gate FAILED:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Asset Integrity Gate PASS');

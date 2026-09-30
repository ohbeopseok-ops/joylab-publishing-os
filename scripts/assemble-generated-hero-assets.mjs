import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceRoot = path.join(root, 'src/data/generated-hero-parts');
const outputRoot = path.join(root, 'public/images/research/generated');

if (!fs.existsSync(sourceRoot)) {
  console.log('No generated Hero parts found; skipping assembly.');
  process.exit(0);
}

fs.mkdirSync(outputRoot, { recursive: true });

let count = 0;
for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(sourceRoot, entry.name);
  const parts = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.b64'))
    .sort();
  if (!parts.length) continue;

  const base64 = parts.map((name) => fs.readFileSync(path.join(dir, name), 'utf8').trim()).join('');
  const bytes = Buffer.from(base64, 'base64');
  const metadata = await sharp(bytes).metadata();
  const normalized = metadata.format === 'webp' && metadata.width === 1600 && metadata.height === 900
    ? bytes
    : await sharp(bytes)
        .resize(1600, 900, { fit: 'cover', position: 'centre' })
        .webp({ quality: 78, effort: 5 })
        .toBuffer();
  const out = path.join(outputRoot, `${entry.name}.webp`);
  fs.writeFileSync(out, normalized);
  count += 1;
  console.log(`Assembled generated Hero: ${path.relative(root, out)} (${normalized.length} bytes, 1600x900)`);
}

console.log(`Assembled ${count} generated Hero asset(s).`);

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const source = path.join(root, 'public/images/research/semiconductor-giant-shoulder-flow-hero-v2.svg');
const target = path.join(root, 'public/images/research/generated/semiconductor-giant-shoulder-flow-og-v2.webp');

if (!fs.existsSync(source)) {
  throw new Error('Giant Shoulder SVG source missing: ' + source);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
await sharp(source, { density: 180 })
  .resize(1600, 900, { fit: 'cover' })
  .webp({ quality: 90, effort: 6 })
  .toFile(target);

const size = fs.statSync(target).size;
if (size < 20000) {
  throw new Error('Generated OG card unexpectedly small: ' + size + ' bytes');
}
console.log('Materialized Giant Shoulder OG V2:', path.relative(root, target), size + ' bytes');

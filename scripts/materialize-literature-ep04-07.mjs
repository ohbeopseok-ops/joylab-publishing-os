import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const specs = [
  { seed:'assets/literature-ep04-07/seeds/ep04-metamorphosis.b64', out:'public/images/leadership/literature/ep04-metamorphosis.webp' },
  { seed:'assets/literature-ep04-07/seeds/ep05-animal-farm.b64', out:'public/images/leadership/literature/ep05-animal-farm.webp' },
  { seed:'assets/literature-ep04-07/seeds/ep06-1984.b64', out:'public/images/leadership/literature/ep06-1984.webp' },
  { seed:'assets/literature-ep04-07/seeds/ep07-the-stranger.b64', out:'public/images/leadership/literature/ep07-the-stranger.webp' },
];

for (const spec of specs) {
  const b64 = (await fs.readFile(path.join(root, spec.seed), 'utf8')).trim();
  const seed = Buffer.from(b64, 'base64');
  const digest = crypto.createHash('sha256').update(seed).digest('hex');

  const seedMeta = await sharp(seed).metadata();
  if (seedMeta.width !== 480 || seedMeta.height !== 270 || seedMeta.format !== 'webp') {
    throw new Error(`${spec.seed}: expected verified 480x270 WebP seed, got ${seedMeta.width}x${seedMeta.height} ${seedMeta.format}`);
  }

  const target = path.join(root, spec.out);
  await fs.mkdir(path.dirname(target), { recursive: true });

  await sharp(seed)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82, effort: 6 })
    .toFile(target);

  const outMeta = await sharp(target).metadata();
  if (outMeta.width !== 1200 || outMeta.height !== 675 || outMeta.format !== 'webp') {
    throw new Error(`${spec.out}: materialized asset invalid ${outMeta.width}x${outMeta.height} ${outMeta.format}`);
  }

  console.log(`Materialized verified literature hero: ${spec.out} (seed sha256 ${digest})`);
}

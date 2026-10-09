import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const specs = [
  { seed:'assets/literature-ep04-07/seeds/ep04-metamorphosis.b64', out:'public/images/leadership/literature/ep04-metamorphosis.webp', bytes:7086, sha256:'a78b83db81d49efa9d26c25a6760b85a2d2bc47eca49656c5e591cc8beb7672a' },
  { seed:'assets/literature-ep04-07/seeds/ep05-animal-farm.b64', out:'public/images/leadership/literature/ep05-animal-farm.webp', bytes:7596, sha256:'b13b23346746e3638764fa3f635cea12378755ac14cb8588c6615dd37fa72acc' },
  { seed:'assets/literature-ep04-07/seeds/ep06-1984.b64', out:'public/images/leadership/literature/ep06-1984.webp', bytes:6940, sha256:'a9d3c140dafe565d2f14b052a081e809c6802ab62ac31606bd2eed33e7728e00' },
  { seed:'assets/literature-ep04-07/seeds/ep07-the-stranger.b64', out:'public/images/leadership/literature/ep07-the-stranger.webp', bytes:6726, sha256:'8380705447a4e875ce004f5e7a5bf8140168959cae63c1c9295b908154e6b7ec' },
];

for (const spec of specs) {
  const b64 = (await fs.readFile(path.join(root, spec.seed), 'utf8')).trim();
  const seed = Buffer.from(b64, 'base64');
  const digest = crypto.createHash('sha256').update(seed).digest('hex');

  if (seed.length !== spec.bytes) {
    throw new Error(`${spec.seed}: seed byte length mismatch ${seed.length} != ${spec.bytes}`);
  }
  if (digest !== spec.sha256) {
    throw new Error(`${spec.seed}: seed sha256 mismatch ${digest}`);
  }

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

  console.log(`Materialized verified literature hero: ${spec.out} from ${spec.seed}`);
}

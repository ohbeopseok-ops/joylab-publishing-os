import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const rules = JSON.parse(fs.readFileSync(path.join(root, 'src/data/hero-quality-rules.json'), 'utf8'));
const heroes = JSON.parse(fs.readFileSync(path.join(root, 'src/data/curated-generated-heroes.json'), 'utf8'));
const failures = [];
const records = [];

const pairKey = (a, b) => [a, b].sort().join('::');
const allowedPairs = new Set((rules.allowedSimilarPairs ?? []).map(([a, b]) => pairKey(a, b)));
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function dct2(values, size = 32, low = 8) {
  const result = [];
  for (let u = 0; u < low; u += 1) {
    for (let v = 0; v < low; v += 1) {
      let sum = 0;
      for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size; y += 1) {
          sum += values[(x * size) + y]
            * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size))
            * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }
      result.push(sum);
    }
  }
  return result;
}

async function perceptualHash(file) {
  const pixels = await sharp(file).resize(32, 32, { fit: 'fill' }).greyscale().raw().toBuffer();
  const coefficients = dct2(pixels);
  const threshold = median(coefficients.slice(1));
  return coefficients.slice(1).map((value) => value >= threshold ? '1' : '0').join('');
}

function hammingDistance(a, b) {
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) distance += a[index] === b[index] ? 0 : 1;
  return distance;
}

for (const [articleId, config] of Object.entries(heroes)) {
  const hero = config?.hero;
  if (!hero?.src || !hero?.alt?.trim()) {
    failures.push(`${articleId}: Hero requires non-empty src and alt`);
    continue;
  }
  const file = path.join(root, 'public', hero.src.replace(/^\//, ''));
  if (!fs.existsSync(file)) {
    failures.push(`${articleId}: missing Hero asset ${hero.src}`);
    continue;
  }
  const bytes = fs.readFileSync(file);
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== rules.format) failures.push(`${articleId}: expected ${rules.format}, received ${metadata.format}`);
  if (metadata.width !== rules.width || metadata.height !== rules.height) {
    failures.push(`${articleId}: expected ${rules.width}x${rules.height}, received ${metadata.width}x${metadata.height}`);
  }
  if (bytes.length < rules.minBytes || bytes.length > rules.maxBytes) {
    failures.push(`${articleId}: ${bytes.length} bytes is outside ${rules.minBytes}-${rules.maxBytes}`);
  }
  records.push({
    articleId,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    pHash: await perceptualHash(file)
  });
}

for (let left = 0; left < records.length; left += 1) {
  for (let right = left + 1; right < records.length; right += 1) {
    const a = records[left];
    const b = records[right];
    if (a.sha256 === b.sha256) failures.push(`${a.articleId} / ${b.articleId}: exact duplicate Hero bytes`);
    const distance = hammingDistance(a.pHash, b.pHash);
    if (distance <= rules.pHashDistanceBlock && !allowedPairs.has(pairKey(a.articleId, b.articleId))) {
      failures.push(`${a.articleId} / ${b.articleId}: pHash distance ${distance} <= ${rules.pHashDistanceBlock}`);
    }
  }
}

if (records.length !== Object.keys(heroes).length) failures.push(`validated ${records.length}/${Object.keys(heroes).length} configured Heroes`);
if (failures.length) {
  console.error('\nHero Quality Gate V2 FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Hero Quality Gate V2 PASS: ${records.length} Heroes; ${records.length * (records.length - 1) / 2} similarity pairs checked.`);

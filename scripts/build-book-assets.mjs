import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

const jobs = [
  {
    source: path.join(root, 'assets/books/ax-customer-center-cover.svg'),
    output: path.join(root, 'public/images/books/ax-customer-center-cover.webp'),
    width: 960,
    height: 1440,
    quality: 82
  },
  {
    source: path.join(root, 'assets/books/ax-customer-center-og.svg'),
    output: path.join(root, 'public/images/og/ax-customer-center-og.webp'),
    width: 1200,
    height: 630,
    quality: 84
  }
];

async function assembleBase64Parts(partsDir, outputPath, expected) {
  const sourceDir = path.join(root, partsDir);
  const output = path.join(root, outputPath);
  const names = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.b64')).sort();
  if (!names.length) throw new Error(`No base64 parts found in ${partsDir}`);

  const base64 = (await Promise.all(names.map((name) => fs.readFile(path.join(sourceDir, name), 'utf8'))))
    .join('')
    .replace(/\s+/g, '');
  const buffer = Buffer.from(base64, 'base64');

  const meta = await sharp(buffer, { failOn: 'error' }).metadata();
  if (meta.format !== 'webp' || meta.width !== expected.width || meta.height !== expected.height) {
    throw new Error(
      `${outputPath}: expected WebP ${expected.width}x${expected.height}, got ${meta.format} ${meta.width}x${meta.height}`
    );
  }
  await sharp(buffer, { failOn: 'error' }).raw().toBuffer();

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, buffer);
  console.log(`[book-assets] assembled ${outputPath} (${buffer.length} bytes)`);
}

for (const job of jobs) {
  await fs.mkdir(path.dirname(job.output), { recursive: true });
  await sharp(job.source)
    .resize(job.width, job.height, { fit: 'cover' })
    .webp({ quality: job.quality, effort: 5 })
    .toFile(job.output);
  console.log(`[book-assets] generated ${path.relative(root, job.output)}`);
}

await assembleBase64Parts(
  'assets/books/weight-of-silence-cover.parts',
  'public/images/books/weight-of-silence-cover.webp',
  { width: 800, height: 1200 }
);

await assembleBase64Parts(
  'assets/books/weight-of-silence-og.parts',
  'public/images/books/weight-of-silence-og.webp',
  { width: 1200, height: 675 }
);

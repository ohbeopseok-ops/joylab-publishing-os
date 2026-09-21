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

for (const job of jobs) {
  await fs.mkdir(path.dirname(job.output), { recursive: true });
  await sharp(job.source)
    .resize(job.width, job.height, { fit: 'cover' })
    .webp({ quality: job.quality, effort: 5 })
    .toFile(job.output);
  console.log(`[book-assets] generated ${path.relative(root, job.output)}`);
}

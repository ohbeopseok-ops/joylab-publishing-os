import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const targets = [
  {
    source: 'assets/books/weight-of-silence/interactive-source.html',
    output: 'public/books/weight-of-silence/interactive-v3.bin',
    markers: ['<!DOCTYPE html', '악보의 쉼표 사이에 고여 있는 침묵의 무게', 'const BOOK_DATA = [']
  },
  {
    source: 'assets/books/weight-of-silence/mindmap-source.html',
    output: 'public/books/weight-of-silence/mindmap-v2.bin',
    markers: ['<!DOCTYPE html', '악보의 쉼표 사이에 고여 있는 침묵의 무게', 'markmapContent']
  }
];

for (const target of targets) {
  const sourcePath = path.join(root, target.source);
  const outputPath = path.join(root, target.output);
  const html = fs.readFileSync(sourcePath, 'utf8');

  for (const marker of target.markers) {
    if (!html.includes(marker)) throw new Error(`${target.source}: missing marker ${marker}`);
  }

  const output = zlib.gzipSync(Buffer.from(html, 'utf8'), { level: 9, mtime: 0 });
  const verify = zlib.gunzipSync(output).toString('utf8');
  if (verify !== html) throw new Error(`${target.output}: strict gzip round-trip failed`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
  console.log(`Reader payload materialized: ${target.output} (${output.length} bytes, source=${target.source})`);
}

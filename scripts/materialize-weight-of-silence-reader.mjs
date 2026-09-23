import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const targets = [
  {
    file: 'public/books/weight-of-silence/interactive.bin',
    markers: ['<!doctype html', '악보의 쉼표 사이에 고여 있는 침묵의 무게']
  },
  {
    file: 'public/books/weight-of-silence/mindmap.bin',
    markers: ['<!doctype html', '침묵']
  }
];

for (const target of targets) {
  const file = path.join(root, target.file);
  const input = fs.readFileSync(file);
  let html;
  let repaired = false;

  try {
    html = zlib.gunzipSync(input).toString('utf8');
  } catch {
    const salvaged = zlib.gunzipSync(input, { finishFlush: zlib.constants.Z_SYNC_FLUSH });
    html = salvaged.toString('utf8');
    repaired = true;
  }

  const lower = html.trim().toLowerCase();
  if (!lower.includes('<!doctype html') && !lower.includes('<html')) {
    throw new Error(`${target.file}: recovered payload is not HTML`);
  }
  for (const marker of target.markers) {
    if (!html.includes(marker)) throw new Error(`${target.file}: missing marker ${marker}`);
  }

  const output = zlib.gzipSync(Buffer.from(html, 'utf8'), { level: 9, mtime: 0 });
  const verify = zlib.gunzipSync(output).toString('utf8');
  if (verify !== html) throw new Error(`${target.file}: strict gzip round-trip failed`);

  fs.writeFileSync(file, output);
  console.log(`Reader payload materialized: ${target.file} (${output.length} bytes, source=${repaired ? 'salvaged' : 'valid'})`);
}

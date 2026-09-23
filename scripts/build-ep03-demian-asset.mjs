import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('assets-src/ep03-demian-v2');
const outputPath = path.resolve('public/images/leadership/literature/ep03-demian-v2.webp');

const files = (await fs.readdir(sourceDir))
  .filter((name) => /^part-\d{2}\.b64$/.test(name))
  .sort();

if (files.length !== 6) {
  throw new Error(`EP03 asset source incomplete: expected 6 chunks, found ${files.length}`);
}

const b64 = (await Promise.all(
  files.map(async (name) => (await fs.readFile(path.join(sourceDir, name), 'utf8')).trim())
)).join('');

const buffer = Buffer.from(b64, 'base64');

if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    buffer.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error('EP03 asset is not a valid RIFF/WEBP file');
}

const declaredBytes = buffer.readUInt32LE(4) + 8;
if (declaredBytes !== buffer.length) {
  throw new Error(`EP03 asset truncated: RIFF declares ${declaredBytes} bytes, decoded ${buffer.length}`);
}

let width = 0;
let height = 0;
for (let i = 12; i < Math.min(buffer.length - 7, 128); i += 1) {
  if (buffer[i] === 0x9d && buffer[i + 1] === 0x01 && buffer[i + 2] === 0x2a) {
    width = buffer.readUInt16LE(i + 3) & 0x3fff;
    height = buffer.readUInt16LE(i + 5) & 0x3fff;
    break;
  }
}

if (width !== 1200 || height !== 675) {
  throw new Error(`EP03 asset dimensions invalid: expected 1200x675, got ${width}x${height}`);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, buffer);
console.log(`EP03 hero rebuilt: ${width}x${height}, ${buffer.length} bytes -> ${outputPath}`);

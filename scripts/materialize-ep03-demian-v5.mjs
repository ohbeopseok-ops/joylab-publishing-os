import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const sourceDir = path.join(root, 'assets/ep03-demian-v5');
const outputs = [
  path.join(root, 'public/images/leadership/literature/ep03-demian-v5.webp'),
  path.join(root, 'public/images/leadership/literature/ep03-demian-v7.webp')
];
const chunks = ['00.b64', '01.b64', '02.b64', '03.b64', '04.b64', '05.b64'];
const expectedBytes = 38946;
const expectedSha256 = 'd11716a27324b8725efdcce61b82aaca524673b408da1036d6187d7a304862ff';

const encoded = chunks.map((name) => {
  const file = path.join(sourceDir, name);
  if (!fs.existsSync(file)) throw new Error(`Missing EP03 v5 source chunk: ${file}`);
  return fs.readFileSync(file, 'utf8').trim();
}).join('');

const buffer = Buffer.from(encoded, 'base64');
if (buffer.length !== expectedBytes) {
  throw new Error(`EP03 v5 byte length mismatch: expected ${expectedBytes}, got ${buffer.length}`);
}
if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error('EP03 v5 is not a valid RIFF/WEBP container');
}

const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
if (sha256 !== expectedSha256) {
  throw new Error(`EP03 v5 sha256 mismatch: expected ${expectedSha256}, got ${sha256}`);
}

for (const output of outputs) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, buffer);
  console.log(`Materialized verified EP03 Demian asset: ${path.relative(root, output)} (${buffer.length} bytes, sha256 ${sha256})`);
}

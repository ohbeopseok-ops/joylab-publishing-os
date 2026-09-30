import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'src/data/generated-hero-parts');
const outputRoot = path.join(root, 'public/images/research/generated');
const payloadFixes = new Map([
  ['semiconductor-giant-shoulder-flow-hero', ['+ilfe5CC', '+life5CC']]
]);

if (!fs.existsSync(sourceRoot)) {
  console.log('No generated Hero parts found; skipping assembly.');
  process.exit(0);
}

fs.mkdirSync(outputRoot, { recursive: true });

let count = 0;
for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(sourceRoot, entry.name);
  const parts = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.b64'))
    .sort();
  if (!parts.length) continue;

  let base64 = parts.map((name) => fs.readFileSync(path.join(dir, name), 'utf8').trim()).join('');
  const fix = payloadFixes.get(entry.name);
  if (fix) base64 = base64.replace(fix[0], fix[1]);
  const bytes = Buffer.from(base64, 'base64');
  const out = path.join(outputRoot, `${entry.name}.webp`);
  fs.writeFileSync(out, bytes);
  count += 1;
  console.log(`Assembled generated Hero: ${path.relative(root, out)} (${bytes.length} bytes)`);
}

console.log(`Assembled ${count} generated Hero asset(s).`);

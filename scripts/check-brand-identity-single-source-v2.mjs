import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const canonicalSource = 'src/config/siteIdentity.ts';

const protectedLiterals = [
  'https://aijoylab.kr',
  'contact@aijoylab.kr',
  'https://www.youtube.com/@JoyLabResearch',
  'https://blog.naver.com/joy014',
  'https://www.threads.com/@ohbeopseok',
  'https://www.instagram.com/aijoylab/',
  'https://www.linkedin.com/in/%EB%B2%95%EC%84%9D-%EC%98%A4-b3273633b/',
  'https://x.com/ohbeopseok'
];

const protectedRoots = [
  'src/components/',
  'src/layouts/',
  'src/pages/',
  'src/lib/'
];

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const sourceExtensions = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const extOf = (path) => {
  const index = path.lastIndexOf('.');
  return index >= 0 ? path.slice(index).toLowerCase() : '';
};

const violations = [];

for (const path of tracked) {
  if (path === canonicalSource) continue;
  if (!protectedRoots.some((root) => path.startsWith(root))) continue;
  if (!sourceExtensions.has(extOf(path))) continue;

  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    continue;
  }

  for (const literal of protectedLiterals) {
    if (content.includes(literal)) {
      violations.push({ path, literal });
    }
  }
}

if (violations.length) {
  console.error('Brand Identity Single Source Gate V2 FAILED');
  console.error(`Canonical source: ${canonicalSource}`);
  console.error('Protected identity literals must not be hardcoded in production source:');
  for (const { path, literal } of violations) {
    console.error(`- ${path}: ${literal}`);
  }
  process.exit(1);
}

const identity = readFileSync(canonicalSource, 'utf8');
for (const literal of protectedLiterals) {
  if (!identity.includes(literal)) {
    console.error(`Brand Identity Single Source Gate V2 FAILED: canonical literal missing from ${canonicalSource}: ${literal}`);
    process.exit(1);
  }
}

console.log('Brand Identity Single Source Gate V2 PASS');
console.log(`Canonical source: ${canonicalSource}`);
console.log(`Protected literals: ${protectedLiterals.length}`);

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const specsDir = path.join(root, 'config/company-compact-specs');
const targetsPath = path.join(root, 'config/company-compact-targets-v1.json');

const exists = async (p) => fs.access(p).then(() => true).catch(() => false);

if (!(await exists(specsDir))) {
  console.log('Company Compact Auto Sync · no spec directory, nothing to do');
  process.exit(0);
}

const entries = (await fs.readdir(specsDir))
  .filter((name) => name.endsWith('.json'))
  .sort();

if (!entries.length) {
  console.log('Company Compact Auto Sync · no specs, nothing to do');
  process.exit(0);
}

const targets = JSON.parse(await fs.readFile(targetsPath, 'utf8'));
const registeredArticles = new Set((targets.targets || []).map((item) => item.articleId));
const registeredKeys = new Set((targets.targets || []).map((item) => item.graphKey));
let created = 0;
let skipped = 0;

for (const file of entries) {
  const rel = path.posix.join('config/company-compact-specs', file);
  const abs = path.join(specsDir, file);
  const spec = JSON.parse(await fs.readFile(abs, 'utf8'));

  if (!spec.articleId || !spec.key) {
    throw new Error(rel + ': spec requires articleId and key');
  }

  if (registeredArticles.has(spec.articleId) || registeredKeys.has(spec.key)) {
    if (!(registeredArticles.has(spec.articleId) && registeredKeys.has(spec.key))) {
      throw new Error(rel + ': articleId/key partially collide with existing target contract');
    }
    console.log('SKIP registered ·', spec.articleId);
    skipped += 1;
    continue;
  }

  console.log('AUTO SCAFFOLD ·', spec.articleId);
  execFileSync(
    process.execPath,
    ['scripts/create-company-compact-scaffold-v1.mjs', '--spec', rel],
    { cwd: root, stdio: 'inherit' }
  );

  registeredArticles.add(spec.articleId);
  registeredKeys.add(spec.key);
  created += 1;
}

execFileSync(process.execPath, ['scripts/check-company-compact-contract-v1.mjs'], {
  cwd: root,
  stdio: 'inherit'
});

console.log(`Company Compact Auto Sync PASS · created=${created} skipped=${skipped} specs=${entries.length}`);

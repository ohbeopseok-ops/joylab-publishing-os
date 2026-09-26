import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const baseSha = (process.env.IDENTITY_CONTRACT_BASE_SHA || '').trim();
const scopes = ['src/data/articles', 'src/data/books'];

function frontmatter(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function scalar(text, key) {
  const fm = frontmatter(text);
  const match = fm.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function readCurrent(file) {
  const full = path.join(root, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

function readBase(file) {
  if (!baseSha) return null;
  try {
    return execFileSync('git', ['show', baseSha + ':' + file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function changedFiles() {
  if (!baseSha) return [];
  const out = execFileSync('git', ['diff', '--name-status', '--find-renames', baseSha, 'HEAD', '--', ...scopes], { encoding: 'utf8' });
  return out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => line.split(/\t+/));
}

const failures = [];
const warnings = [];
const checked = [];

for (const parts of changedFiles()) {
  const status = parts[0];

  if (status.startsWith('R')) {
    const oldFile = parts[1];
    const newFile = parts[2];
    failures.push({
      rule: 'published-slug-immutable',
      oldFile,
      newFile,
      message: 'Published slug/file renames require a dedicated redirect migration and are blocked by Content Identity Contract V1.'
    });
    continue;
  }

  const file = parts[1];
  if (!file?.endsWith('.md')) continue;
  const before = readBase(file);
  const after = readCurrent(file);
  if (!before || !after) continue;

  const beforeDraft = scalar(before, 'draft').toLowerCase() === 'true';
  if (beforeDraft) continue;

  const reason = scalar(after, 'identityChangeReason');
  const fields = [
    ['title', scalar(before, 'title'), scalar(after, 'title')],
    ['canonical', scalar(before, 'canonical'), scalar(after, 'canonical')]
  ];

  const changes = fields.filter(([, a, b]) => a !== b).map(([field, from, to]) => ({ field, from, to }));
  if (!changes.length) continue;

  checked.push({ file, changes, reason: reason || null });

  if (!reason) {
    failures.push({
      file,
      rule: 'identity-change-requires-reason',
      changes,
      message: 'Changing title or canonical on already published content requires identityChangeReason.'
    });
  } else {
    warnings.push({
      file,
      rule: 'documented-identity-change',
      reason,
      changes
    });
  }
}

const report = {
  gate: 'Content Identity Contract V1',
  baseSha: baseSha || null,
  policy: {
    title: 'immutable unless identityChangeReason is supplied',
    canonical: 'immutable unless identityChangeReason is supplied',
    slug: 'immutable for published content; redirect migration required'
  },
  totals: { checked: checked.length, failures: failures.length, warnings: warnings.length },
  checked,
  warnings,
  failures
};

const outDir = path.join(root, 'qa-artifacts', 'content-identity-contract-v1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error('Content Identity Contract V1 BLOCKED');
  process.exit(1);
}
console.log('Content Identity Contract V1 PASS');

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const contentRoots = [
  path.join(root, 'src', 'data', 'articles'),
  path.join(root, 'src', 'data', 'books')
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : (entry.isFile() && entry.name.endsWith('.md') ? [full] : []);
  });
}

function frontmatter(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function value(text, key) {
  const fm = frontmatter(text);
  const match = fm.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function boolValue(text, key) {
  return value(text, key).toLowerCase() === 'true';
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value + 'T00:00:00Z'));
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function previousText(baseSha, file) {
  try {
    return execFileSync('git', ['show', baseSha + ':' + file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

const failures = [];
const warnings = [];
const records = [];
const todayKst = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

for (const file of contentRoots.flatMap(walk)) {
  const fileRel = rel(file);
  const text = fs.readFileSync(file, 'utf8');
  const publishedAt = value(text, 'publishedAt');
  const updatedAt = value(text, 'updatedAt');
  const featuredAt = value(text, 'featuredAt');
  const draft = boolValue(text, 'draft');

  if (!publishedAt) {
    failures.push({ file: fileRel, rule: 'publishedAt-required' });
    continue;
  }
  if (!validDate(publishedAt)) failures.push({ file: fileRel, rule: 'publishedAt-invalid', value: publishedAt });
  if (updatedAt && !validDate(updatedAt)) failures.push({ file: fileRel, rule: 'updatedAt-invalid', value: updatedAt });
  if (featuredAt && !validDate(featuredAt)) failures.push({ file: fileRel, rule: 'featuredAt-invalid', value: featuredAt });
  if (!draft && validDate(publishedAt) && publishedAt > todayKst) {
    failures.push({ file: fileRel, rule: 'future-publishedAt-requires-draft', value: publishedAt, todayKst });
  }
  if (updatedAt && validDate(updatedAt) && validDate(publishedAt) && updatedAt < publishedAt) {
    warnings.push({ file: fileRel, rule: 'updatedAt-before-publishedAt', publishedAt, updatedAt });
  }

  records.push({ file: fileRel, publishedAt, updatedAt: updatedAt || null, featuredAt: featuredAt || null, draft });
}

const baseSha = (process.env.DATE_CONTRACT_BASE_SHA || '').trim();
if (baseSha) {
  for (const record of records) {
    const currentText = fs.readFileSync(path.join(root, record.file), 'utf8');
    const previous = previousText(baseSha, record.file);
    if (previous == null) continue;

    const before = value(previous, 'publishedAt');
    const after = value(currentText, 'publishedAt');
    if (before && after && before !== after) {
      const reason = value(currentText, 'dateCorrectionReason');
      if (!reason) {
        failures.push({
          file: record.file,
          rule: 'publishedAt-mutation-requires-dateCorrectionReason',
          before,
          after
        });
      } else {
        warnings.push({
          file: record.file,
          rule: 'publishedAt-corrected-with-reason',
          before,
          after,
          reason
        });
      }
    }
  }
}

const homepage = fs.readFileSync(path.join(root, 'src', 'pages', 'index.astro'), 'utf8');
if (!/const\s+latestResearch[\s\S]*?articles/.test(homepage)) {
  failures.push({ file: 'src/pages/index.astro', rule: 'latest-must-source-articles' });
}
if (/latestResearch[\s\S]{0,500}books/.test(homepage)) {
  failures.push({ file: 'src/pages/index.astro', rule: 'books-must-not-enter-latestResearch' });
}

const report = {
  gate: 'Content Date Contract V1',
  todayKst,
  baseSha: baseSha || null,
  totals: {
    files: records.length,
    failures: failures.length,
    warnings: warnings.length
  },
  warnings,
  failures
};

const outDir = path.join(root, 'qa-artifacts', 'content-date-contract-v1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error('Content Date Contract V1 BLOCKED');
  process.exit(1);
}
console.log('Content Date Contract V1 PASS');

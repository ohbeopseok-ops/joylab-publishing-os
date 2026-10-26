import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Narrow, additive gate: only added/edited Research articles. No protected gate is replaced.
const root = process.cwd();
const folder = 'src/data/articles/';
const base = process.env.GITHUB_BASE_SHA || process.argv[2] || '';
function changes() {
  if (!base) return []; // no PR diff means run the canonical site-wide gates only
  const changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACM', base, 'HEAD', '--', folder], { encoding: 'utf8' });
  return changed.trim().split('\n').filter(f => f.endsWith('.md'));
}
function field(front, name) {
  return front.match(new RegExp('^' + name + ':\\s*(.*)$', 'm'))?.[1]?.trim()?.replace(/^["']|["']$/g, '') ?? '';
}
function evaluate(source, filename, distRoot = 'dist') {
  const faults = [];
  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return ['missing YAML frontmatter'];
  const meta = fm[1];
  const draft = field(meta, 'draft') === 'true';
  if (draft) return []; // drafts never count as publication PASS; reviewed separately
  const slug = path.basename(filename, '.md');
  const canonical = 'https://aijoylab.kr/articles/' + slug;
  if (field(meta, 'canonical') !== canonical) faults.push('canonical mismatch');
  if (!field(meta, 'seoTitle')) faults.push('missing seoTitle');
  if (field(meta, 'description').length < 45) faults.push('description too short');
  if (!/\bresearchMethod:|\btrust:/.test(meta)) faults.push('missing research method/trust layer');
  if (!/\bsourceList:|\bprimarySources:/.test(meta)) faults.push('missing sources');
  const htmlFile = path.join(distRoot, 'articles', slug, 'index.html');
  if (!fs.existsSync(htmlFile)) faults.push('generated page missing: ' + htmlFile);
  else {
    const html = fs.readFileSync(htmlFile, 'utf8');
    if (!html.includes(canonical)) faults.push('canonical absent from generated HTML');
    if (!html.includes('application/ld+json')) faults.push('JSON-LD absent from generated HTML');
    if (!html.includes(field(meta, 'seoTitle')) && !html.includes(field(meta, 'title'))) faults.push('article title absent from HTML');
  }
  for (const match of source.matchAll(/\]\((\/articles\/[^)#?]+)(?:#[^)]+)?\)/g)) {
    const target = match[1].split('/').filter(Boolean).at(-1);
    if (!fs.existsSync(path.join(distRoot, 'articles', target, 'index.html'))) faults.push('broken internal article link: ' + match[1]);
  }
  return faults;
}
if (process.argv.includes('--self-test')) {
  const snippet = '---\ntitle: "Example"\nseoTitle: "Example"\ndescription: "A long description that is long enough for the check."\ncanonical: "https://aijoylab.kr/articles/test"\ndraft: false\nresearchMethod: test\nsourceList:\n---\n';
  const failures = evaluate(snippet, 'test.md', '__missing_dist__');
  if (!failures.some(x => x.startsWith('generated page missing'))) throw new Error('self-test failed');
  console.log('Research Editorial Gate V1 self-test PASS'); process.exit(0);
}
const files = changes();
const report = { gate: 'Research Editorial Gate V1', base, changedArticles: files, failures: [], visualEvidence: 'PENDING_MANUAL_REVIEW', humanApproval: 'PENDING' };
for (const file of files) {
  const faults = evaluate(fs.readFileSync(file, 'utf8'), file);
  report.failures.push(...faults.map(reason => ({ file, reason })));
}
fs.mkdirSync('qa-artifacts/research-editorial-gate-v1', { recursive: true });
fs.writeFileSync('qa-artifacts/research-editorial-gate-v1/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;

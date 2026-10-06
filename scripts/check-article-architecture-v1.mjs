import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import GithubSlugger from 'github-slugger';
import { validateArticleArchitecture } from '../src/lib/article-architecture.mjs';

// Use Astro's locked frontmatter parser; rejects duplicate YAML mapping keys.
const require = createRequire(import.meta.url);
const yaml = require(require.resolve('js-yaml', { paths: [path.dirname(require.resolve('astro/package.json'))] }));
const dir = 'src/data/articles';
const files = fs.readdirSync(dir).filter(file => file.endsWith('.md')).sort();
let base = process.env.ARCHITECTURE_BASE_SHA;
if (!base && process.env.GITHUB_EVENT_PATH) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  base = event.pull_request?.base?.sha;
}
const arg = process.argv.indexOf('--base-ref');
if (arg >= 0) base = process.argv[arg + 1];
let baseFiles;
if (base) {
  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { stdio: 'ignore' });
  } catch {
    // actions/checkout defaults to a shallow checkout. Fetch the immutable PR
    // base instead of skipping the new-article gate when its tree is absent.
    if (!/^[a-f0-9]{40}$/i.test(base)) throw new Error('Missing architecture base must be a full commit SHA');
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'inherit' });
  }
  baseFiles = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', base, '--', dir], { encoding: 'utf8' }).trim().split('\n'));
}
const records = [], failures = [];
for (const file of files) {
  const filePath = `${dir}/${file}`;
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  let data;
  try {
    if (!match) throw new Error('missing frontmatter');
    data = yaml.load(match[1]);
    if (!data || typeof data !== 'object') throw new Error('invalid frontmatter');
  } catch (error) { failures.push(`${file}: ${error.message}`); continue; }
  const body = text.slice(match[0].length);
  const slugger = new GithubSlugger();
  const sectionIds = new Set([...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => slugger.slug(match[1].replace(/[*`]/g, ''))));
  for (const match of body.matchAll(/\bid=["']([^"']+)["']/g)) sectionIds.add(match[1]);
  const adopted = data.contentType !== undefined || data.trust !== undefined;
  const isNew = baseFiles && !baseFiles.has(filePath);
  const errors = adopted || (isNew && !data.draft) ? validateArticleArchitecture(data, body, sectionIds) : [];
  if (adopted && data.draft) {
    // Drafts may have incomplete evidence but are never counted as publication PASS.
  } else for (const error of errors) failures.push(`${file}: ${error}`);
  const repeatedBodyBlocks = [...body.matchAll(/^##\s+(Research Brief|Key Takeaways|JoyLab .*Framework|JoyLab Compare Lens)\s*$/gm)].map(match => match[1]);
  const classification = adopted && !errors.length ? 'STRUCTURALLY_VALID_REVIEW_REQUIRED' : (repeatedBodyBlocks.length >= 3 ? 'REWRITE_CANDIDATE' : 'ENHANCE_CANDIDATE');
  records.push({ file, title: data.title, draft: !!data.draft, contentType: data.contentType ?? null,
    adoption: adopted ? 'declared' : 'legacy', classification, repeatedBodyBlocks,
    errors, semanticReview: 'pending', sourceVerification: 'pending' });
}
const outDir = 'qa-artifacts/article-architecture-v1';
fs.mkdirSync(outDir, { recursive: true });
const report = { architecture: '1.1', articles: records.length, published: records.filter(record => !record.draft).length,
  note: 'Structural checks only. Candidate classifications are not final editorial judgments or AdSense approval evidence.',
  failures, records };
fs.writeFileSync(`${outDir}/audit.json`, JSON.stringify(report, null, 2) + '\n');
console.log(`Article Architecture V1.1: ${records.length} articles; ${records.filter(record => record.adoption === 'legacy').length} legacy; ${failures.length} failures`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }

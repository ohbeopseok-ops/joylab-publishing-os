import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const siteOrigin = 'https://aijoylab.kr';
const key = '1793952a193325da594f7015ca133737';
const keyLocation = `${siteOrigin}/${key}.txt`;
const endpoint = 'https://api.indexnow.org/indexnow';
const outputDir = path.join(root, 'qa-artifacts/indexnow');
const args = process.argv.slice(2);

const has = (name) => args.includes(name);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

function slugFromFile(file) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    const text = fs.readFileSync(full, 'utf8');
    const match = text.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m);
    if (match?.[1]) return match[1].trim().replace(/^\/+|\/+$/g, '');
  }
  return path.basename(file, path.extname(file));
}

function articleFilesFromDiff(from, to) {
  if (!from || !to || /^0+$/.test(from)) return [];
  const output = execFileSync('git', ['diff', '--name-only', from, to, '--', 'src/data/articles'], { encoding: 'utf8' });
  return output.split(/\r?\n/).map((item) => item.trim()).filter((item) => item.endsWith('.md'));
}

function allArticleFiles() {
  const dir = path.join(root, 'src/data/articles');
  return fs.readdirSync(dir).filter((name) => name.endsWith('.md')).map((name) => `src/data/articles/${name}`);
}

function buildUrls(files) {
  return [...new Set(files.map((file) => `${siteOrigin}/articles/${slugFromFile(file)}`))];
}

if (has('--self-test')) {
  const sample = buildUrls(['src/data/articles/example-article.md']);
  if (sample[0] !== `${siteOrigin}/articles/example-article`) throw new Error('IndexNow URL mapping self-test failed.');
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('IndexNow key format invalid.');
  console.log('IndexNow submitter self-test passed.');
  process.exit(0);
}

const files = has('--all')
  ? allArticleFiles()
  : articleFilesFromDiff(value('--from') || process.env.INDEXNOW_FROM, value('--to') || process.env.INDEXNOW_TO);
const urls = buildUrls(files);

fs.mkdirSync(outputDir, { recursive: true });

if (!urls.length) {
  const report = { submitted: false, reason: 'no_changed_articles', urls: [] };
  fs.writeFileSync(path.join(outputDir, 'indexnow-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('IndexNow: no changed article URLs to submit.');
  process.exit(0);
}

if (urls.length > 10000) throw new Error(`IndexNow batch too large: ${urls.length}`);

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: 'aijoylab.kr',
    key,
    keyLocation,
    urlList: urls
  })
});
const responseText = await response.text();
const accepted = response.status === 200 || response.status === 202;
const report = {
  submitted: accepted,
  status: response.status,
  statusText: response.statusText,
  pendingKeyVerification: response.status === 202,
  endpoint,
  keyLocation,
  urlCount: urls.length,
  urls,
  response: responseText.slice(0, 1000),
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(outputDir, 'indexnow-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`IndexNow ${response.status}: ${urls.length} URL(s) submitted${response.status === 202 ? ' (key verification pending)' : ''}.`);
if (!accepted) throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText} ${responseText}`);

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ARTICLE_DIR = 'src/data/articles';
const REQUIRED = ['author','reviewer','aiUsed','humanVerified','primarySources','contentPurpose','lastReviewed'];

const articleFiles = () => fs.readdirSync(ARTICLE_DIR)
  .filter((name) => name.endsWith('.md'))
  .map((name) => path.join(ARTICLE_DIR, name))
  .sort();

function changedArticleFiles() {
  const base = process.env.GITHUB_BASE_REF;
  if (!base) return [];
  const output = execFileSync('git', ['diff','--name-only',`origin/${base}...HEAD`,'--',`${ARTICLE_DIR}/*.md`], { encoding:'utf8' });
  return output.split(/\r?\n/).map((v)=>v.trim()).filter(Boolean);
}
function frontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const keys = new Set();
  const values = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    keys.add(m[1]); values.set(m[1], m[2].trim());
  }
  return { keys, values };
}
function audit(file) {
  const fm = frontmatter(fs.readFileSync(file,'utf8'));
  if (!fm) return { file, status:'BLOCK', reasons:['frontmatter 없음'] };
  const missing = REQUIRED.filter((key)=>!fm.keys.has(key));
  if (fm.values.get('aiUsed') === 'true' && !fm.keys.has('aiUsage')) missing.push('aiUsage');
  return missing.length
    ? { file, status:'MIGRATE', reasons:[...new Set(missing.map((x)=>`${x} 없음`))] }
    : { file, status:'READY', reasons:[] };
}
const mode = process.argv.includes('--strict') ? 'strict' : process.argv.includes('--changed') ? 'changed' : 'report';
const files = mode === 'changed' ? changedArticleFiles() : articleFiles();
const results = files.map(audit);
const notReady = results.filter((r)=>r.status !== 'READY');
console.log(`JoyLab Content Trust V1 · mode=${mode}`);
console.log(`audited=${results.length} ready=${results.length-notReady.length} migrate=${notReady.length}`);
for (const row of notReady) console.log(`- ${row.file}: ${row.reasons.join(', ')}`);
if ((mode === 'strict' || mode === 'changed') && notReady.length > 0) {
  console.error('CONTENT TRUST GATE: BLOCK'); process.exit(1);
}
console.log(mode === 'report' ? 'CONTENT TRUST AUDIT: REPORT ONLY' : 'CONTENT TRUST GATE: PASS');

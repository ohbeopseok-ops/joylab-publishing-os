import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const root = process.cwd();
export const articleDir = path.join(root, 'src/data/articles');
export const artifactDir = path.join(root, 'qa-artifacts/content-quality');

export function parseArticle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Invalid frontmatter: ${filePath}`);
  const fm = match[1];
  const body = match[2];
  const data = {};
  let activeArray = null;
  for (const line of fm.split(/\r?\n/)) {
    const arr = line.match(/^\s+-\s+(.+)$/);
    if (arr && activeArray) {
      data[activeArray].push(unquote(arr[1].trim()));
      continue;
    }
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    const value = rawValue.trim();
    activeArray = null;
    if (value === '') {
      data[key] = [];
      activeArray = key;
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else {
      data[key] = unquote(value);
    }
  }
  return {
    filePath,
    slug: path.basename(filePath, '.md'),
    raw,
    body,
    data
  };
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

export function articleFiles({ changedOnly = false } = {}) {
  if (!changedOnly) {
    return fs.readdirSync(articleDir).filter((x) => x.endsWith('.md')).map((x) => path.join(articleDir, x));
  }
  let names = [];
  try {
    names = execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'], { encoding: 'utf8' })
      .split(/\r?\n/)
      .filter((x) => x.startsWith('src/data/articles/') && x.endsWith('.md'));
  } catch {}
  return names.map((x) => path.join(root, x)).filter(fs.existsSync);
}

export const count = (text, re) => [...text.matchAll(re)].length;
export const headings = (body) => body.match(/^##+\s+.+$/gm) ?? [];
export const internalLinks = (body) => [...body.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g)].map((m) => m[1]);
export const externalLinks = (body) => [...body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
export const tables = (body) => count(body, /^\|.+\|$/gm);
export const bullets = (body) => count(body, /^\s*[-*]\s+/gm) + count(body, /^\s*\d+\.\s+/gm);
export const blockquotes = (body) => count(body, /^>\s+/gm);

export function hardGate(article) {
  const errors = [];
  for (const field of ['title', 'description', 'author', 'publishedAt']) {
    if (!article.data[field] || String(article.data[field]).trim() === '') errors.push(`missing:${field}`);
  }
  for (const href of internalLinks(article.body).filter((x) => x.startsWith('/articles/'))) {
    const slug = href.replace(/^\/articles\//, '').replace(/\/$/, '').split(/[?#]/)[0];
    if (slug && !fs.existsSync(path.join(articleDir, `${slug}.md`))) errors.push(`broken-article-link:${href}`);
  }
  return errors;
}

export function band(score, config) {
  const t = config.thresholds;
  if (score >= t.gold) return 'GOLD';
  if (score >= t.pass) return 'PASS';
  if (score >= t.review) return 'REVIEW';
  if (score >= t.hold) return 'HOLD';
  return 'FAIL';
}

export function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(root, 'config/quality-gate.json'), 'utf8'));
}

export function ensureArtifacts() {
  fs.mkdirSync(artifactDir, { recursive: true });
}

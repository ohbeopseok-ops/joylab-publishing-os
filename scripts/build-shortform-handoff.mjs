import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function unquote(value = '') {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return {meta: {}, body: raw};
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return {meta: {}, body: raw};

  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const meta = {};

  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) continue;
    meta[match[1]] = unquote(match[2]);
  }

  return {meta, body};
}

function cleanMarkdown(text) {
  return text
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[\*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveArticles() {
  const explicit = valueAfter('--article');
  if (explicit) return [explicit];

  const changedFrom = valueAfter('--changed-from');
  if (!changedFrom) {
    throw new Error('Use --article <path> or --changed-from <git-sha>.');
  }

  const output = execFileSync(
    'git',
    ['diff', '--name-only', changedFrom + '...HEAD', '--', 'src/data/articles'],
    {encoding: 'utf8'}
  );

  return output
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.endsWith('.md'));
}

function handoffFor(articlePath) {
  const absolute = path.resolve(root, articlePath);
  if (!fs.existsSync(absolute)) return null;

  const raw = fs.readFileSync(absolute, 'utf8');
  const {meta, body} = splitFrontmatter(raw);
  const slug = path.basename(articlePath, path.extname(articlePath));
  const excerpt = cleanMarkdown(body).slice(0, 1800);

  return {
    contractVersion: '1.0',
    kind: 'joylab.shortform.handoff',
    createdAt: new Date().toISOString(),
    source: {
      repository: 'ohbeopseok-ops/joylab-publishing-os',
      path: articlePath.replaceAll('\\', '/'),
      slug,
      title: meta.title || slug,
      description: meta.description || meta.excerpt || '',
      publishedAt: meta.publishedAt || meta.date || null,
      updatedAt: meta.updatedAt || null,
      excerpt
    },
    targets: [
      {id: 'hook-20', angle: 'hook', targetDuration: 20},
      {id: 'explain-40', angle: 'explain', targetDuration: 40},
      {id: 'insight-60', angle: 'insight', targetDuration: 60}
    ],
    brand: {
      name: 'JOYLAB',
      theme: 'deep-navy-electric-blue',
      tagline: '생각을 분석하고, 분석을 실행으로.'
    },
    generation: {
      engine: 'joylab-shortform-engine',
      status: 'ready_for_editorial_engine',
      requireHumanApproval: true
    }
  };
}

const articles = resolveArticles();
const outDir = path.resolve(
  root,
  valueAfter('--out-dir') || '.artifacts/shortform-handoff'
);
fs.mkdirSync(outDir, {recursive: true});

const written = [];
for (const articlePath of articles) {
  const handoff = handoffFor(articlePath);
  if (!handoff) continue;
  const file = path.join(outDir, handoff.source.slug + '.json');
  fs.writeFileSync(file, JSON.stringify(handoff, null, 2) + '\n', 'utf8');
  written.push(path.relative(root, file));
}

if (written.length === 0) {
  console.log('SHORTFORM_HANDOFF=NO_ARTICLE_CHANGES');
  process.exit(0);
}

for (const file of written) {
  console.log('SHORTFORM_HANDOFF=' + file);
}

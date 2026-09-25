import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config/internal-link-clusters.json');
const articlesDir = path.join(root, 'src/data/articles');

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const errors = [];

function extractSeries(content) {
  const match = content.match(/^series:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1].trim() : null;
}

function isDraft(content) {
  return /^draft:\s*true\s*$/m.test(content);
}

for (const cluster of config.clusters ?? []) {
  if (!exists(cluster.pillarSource)) {
    errors.push(`[${cluster.name}] missing pillar source: ${cluster.pillarSource}`);
    continue;
  }
  if (!exists(cluster.parentSource)) {
    errors.push(`[${cluster.name}] missing parent source: ${cluster.parentSource}`);
    continue;
  }

  const pillar = read(cluster.pillarSource);
  const parent = read(cluster.parentSource);

  if (!parent.includes(cluster.pillarRoute)) {
    errors.push(`[${cluster.name}] parent guide must link to ${cluster.pillarRoute}`);
  }

  const seriesArticles = fs.readdirSync(articlesDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      return extractSeries(content) === cluster.series;
    })
    .map((file) => file.replace(/\.md$/, ''));

  const articleIds = [...new Set([...(cluster.requiredArticles ?? []), ...seriesArticles])].sort();

  for (const id of articleIds) {
    const source = `src/data/articles/${id}.md`;
    if (!exists(source)) {
      errors.push(`[${cluster.name}] missing article source: ${source}`);
      continue;
    }

    const article = read(source);
    const articleRoute = `/articles/${id}`;

    if (isDraft(article)) {
      errors.push(`[${cluster.name}] required article ${id} must be published, not draft`);
    }

    if (!article.includes(cluster.pillarRoute)) {
      errors.push(`[${cluster.name}] article ${id} must backlink to ${cluster.pillarRoute}`);
    }

    if (!pillar.includes(articleRoute)) {
      errors.push(`[${cluster.name}] pillar must contain the live article route: ${articleRoute}`);
    }
  }
}

if (errors.length) {
  console.error('\nInternal link cluster check FAILED\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Internal link cluster check passed.');

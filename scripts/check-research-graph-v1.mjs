import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const graphPath = path.join(root, 'config/research-graph-ai-power-v1.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

const errors = [];
const warnings = [];
const nodeIds = new Set();
const articleIds = new Set();
const urls = new Set();

const error = (code, message) => errors.push({ code, message });
const warn = (code, message) => warnings.push({ code, message });

if (graph.contract !== 'JoyLab.ResearchGraph') error('CONTRACT', 'contract must equal JoyLab.ResearchGraph');
if (!/^\d+\.\d+\.\d+$/.test(graph.version ?? '')) error('VERSION', 'version must be semver');

for (const node of graph.nodes ?? []) {
  if (!node.id || !node.type || !node.label) error('NODE_REQUIRED', JSON.stringify(node));
  if (nodeIds.has(node.id)) error('DUPLICATE_NODE_ID', node.id);
  nodeIds.add(node.id);
}

for (const article of graph.articles ?? []) {
  if (articleIds.has(article.id)) error('DUPLICATE_ARTICLE_ID', article.id);
  articleIds.add(article.id);
  if (urls.has(article.url)) error('DUPLICATE_URL', article.url);
  urls.add(article.url);
  if (!nodeIds.has(article.id)) error('ARTICLE_NODE_MISSING', article.id);
  if (article.pillar !== graph.pillar.id) error('INVALID_PILLAR', article.id);
  if (!Array.isArray(article.topics) || article.topics.length === 0) error('TOPICS_EMPTY', article.id);
  for (const topic of article.topics ?? []) {
    if (!nodeIds.has(topic)) error('UNKNOWN_TOPIC', `${article.id} -> ${topic}`);
  }
  if (article.previous && !graph.articles.some((item) => item.id === article.previous)) error('INVALID_PREVIOUS', `${article.id} -> ${article.previous}`);
  if (article.next && !graph.articles.some((item) => item.id === article.next)) error('INVALID_NEXT', `${article.id} -> ${article.next}`);

  if (article.status === 'published' && article.url.startsWith('/articles/')) {
    const slug = article.url.slice('/articles/'.length);
    const mdPath = path.join(root, 'src/data/articles', `${slug}.md`);
    if (!fs.existsSync(mdPath)) error('ARTICLE_FILE_MISSING', `${article.id}: ${mdPath}`);
  }

  const pillarEdge = (graph.edges ?? []).some((edge) =>
    edge.type === 'belongs_to' && edge.from === article.id && edge.to === graph.pillar.id
  );
  if (article.status === 'published' && !pillarEdge) error('PILLAR_BACKLINK_MISSING', article.id);
}

for (const edge of graph.edges ?? []) {
  if (!nodeIds.has(edge.from)) error('EDGE_FROM_MISSING', `${edge.from} -> ${edge.to}`);
  if (!nodeIds.has(edge.to)) error('EDGE_TO_MISSING', `${edge.from} -> ${edge.to}`);
}

const ordered = [...(graph.articles ?? [])].filter((a) => Number.isInteger(a.order)).sort((a,b) => a.order - b.order);
for (let i = 0; i < ordered.length; i++) {
  const current = ordered[i];
  const expectedPrevious = i === 0 ? null : ordered[i - 1].id;
  const expectedNext = i === ordered.length - 1 ? null : ordered[i + 1].id;
  if ((current.previous ?? null) !== expectedPrevious) error('PREVIOUS_ORDER_MISMATCH', current.id);
  if ((current.next ?? null) !== expectedNext) error('NEXT_ORDER_MISMATCH', current.id);
}

for (const article of graph.articles ?? []) {
  const shared = graph.articles.filter((other) =>
    other.id !== article.id && other.topics?.some((topic) => article.topics?.includes(topic))
  );
  if (shared.length < 1) warn('RELATED_RESEARCH_THIN', `${article.id}: no topic-overlap article`);
}

const pillarPage = path.join(root, 'src/pages/guides/ai-power-infrastructure.astro');
if (!fs.existsSync(pillarPage)) error('PILLAR_PAGE_MISSING', pillarPage);

for (const item of warnings) console.warn(`⚠️ [${item.code}] ${item.message}`);
for (const item of errors) console.error(`❌ [${item.code}] ${item.message}`);

if (errors.length) {
  console.error(`\nResearch Graph Gate FAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`✅ Research Graph Gate PASS · ${graph.nodes.length} nodes · ${graph.edges.length} edges · ${graph.articles.length} articles · ${warnings.length} warning(s)`);

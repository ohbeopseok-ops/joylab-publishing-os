import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const graphPath = path.join(root, 'config/research-graph-ai-power-v1.json');
const schemaPath = path.join(root, 'config/research-graph-ai-power-v1.schema.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const errors = [];
const warnings = [];
const nodeIds = new Set();
const articleIds = new Set();
const urls = new Set();

const allowedNodeTypes = new Set(schema.$defs.node.properties.type.enum);
const allowedEdgeTypes = new Set(schema.$defs.edge.properties.type.enum);
const allowedStages = new Set(schema.$defs.article.properties.stage.enum);
const allowedStatuses = new Set(schema.$defs.article.properties.status.enum);

const error = (code, message) => errors.push({ code, message });
const warn = (code, message) => warnings.push({ code, message });

if (graph.contract !== 'JoyLab.ResearchGraph') error('CONTRACT', 'contract must equal JoyLab.ResearchGraph');
if (!/^\d+\.\d+\.\d+$/.test(graph.version ?? '')) error('VERSION', 'version must be semver');
if (!graph.pillar?.id || !graph.pillar?.title || !graph.pillar?.url) error('PILLAR_REQUIRED', 'pillar id/title/url are required');
if (graph.pillar?.domain !== 'investing') error('PILLAR_DOMAIN', 'pillar.domain must equal investing');
if (!allowedStatuses.has(graph.pillar?.status)) error('PILLAR_STATUS', String(graph.pillar?.status));

for (const node of graph.nodes ?? []) {
  if (!node.id || !node.type || !node.label) error('NODE_REQUIRED', JSON.stringify(node));
  if (!allowedNodeTypes.has(node.type)) error('NODE_TYPE', `${node.id}: ${node.type}`);
  if (nodeIds.has(node.id)) error('DUPLICATE_NODE_ID', node.id);
  nodeIds.add(node.id);

  if (node.type === 'company' && (!node.ticker || !node.market)) {
    warn('COMPANY_SECURITY_METADATA_MISSING', node.id);
  }
}

for (const article of graph.articles ?? []) {
  if (!article.id || !article.title || !article.url) error('ARTICLE_REQUIRED', JSON.stringify(article));
  if (!allowedStages.has(article.stage)) error('ARTICLE_STAGE', `${article.id}: ${article.stage}`);
  if (!allowedStatuses.has(article.status)) error('ARTICLE_STATUS', `${article.id}: ${article.status}`);
  if (articleIds.has(article.id)) error('DUPLICATE_ARTICLE_ID', article.id);
  articleIds.add(article.id);

  if (urls.has(article.url)) error('DUPLICATE_URL', article.url);
  urls.add(article.url);

  if (!nodeIds.has(article.id)) error('ARTICLE_NODE_MISSING', article.id);
  if (article.pillar !== graph.pillar.id) error('INVALID_PILLAR', article.id);
  if (!Array.isArray(article.topics) || article.topics.length === 0) error('TOPICS_EMPTY', article.id);
  if (new Set(article.topics ?? []).size !== (article.topics ?? []).length) error('DUPLICATE_TOPIC', article.id);

  for (const topic of article.topics ?? []) {
    if (!nodeIds.has(topic)) error('UNKNOWN_TOPIC', `${article.id} -> ${topic}`);
  }

  if (article.previous && !graph.articles.some((item) => item.id === article.previous)) {
    error('INVALID_PREVIOUS', `${article.id} -> ${article.previous}`);
  }
  if (article.next && !graph.articles.some((item) => item.id === article.next)) {
    error('INVALID_NEXT', `${article.id} -> ${article.next}`);
  }

  if (article.status === 'published' && article.url.startsWith('/articles/')) {
    const slug = article.url.slice('/articles/'.length);
    const mdPath = path.join(root, 'src/data/articles', `${slug}.md`);
    if (!fs.existsSync(mdPath)) error('ARTICLE_FILE_MISSING', `${article.id}: ${mdPath}`);
  }

  const pillarEdge = (graph.edges ?? []).some((edge) =>
    edge.type === 'belongs_to' && edge.from === article.id && edge.to === graph.pillar.id
  );
  if (article.status === 'published' && !pillarEdge) error('PILLAR_BACKLINK_MISSING', article.id);

  const coveredTopics = new Set(
    (graph.edges ?? [])
      .filter((edge) => edge.type === 'covered_by' && edge.from === article.id)
      .map((edge) => edge.to)
  );
  const missingCoverage = (article.topics ?? []).filter((topic) => !coveredTopics.has(topic));
  if (missingCoverage.length) {
    warn('TOPIC_EDGE_COVERAGE_THIN', `${article.id}: ${missingCoverage.join(', ')}`);
  }
}

const edgeKeys = new Set();
for (const edge of graph.edges ?? []) {
  if (!allowedEdgeTypes.has(edge.type)) error('EDGE_TYPE', `${edge.from} -[${edge.type}]-> ${edge.to}`);
  if (!nodeIds.has(edge.from)) error('EDGE_FROM_MISSING', `${edge.from} -> ${edge.to}`);
  if (!nodeIds.has(edge.to)) error('EDGE_TO_MISSING', `${edge.from} -> ${edge.to}`);

  const key = `${edge.from}|${edge.type}|${edge.to}`;
  if (edgeKeys.has(key)) error('DUPLICATE_EDGE', key);
  edgeKeys.add(key);
}

const publishedOrdered = [...(graph.articles ?? [])]
  .filter((article) => article.status === 'published' && Number.isInteger(article.order))
  .sort((a, b) => a.order - b.order);

const seenOrders = new Set();
for (let i = 0; i < publishedOrdered.length; i++) {
  const current = publishedOrdered[i];
  if (seenOrders.has(current.order)) error('DUPLICATE_ORDER', String(current.order));
  seenOrders.add(current.order);

  const expectedPrevious = i === 0 ? null : publishedOrdered[i - 1].id;
  const expectedNext = i === publishedOrdered.length - 1 ? null : publishedOrdered[i + 1].id;

  if ((current.previous ?? null) !== expectedPrevious) error('PREVIOUS_ORDER_MISMATCH', current.id);
  if ((current.next ?? null) !== expectedNext) error('NEXT_ORDER_MISMATCH', current.id);

  if (expectedPrevious) {
    const previousEdge = (graph.edges ?? []).some((edge) =>
      edge.type === 'previous' && edge.from === current.id && edge.to === expectedPrevious
    );
    if (!previousEdge) error('PREVIOUS_EDGE_MISSING', `${current.id} -> ${expectedPrevious}`);
  }

  if (expectedNext) {
    const nextEdge = (graph.edges ?? []).some((edge) =>
      edge.type === 'next' && edge.from === current.id && edge.to === expectedNext
    );
    if (!nextEdge) error('NEXT_EDGE_MISSING', `${current.id} -> ${expectedNext}`);
  }
}

for (const article of graph.articles ?? []) {
  const shared = graph.articles.filter((other) =>
    other.id !== article.id &&
    other.status === 'published' &&
    other.topics?.some((topic) => article.topics?.includes(topic))
  );
  if (article.status === 'published' && shared.length < 1) {
    warn('RELATED_RESEARCH_THIN', `${article.id}: no topic-overlap published article`);
  }
}

const pillarPage = path.join(root, 'src/pages/guides/ai-power-infrastructure.astro');
if (!fs.existsSync(pillarPage)) error('PILLAR_PAGE_MISSING', pillarPage);
else {
  const source = fs.readFileSync(pillarPage, 'utf8');
  if (!source.includes('<AiPowerResearchMap />')) error('RESEARCH_MAP_NOT_WIRED', 'Pillar page must render AiPowerResearchMap');
}

const graphMapComponent = path.join(root, 'src/components/AiPowerResearchMap.astro');
if (!fs.existsSync(graphMapComponent)) error('GRAPH_MAP_COMPONENT_MISSING', graphMapComponent);

const graphNavComponent = path.join(root, 'src/components/AiPowerResearchNav.astro');
if (!fs.existsSync(graphNavComponent)) error('GRAPH_NAV_COMPONENT_MISSING', graphNavComponent);

const articleRoute = path.join(root, 'src/pages/articles/[...slug].astro');
if (!fs.existsSync(articleRoute)) {
  error('ARTICLE_ROUTE_MISSING', articleRoute);
} else {
  const articleRouteSource = fs.readFileSync(articleRoute, 'utf8');
  if (!articleRouteSource.includes('<AiPowerResearchNav articleId={article.id} />')) {
    error('GRAPH_NAV_NOT_WIRED', 'AiPowerResearchNav must be rendered with articleId={article.id} by the article route');
  }
}

for (const item of warnings) console.warn(`⚠️ [${item.code}] ${item.message}`);
for (const item of errors) console.error(`❌ [${item.code}] ${item.message}`);

if (errors.length) {
  console.error(`\nResearch Graph Gate FAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(
  `✅ Research Graph Gate PASS · ${graph.nodes.length} nodes · ${graph.edges.length} edges · ${graph.articles.length} articles · ${warnings.length} warning(s)`
);

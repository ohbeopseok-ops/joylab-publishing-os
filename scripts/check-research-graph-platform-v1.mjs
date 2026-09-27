import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'config/research-graph-platform-v1.json');
const schemaPath = path.join(root, 'config/research-graph-v1.schema.json');
const templatePath = path.join(root, 'config/research-graph-template-v1.json');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const errors = [];
const warnings = [];

const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const allowedNodeTypes = new Set(schema.$defs.node.properties.type.enum);
const allowedEdgeTypes = new Set(schema.$defs.edge.properties.type.enum);
const allowedStages = new Set(schema.$defs.article.properties.stage.enum);
const allowedStatuses = new Set(schema.$defs.article.properties.status.enum);

if (registry.contract !== 'JoyLab.ResearchGraphPlatform') fail('invalid platform contract');
if (!/^\d+\.\d+\.\d+$/.test(registry.version ?? '')) fail('platform version must be semver');
if (!fs.existsSync(path.join(root, registry.mapComponent))) fail('map component missing: ' + registry.mapComponent);
if (!fs.existsSync(templatePath)) fail('graph template missing');
if (!fs.existsSync(schemaPath)) fail('shared graph schema missing');

const ids = new Set();

for (const vertical of registry.verticals ?? []) {
  if (!vertical.id || !vertical.label || !vertical.status || !vertical.pillar) {
    fail('vertical required fields missing: ' + JSON.stringify(vertical));
    continue;
  }
  if (ids.has(vertical.id)) fail('duplicate vertical id: ' + vertical.id);
  ids.add(vertical.id);

  if (!['active', 'template_ready'].includes(vertical.status)) fail('invalid vertical status: ' + vertical.id);
  if (vertical.domain !== 'investing') fail('vertical domain must be investing: ' + vertical.id);
  if (vertical.status !== 'active') continue;

  if (!vertical.graph) {
    fail('active vertical graph missing: ' + vertical.id);
    continue;
  }

  const graphPath = path.join(root, vertical.graph);
  if (!fs.existsSync(graphPath)) {
    fail('active graph file missing: ' + vertical.graph);
    continue;
  }

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  if (graph.contract !== 'JoyLab.ResearchGraph') fail('invalid graph contract: ' + vertical.id);
  if (!/^\d+\.\d+\.\d+$/.test(graph.version ?? '')) fail('graph version must be semver: ' + vertical.id);
  if (graph.pillar?.url !== vertical.pillar) fail('pillar URL mismatch: ' + vertical.id);
  if (graph.pillar?.domain !== 'investing') fail('graph pillar domain mismatch: ' + vertical.id);
  if (!allowedStatuses.has(graph.pillar?.status)) fail('invalid pillar status: ' + vertical.id);
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || !Array.isArray(graph.articles)) {
    fail('graph collections missing: ' + vertical.id);
    continue;
  }

  const nodeIds = new Set();
  for (const node of graph.nodes) {
    if (!node.id || !node.type || !node.label) fail(`${vertical.id}: node required fields missing`);
    if (!allowedNodeTypes.has(node.type)) fail(`${vertical.id}: invalid node type ${node.id}=${node.type}`);
    if (nodeIds.has(node.id)) fail(`${vertical.id}: duplicate node id ${node.id}`);
    nodeIds.add(node.id);
  }

  const edgeKeys = new Set();
  for (const edge of graph.edges) {
    if (!allowedEdgeTypes.has(edge.type)) fail(`${vertical.id}: invalid edge type ${edge.type}`);
    if (!nodeIds.has(edge.from)) fail(`${vertical.id}: edge source missing ${edge.from}`);
    if (!nodeIds.has(edge.to)) fail(`${vertical.id}: edge target missing ${edge.to}`);
    const key = `${edge.from}|${edge.type}|${edge.to}`;
    if (edgeKeys.has(key)) fail(`${vertical.id}: duplicate edge ${key}`);
    edgeKeys.add(key);
  }

  const ordered = [...graph.articles]
    .filter((a) => a.status === 'published')
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  for (let i = 0; i < ordered.length; i++) {
    const article = ordered[i];
    if (!nodeIds.has(article.id)) fail(`${vertical.id}: article node missing ${article.id}`);
    if (!allowedStages.has(article.stage)) fail(`${vertical.id}: invalid article stage ${article.id}`);
    if (!allowedStatuses.has(article.status)) fail(`${vertical.id}: invalid article status ${article.id}`);
    if (article.pillar !== graph.pillar.id) fail(`${vertical.id}: invalid article pillar ${article.id}`);
    if (!Array.isArray(article.topics) || article.topics.length === 0) fail(`${vertical.id}: empty article topics ${article.id}`);

    for (const topic of article.topics ?? []) {
      if (!nodeIds.has(topic)) fail(`${vertical.id}: unknown topic ${article.id} -> ${topic}`);
    }

    if (article.url?.startsWith('/articles/')) {
      const slug = article.url.slice('/articles/'.length);
      const mdPath = path.join(root, 'src/data/articles', slug + '.md');
      if (!fs.existsSync(mdPath)) fail(`${vertical.id}: published article file missing ${slug}`);
    }

    const belongs = graph.edges.some((e) => e.type === 'belongs_to' && e.from === article.id && e.to === graph.pillar.id);
    if (!belongs) fail(`${vertical.id}: belongs_to edge missing ${article.id}`);

    const expectedPrevious = i === 0 ? null : ordered[i - 1].id;
    const expectedNext = i === ordered.length - 1 ? null : ordered[i + 1].id;
    if ((article.previous ?? null) !== expectedPrevious) fail(`${vertical.id}: previous mismatch ${article.id}`);
    if ((article.next ?? null) !== expectedNext) fail(`${vertical.id}: next mismatch ${article.id}`);

    if (expectedPrevious && !graph.edges.some((e) => e.type === 'previous' && e.from === article.id && e.to === expectedPrevious)) {
      fail(`${vertical.id}: previous edge missing ${article.id}`);
    }
    if (expectedNext && !graph.edges.some((e) => e.type === 'next' && e.from === article.id && e.to === expectedNext)) {
      fail(`${vertical.id}: next edge missing ${article.id}`);
    }
  }

  const pillarSource = path.join(root, 'src/pages', vertical.pillar.replace(/^\//, '') + '.astro');
  if (!fs.existsSync(pillarSource)) {
    fail(`${vertical.id}: pillar source missing ${pillarSource}`);
  } else {
    const source = fs.readFileSync(pillarSource, 'utf8');
    if (!source.includes('ResearchGraphMap')) fail(`${vertical.id}: shared ResearchGraphMap not wired into pillar`);
    const graphFilename = path.basename(vertical.graph);
    if (!source.includes(graphFilename)) warn(`${vertical.id}: pillar does not import graph filename directly`);
  }
}

for (const expected of ['ai-power', 'semiconductor', 'financials', 'shipbuilding']) {
  if (!ids.has(expected)) fail('required vertical missing: ' + expected);
}

for (const item of warnings) console.warn('⚠️ ' + item);
if (errors.length) {
  for (const e of errors) console.error('❌ ' + e);
  console.error('\nResearch Graph Platform V1 FAILED: ' + errors.length + ' error(s)');
  process.exit(1);
}

const activeCount = (registry.verticals ?? []).filter((v) => v.status === 'active').length;
console.log(`✅ Research Graph Platform V1 PASS · ${registry.verticals.length} verticals · ${activeCount} active · ${registry.version} · ${warnings.length} warning(s)`);

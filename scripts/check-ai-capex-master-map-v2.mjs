import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const master = JSON.parse(fs.readFileSync(path.join(root, 'config/ai-capex-master-map-v2.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'config/research-graph-platform-v1.json'), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if (master.contract !== 'JoyLab.AICapexMasterMap') fail('invalid master map contract');
if (master.version !== '2.0.0') fail('master map version must be 2.0.0');

const verticalById = new Map((registry.verticals ?? []).map((v) => [v.id, v]));
const graphCache = new Map();

function resolve(ref) {
  const splitAt = ref.indexOf(':');
  if (splitAt <= 0) return null;
  const verticalId = ref.slice(0, splitAt);
  const nodeId = ref.slice(splitAt + 1);
  const vertical = verticalById.get(verticalId);
  if (!vertical?.graph) return null;
  if (!graphCache.has(verticalId)) {
    const file = path.join(root, vertical.graph);
    if (!fs.existsSync(file)) return null;
    graphCache.set(verticalId, JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  const graph = graphCache.get(verticalId);
  const node = graph.nodes?.find((item) => item.id === nodeId);
  return node ? { verticalId, node } : null;
}

for (const vertical of master.sourceVerticals ?? []) {
  if (!verticalById.has(vertical)) fail('unknown source vertical: ' + vertical);
}

for (const branch of master.branches ?? []) {
  if (!branch.id || !branch.label) fail('branch required fields missing');
  if (!Array.isArray(branch.path) || branch.path.length < 2) fail(branch.id + ': path requires at least 2 refs');
  if (!Array.isArray(branch.companies) || branch.companies.length < 1) fail(branch.id + ': company refs missing');
  for (const ref of [...(branch.path ?? []), ...(branch.companies ?? [])]) {
    if (!resolve(ref)) fail(branch.id + ': unresolved ref ' + ref);
  }
  for (const ref of branch.companies ?? []) {
    const resolved = resolve(ref);
    if (resolved?.node.type !== 'company') fail(branch.id + ': company ref is not company ' + ref);
  }
}

for (const edge of master.crossEdges ?? []) {
  if (!resolve(edge.from)) fail('cross edge source unresolved: ' + edge.from);
  if (!resolve(edge.to)) fail('cross edge target unresolved: ' + edge.to);
  if (!edge.type || !edge.label) fail('cross edge metadata missing');
}

const page = fs.readFileSync(path.join(root, 'src/pages/research-map.astro'), 'utf8');
if (!page.includes('AiCapexMasterMap')) fail('research-map must render AiCapexMasterMap');

if (errors.length) {
  for (const error of errors) console.error('❌ ' + error);
  console.error('\nAI CAPEX Master Map V2 FAILED: ' + errors.length + ' error(s)');
  process.exit(1);
}

console.log('✅ AI CAPEX Master Map V2 PASS · ' + master.branches.length + ' branches · ' + master.crossEdges.length + ' cross edges');

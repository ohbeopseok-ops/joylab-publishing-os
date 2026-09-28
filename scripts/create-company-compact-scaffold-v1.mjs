import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const specPath = arg('--spec');
const dryRun = args.includes('--dry-run');

if (!specPath) {
  console.error('Usage: npm run company-compact:scaffold -- --spec <spec.json> [--dry-run]');
  process.exit(1);
}

const root = process.cwd();
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(root, p), 'utf8'));
const exists = async (p) => fs.access(path.join(root, p)).then(() => true).catch(() => false);
const kebab = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const camel = (value) => kebab(value).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const spec = JSON.parse(await fs.readFile(path.resolve(root, specPath), 'utf8'));
const required = ['key','articleId','companyName','eyebrow','description','hubHref','hubLabel','reason','nodes','signalNode','signalId'];
for (const field of required) {
  if (spec[field] == null || spec[field] === '') throw new Error('Missing required field: ' + field);
}

spec.key = kebab(spec.key);
if (!/^[a-z0-9-]+$/.test(spec.key)) throw new Error('Invalid key');
if (!/^[a-z0-9-]+$/.test(spec.articleId)) throw new Error('Invalid articleId');
if (!String(spec.hubHref).startsWith('/guides/')) throw new Error('hubHref must start with /guides/');
if (!Array.isArray(spec.nodes) || spec.nodes.length !== 4) throw new Error('nodes must contain exactly 4 primary nodes');

const ids = spec.nodes.map((node) => node.id);
if (new Set(ids).size !== 4 || ids.some((id) => !/^[a-z0-9-]+$/.test(id))) throw new Error('node ids must be unique kebab-case');
const signalNode = spec.nodes.find((node) => node.id === spec.signalNode);
if (!signalNode) throw new Error('signalNode must match one of the 4 primary nodes');
if (!Array.isArray(signalNode.signals) || signalNode.signals.length !== 3) throw new Error('signalNode must define exactly 3 signals');
if (!signalNode.signals.some((signal) => signal.id === spec.signalId)) throw new Error('signalId must exist inside signalNode.signals');

for (const node of spec.nodes) {
  if (!node.label || !node.type) throw new Error('Every node requires id, label, type');
  if (node.signals) {
    if (!Array.isArray(node.signals) || node.signals.length !== 3) throw new Error('Any node with signals must define exactly 3 signals');
    for (const signal of node.signals) {
      if (!signal.id || !signal.label || !signal.note) throw new Error('Every signal requires id, label, note');
    }
  }
}

const articlePath = `src/data/articles/${spec.articleId}.md`;
if (!(await exists(articlePath))) throw new Error('Article source does not exist: ' + articlePath);

const graphPath = `config/research-graph-${spec.key}-compact-v1.json`;
if (await exists(graphPath)) throw new Error('Refusing to overwrite existing graph: ' + graphPath);

const targetPath = '/articles/' + spec.articleId;
const primaryFlow = ids;
const graphVar = camel(spec.key) + 'CompactGraph';
const title = spec.nodes.map((node) => node.label).join(' → ');

const edges = [];
for (let i = 0; i < primaryFlow.length - 1; i++) {
  edges.push({
    from: primaryFlow[i],
    to: primaryFlow[i + 1],
    type: i === primaryFlow.length - 2 ? 'valued_by' : (i === 1 ? 'drives_earnings' : 'drives')
  });
}
const articleNodeId = 'article-' + spec.articleId;
edges.push({ from: articleNodeId, to: primaryFlow[1], type: 'covered_by' });
edges.push({ from: articleNodeId, to: primaryFlow[2], type: 'covered_by' });

const graph = {
  contract: 'JoyLab.ResearchGraphCompact',
  version: '1.0.0',
  pillar: {
    id: spec.articleId,
    title: spec.companyName + ' Compact Thesis',
    url: targetPath,
    domain: 'investing',
    status: 'published'
  },
  nodes: spec.nodes,
  edges,
  articles: [{
    id: articleNodeId,
    title: spec.companyName,
    url: targetPath,
    status: 'published'
  }]
};

const registryPath = 'src/config/companyCompactResearch.ts';
let registry = await fs.readFile(path.join(root, registryPath), 'utf8');
if (registry.includes(`'${spec.articleId}':`)) throw new Error('Registry already contains article: ' + spec.articleId);
if (registry.includes(`import ${graphVar} `)) throw new Error('Registry import already exists: ' + graphVar);

const importLine = `import ${graphVar} from '../../${graphPath}';\n`;
const exportMarker = '\nexport const companyCompactResearch = {';
if (!registry.includes(exportMarker)) throw new Error('Registry export marker not found');
registry = registry.replace(exportMarker, '\n' + importLine + exportMarker.trimStart());

const registryEntry = `  '${spec.articleId}': {
    graph: ${graphVar},
    eyebrow: ${JSON.stringify(spec.eyebrow)},
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(spec.description)},
    hubHref: ${JSON.stringify(spec.hubHref)},
    hubLabel: ${JSON.stringify(spec.hubLabel)},
    primaryFlow: ${JSON.stringify(primaryFlow)}
  }`;

const closeMarker = '\n} as const;';
const closeIndex = registry.indexOf(closeMarker);
if (closeIndex < 0) throw new Error('Registry close marker not found');
const beforeClose = registry.slice(0, closeIndex).trimEnd();
registry = beforeClose + ',\n' + registryEntry + registry.slice(closeIndex);

const displayPath = 'config/research-graph-display-modes-v1.json';
const display = await readJson(displayPath);
if ((display.currentCompactArticles || []).some((item) => item.path === targetPath)) throw new Error('Display modes already contain: ' + targetPath);
display.currentCompactArticles = display.currentCompactArticles || [];
display.currentCompactArticles.push({ path: targetPath, mode: 'compact', reason: spec.reason });

const targetsPath = 'config/company-compact-targets-v1.json';
const targets = await readJson(targetsPath);
if (targets.targets.some((item) => item.articleId === spec.articleId || item.graphKey === spec.key)) throw new Error('Target contract already contains article/key');
targets.targets.push({
  graphKey: spec.key,
  name: spec.key,
  articleId: spec.articleId,
  path: targetPath,
  signalNode: spec.signalNode,
  signalId: spec.signalId,
  expectedHub: spec.hubHref
});

const writes = [
  [graphPath, JSON.stringify(graph, null, 2) + '\n'],
  [registryPath, registry],
  [displayPath, JSON.stringify(display, null, 2) + '\n'],
  [targetsPath, JSON.stringify(targets, null, 2) + '\n']
];

console.log('Company Compact Scaffold V1');
console.log('Article:', spec.articleId);
console.log('Graph:', graphPath);
console.log('Thesis:', title);
console.log('Hub:', spec.hubHref);
console.log('Signal:', spec.signalNode, '→', spec.signalId);
console.log('Files:', writes.map(([p]) => p).join(', '));

if (dryRun) {
  console.log('DRY RUN · no files written');
  process.exit(0);
}

for (const [file, content] of writes) {
  await fs.writeFile(path.join(root, file), content, 'utf8');
}
console.log('SCAFFOLD CREATED · run npm run company-compact:contract then npm run build');

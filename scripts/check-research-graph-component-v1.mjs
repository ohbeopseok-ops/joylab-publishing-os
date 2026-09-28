import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const graphPath = path.join(root, 'config/research-graph-ai-component-infrastructure-v1.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
const errors = [];
const fail = (m) => errors.push(m);

const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
const edges = graph.edges ?? [];
const companies = graph.nodes.filter((node) => node.type === 'company');

if (graph.pillar?.id !== 'ai-component-infrastructure') fail('invalid component pillar id');
if (companies.length < 4) fail('component graph requires at least 4 company nodes');

const tickers = new Set();
for (const company of companies) {
  if (!company.ticker) fail(company.id + ': ticker missing');
  if (tickers.has(company.ticker)) fail(company.id + ': duplicate ticker ' + company.ticker);
  tickers.add(company.ticker);

  const incomingProduct = edges.some((e) =>
    e.to === company.id &&
    ['value_chain','bottleneck','demand'].includes(nodes.get(e.from)?.type)
  );
  if (!incomingProduct) fail(company.id + ': upstream product/bottleneck edge missing');

  const hasKpi = edges.some((e) =>
    e.from === company.id && ['kpi','earnings'].includes(nodes.get(e.to)?.type)
  );
  if (!hasKpi) fail(company.id + ': KPI edge missing');

  const scoreSignal = (company.signals ?? []).some((signal) => /AI CAPEX Score \d+\/100/.test(signal.label ?? ''));
  if (!scoreSignal) fail(company.id + ': AI CAPEX score signal missing');
}

for (const edge of edges) {
  if (!nodes.has(edge.from)) fail('dangling source: ' + edge.from);
  if (!nodes.has(edge.to)) fail('dangling target: ' + edge.to);
}

const hasEarningsToValuation = edges.some((e) =>
  nodes.get(e.from)?.type === 'earnings' && nodes.get(e.to)?.type === 'valuation'
);
if (!hasEarningsToValuation) fail('earnings -> valuation edge missing');

const guidePath = path.join(root, 'src/pages/guides/ai-component-infrastructure.astro');
if (!fs.existsSync(guidePath)) fail('component guide missing');
else {
  const source = fs.readFileSync(guidePath, 'utf8');
  if (!source.includes('ResearchGraphMap')) fail('guide must wire ResearchGraphMap');
  if (!source.includes('research-graph-ai-component-infrastructure-v1.json')) fail('guide graph import missing');
}

if (errors.length) {
  for (const error of errors) console.error('❌ ' + error);
  console.error('\nAI Component Research Graph FAILED: ' + errors.length + ' error(s)');
  process.exit(1);
}

console.log('✅ AI Component Research Graph PASS · ' + companies.length + ' companies · ' + edges.length + ' edges');

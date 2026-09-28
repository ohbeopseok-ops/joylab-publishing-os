import fs from 'node:fs/promises';

const component = await fs.readFile('src/components/ResearchGraphMap.astro', 'utf8');
const css = await fs.readFile('src/styles/research-graph-map-v3.css', 'utf8');
const contract = JSON.parse(await fs.readFile('config/research-graph-ui-contract-v2.json', 'utf8'));
const inventory = JSON.parse(await fs.readFile('config/research-graph-display-modes-v1.json', 'utf8'));

const failures = [];
const requireText = (name, source, text) => {
  if (!source.includes(text)) failures.push(name + ' missing: ' + text);
};

requireText('component', component, "mode?: 'full' | 'compact'");
requireText('component', component, "mode === 'compact'");
requireText('component', component, 'compactMaxNodes');
requireText('component', component, 'Math.min(4, Math.max(1, compactMaxNodes))');
requireText('component', component, 'rg--compact');
requireText('component', component, '전체 Graph 보기');
requireText('css', css, '.rg--compact');
requireText('css', css, '.rg__compact-footer');

if (contract.contract !== 'JoyLab.ResearchGraphUI' || contract.version !== '2.0.0') {
  failures.push('invalid UI contract identity');
}
if (inventory.defaultMode !== 'full') failures.push('full must remain default mode');
if (inventory.currentGraphGuides.some((entry) => entry.mode !== 'full')) {
  failures.push('current research hub guides must remain full mode in V1');
}
const requiredFullRoutes = ['/guides/shipbuilding','/guides/semiconductor-investing','/guides/growth-leadership','/guides/financials-value-up','/guides/ai-power-infrastructure','/guides/ai-standards'];
for (const route of requiredFullRoutes) {
  if (!inventory.currentGraphGuides.some((entry) => entry.path === route && entry.mode === 'full')) failures.push('missing full-mode inventory route: ' + route);
}
if (contract.modes.compact.primaryNodesMax !== 4) failures.push('compact primary node max must be 4');

if (failures.length) {
  console.error('ResearchGraph Compact Mode V1 FAIL');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}
console.log('ResearchGraph Compact Mode V1 PASS · full remains default · compact max 4 nodes');

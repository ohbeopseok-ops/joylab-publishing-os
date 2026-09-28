import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFile(path.join(root, p), 'utf8');
const readJson = async (p) => JSON.parse(await read(p));
const exists = async (p) => fs.access(path.join(root, p)).then(() => true).catch(() => false);

const targets = await readJson('config/company-compact-targets-v1.json');
const display = await readJson('config/research-graph-display-modes-v1.json');
const registry = await read('src/config/companyCompactResearch.ts');

const errors = [];
const seenArticles = new Set();
const seenKeys = new Set();

if (targets.contract !== 'JoyLab.CompanyCompactTargets') errors.push('invalid target contract name');
const requiredViewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];
if (!Array.isArray(targets.viewports)) {
  errors.push('target contract must define viewports');
} else {
  for (const requiredViewport of requiredViewports) {
    const actual = targets.viewports.find((item) => item.name === requiredViewport.name);
    if (!actual) {
      errors.push('missing required viewport: ' + requiredViewport.name);
      continue;
    }
    if (actual.width !== requiredViewport.width || actual.height !== requiredViewport.height) {
      errors.push(
        `${requiredViewport.name}: expected ${requiredViewport.width}x${requiredViewport.height}, got ${actual.width}x${actual.height}`
      );
    }
  }
}
if (!Array.isArray(targets.targets) || targets.targets.length === 0) errors.push('target contract has no targets');

const targetArticleIds = new Set((targets.targets || []).map((item) => item.articleId));
const targetPaths = new Set((targets.targets || []).map((item) => item.path));
const registryArticleIds = new Set(
  [...registry.matchAll(/^\s{2}'([^']+)':\s*\{/gm)].map((match) => match[1])
);
const displayCompactPaths = new Set(
  (display.currentCompactArticles || [])
    .filter((item) => item.mode === 'compact')
    .map((item) => item.path)
);

for (const articleId of registryArticleIds) {
  if (!targetArticleIds.has(articleId)) errors.push('registry article missing from target contract: ' + articleId);
}
for (const articleId of targetArticleIds) {
  if (!registryArticleIds.has(articleId)) errors.push('target article missing from registry: ' + articleId);
}
for (const compactPath of displayCompactPaths) {
  if (!targetPaths.has(compactPath)) errors.push('display compact path missing from target contract: ' + compactPath);
}
for (const targetPath of targetPaths) {
  if (!displayCompactPaths.has(targetPath)) errors.push('target path missing from display inventory: ' + targetPath);
}

for (const target of targets.targets || []) {
  if (seenArticles.has(target.articleId)) errors.push('duplicate articleId: ' + target.articleId);
  if (seenKeys.has(target.graphKey)) errors.push('duplicate graphKey: ' + target.graphKey);
  seenArticles.add(target.articleId);
  seenKeys.add(target.graphKey);

  const expectedPath = '/articles/' + target.articleId;
  if (target.path !== expectedPath) errors.push(target.articleId + ': path mismatch');
  if (!String(target.expectedHub).startsWith('/guides/')) errors.push(target.articleId + ': expectedHub must be a guide');

  const articlePath = 'src/data/articles/' + target.articleId + '.md';
  if (!(await exists(articlePath))) errors.push(target.articleId + ': missing article source');

  const graphPath = 'config/research-graph-' + target.graphKey + '-compact-v1.json';
  if (!(await exists(graphPath))) {
    errors.push(target.articleId + ': missing graph ' + graphPath);
    continue;
  }

  const graph = await readJson(graphPath);
  if (graph.contract !== 'JoyLab.ResearchGraphCompact') errors.push(target.articleId + ': invalid graph contract');
  if (graph.pillar?.id !== target.articleId) errors.push(target.articleId + ': pillar id mismatch');
  if (graph.pillar?.url !== target.path) errors.push(target.articleId + ': pillar url mismatch');
  if (!Array.isArray(graph.nodes) || graph.nodes.length !== 4) errors.push(target.articleId + ': graph must have exactly 4 primary nodes');

  const signalNode = (graph.nodes || []).find((node) => node.id === target.signalNode);
  if (!signalNode) errors.push(target.articleId + ': signalNode missing');
  else {
    if (!Array.isArray(signalNode.signals) || signalNode.signals.length !== 3) errors.push(target.articleId + ': signalNode must have exactly 3 signals');
    if (!(signalNode.signals || []).some((signal) => signal.id === target.signalId)) errors.push(target.articleId + ': signalId missing');
  }

  const displayEntry = (display.currentCompactArticles || []).find((item) => item.path === target.path);
  if (!displayEntry || displayEntry.mode !== 'compact') errors.push(target.articleId + ': display-mode inventory missing');

  if (!registry.includes(`'${target.articleId}':`)) errors.push(target.articleId + ': registry entry missing');
  const importNeedle = `../../config/research-graph-${target.graphKey}-compact-v1.json`;
  if (!registry.includes(importNeedle)) errors.push(target.articleId + ': registry graph import missing');
  if (!registry.includes(`hubHref: '${target.expectedHub}'`) && !registry.includes(`hubHref: "${target.expectedHub}"`)) {
    errors.push(target.articleId + ': registry hubHref missing/mismatched');
  }
}

if (errors.length) {
  console.error('Company Compact Contract FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log(`Company Compact Contract PASS · ${targets.targets.length} targets · ${targets.viewports.length} viewports`);

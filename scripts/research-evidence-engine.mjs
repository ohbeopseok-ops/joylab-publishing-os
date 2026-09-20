import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dashboardPath = path.join(root, 'src/data/ai-economics-dashboard.json');
const graphPath = path.join(root, 'src/data/research-graph-gold-ai-economics-2026-09-20.json');
const configPath = path.join(root, 'src/data/evidence-update-engine.json');
const reportDir = path.join(root, 'artifacts');
const reportPath = path.join(reportDir, 'research-evidence-audit.json');

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dashboard = read(dashboardPath);
const graph = read(graphPath);
const config = read(configPath);

const errors = [];
const warnings = [];
const metricById = new Map((dashboard.metrics || []).map((m) => [m.id, m]));
const thesisById = new Map((graph.articles || []).map((a) => [a.thesis?.id, a.thesis]));

for (const m of config.metrics || []) {
  if (!metricById.has(m.metricId)) errors.push(`Missing dashboard metric: ${m.metricId}`);
  for (const tid of m.thesisIds || []) {
    if (!thesisById.has(tid)) errors.push(`Missing thesis referenced by engine: ${tid}`);
  }
  if (!Array.isArray(m.searchQueries) || m.searchQueries.length === 0) errors.push(`No search queries for metric: ${m.metricId}`);
}

for (const article of graph.articles || []) {
  const thesis = article.thesis || {};
  if (!['SUPPORTED','CHALLENGED','SUPERSEDED'].includes(thesis.status)) {
    errors.push(`Invalid thesis status: ${thesis.id} -> ${thesis.status}`);
  }
  if (typeof thesis.confidence !== 'number' || thesis.confidence < 0 || thesis.confidence > 1) {
    errors.push(`Invalid thesis confidence: ${thesis.id}`);
  }
  if (!Array.isArray(thesis.history) || thesis.history.length === 0) {
    errors.push(`Missing thesis history: ${thesis.id}`);
  }
  for (const evidence of article.evidence || []) {
    if (!evidence.source?.url || !/^https?:\/\//.test(evidence.source.url)) errors.push(`Missing evidence URL: ${evidence.id}`);
    if (!evidence.source?.publishedAt) errors.push(`Missing evidence publishedAt: ${evidence.id}`);
    if (!evidence.updatedAt) errors.push(`Missing evidence updatedAt: ${evidence.id}`);
  }
}

const now = new Date();
for (const metric of dashboard.metrics || []) {
  const observed = new Date(metric.observedAt + 'T00:00:00Z');
  const ageDays = Number.isNaN(observed.getTime()) ? null : Math.floor((now - observed) / 86400000);
  if (ageDays !== null && ageDays > (config.policy?.staleAfterDays ?? 45)) {
    warnings.push(`STALE metric ${metric.id}: observed ${ageDays} days ago`);
  }
  if (!metric.source?.url) errors.push(`Metric source missing URL: ${metric.id}`);
}

const report = {
  engineVersion: config.engineVersion,
  checkedAt: new Date().toISOString(),
  dashboardAsOf: dashboard.asOf,
  graphUpdatedAt: graph.updatedAt,
  metricCount: dashboard.metrics?.length || 0,
  thesisCount: graph.articles?.length || 0,
  evidenceCount: (graph.articles || []).reduce((n,a)=>n+(a.evidence?.length||0),0),
  errors,
  warnings,
  result: errors.length ? 'FAIL' : warnings.length ? 'PASS_WITH_WARNINGS' : 'PASS'
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);

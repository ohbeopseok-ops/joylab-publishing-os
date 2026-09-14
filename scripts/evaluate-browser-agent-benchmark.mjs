import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const policyPath = path.join(root, 'config/browser-agent-benchmark-policy.json');
const scorecardPath = path.join(root, 'src/data/browser-agent-benchmark-scorecard.json');
const summaryPath = path.join(root, 'src/data/browser-agent-benchmark-summary.json');

const args = new Set(process.argv.slice(2));
const strictGate = args.has('--gate');
const writeSummary = args.has('--write-summary');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const round = (value, digits = 2) => Number(value.toFixed(digits));

const policy = readJson(policyPath);
const scorecard = readJson(scorecardPath);

if (scorecard.benchmarkId !== policy.benchmarkId) {
  throw new Error(`benchmarkId mismatch: ${scorecard.benchmarkId} !== ${policy.benchmarkId}`);
}

const metricKeys = Object.keys(policy.weights);
const maxTotal = Object.values(policy.weights).reduce((sum, value) => sum + value, 0);
if (maxTotal !== 100) throw new Error(`Benchmark weights must total 100, got ${maxTotal}`);

const errors = [];
const normalizedRuns = [];
const runIdentity = new Set();

for (const [index, run] of scorecard.runs.entries()) {
  const prefix = `runs[${index}]`;
  if (!policy.scenarioIds.includes(run.scenarioId)) errors.push(`${prefix}: invalid scenarioId ${run.scenarioId}`);
  if (!policy.tools.includes(run.tool)) errors.push(`${prefix}: invalid tool ${run.tool}`);
  if (!Number.isInteger(run.run) || run.run < 1) errors.push(`${prefix}: run must be an integer >= 1`);
  if (typeof run.criticalFail !== 'boolean') errors.push(`${prefix}: criticalFail must be boolean`);

  const identity = `${run.tool}:${run.scenarioId}:${run.run}`;
  if (runIdentity.has(identity)) errors.push(`${prefix}: duplicate run identity ${identity}`);
  runIdentity.add(identity);

  const scores = run.scores ?? {};
  let total = 0;
  for (const metric of metricKeys) {
    const value = scores[metric];
    const cap = policy.weights[metric];
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > cap) {
      errors.push(`${prefix}: scores.${metric} must be between 0 and ${cap}`);
      continue;
    }
    total += value;
  }

  if (!Array.isArray(run.evidence)) errors.push(`${prefix}: evidence must be an array`);
  if (typeof run.notes !== 'string') errors.push(`${prefix}: notes must be a string`);

  normalizedRuns.push({ ...run, total: round(total) });
}

if (errors.length) {
  console.error('Browser Agent Benchmark validation FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const decisionBand = (score) => {
  const band = policy.decisionBands.find(({ min, max }) => score >= min && score <= max);
  return band?.label ?? 'UNRATED';
};

const toolSummaries = {};
for (const tool of policy.tools) {
  const toolRuns = normalizedRuns.filter((run) => run.tool === tool);
  const scenarios = {};

  for (const scenarioId of policy.scenarioIds) {
    const runs = toolRuns.filter((run) => run.scenarioId === scenarioId);
    const runCount = runs.length;
    const averageScore = runCount ? round(runs.reduce((sum, run) => sum + run.total, 0) / runCount) : null;
    const criticalFails = runs.filter((run) => run.criticalFail).length;
    scenarios[scenarioId] = {
      runCount,
      averageScore,
      criticalFails,
      status: runCount >= policy.promotion.minimumRunsPerScenario ? 'COMPLETE' : 'PENDING'
    };
  }

  const completed = Object.values(scenarios).filter((scenario) => scenario.status === 'COMPLETE');
  const scenarioScores = completed.map((scenario) => scenario.averageScore).filter((score) => score !== null);
  const overallScore = scenarioScores.length
    ? round(scenarioScores.reduce((sum, score) => sum + score, 0) / scenarioScores.length)
    : null;
  const totalCriticalFails = toolRuns.filter((run) => run.criticalFail).length;
  const allScenariosComplete = completed.length === policy.scenarioIds.length;

  toolSummaries[tool] = {
    overallScore,
    decisionBand: overallScore === null ? 'NOT_READY' : decisionBand(overallScore),
    coverage: `${completed.length}/${policy.scenarioIds.length}`,
    completedScenarios: completed.length,
    totalRuns: toolRuns.length,
    criticalFails: totalCriticalFails,
    scenarios,
    allScenariosComplete
  };
}

const target = toolSummaries[policy.targetTool];
let promotionDecision = 'NOT_READY';
const blockers = [];

if (policy.promotion.requireAllScenarios && !target.allScenariosComplete) {
  blockers.push(`All scenarios are required: ${target.coverage} complete`);
}
if (target.criticalFails > policy.promotion.maxCriticalFails) {
  blockers.push(`Critical fails ${target.criticalFails} exceed allowed ${policy.promotion.maxCriticalFails}`);
}
if (target.overallScore === null || target.overallScore < policy.promotion.minimumAverageScore) {
  blockers.push(`Average score ${target.overallScore ?? 'N/A'} is below ${policy.promotion.minimumAverageScore}`);
}

if (blockers.length === 0) promotionDecision = 'PROMOTE';
else if (target.allScenariosComplete) promotionDecision = 'HOLD';

const summary = {
  schemaVersion: '1.0',
  benchmarkId: policy.benchmarkId,
  generatedAt: new Date().toISOString(),
  targetTool: policy.targetTool,
  promotionDecision,
  promotionThreshold: policy.promotion.minimumAverageScore,
  blockers,
  tools: toolSummaries
};

console.log(JSON.stringify(summary, null, 2));

if (writeSummary) {
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.error(`Wrote ${path.relative(root, summaryPath)}`);
}

if (strictGate && promotionDecision !== 'PROMOTE') {
  console.error(`Promotion Gate BLOCKED: ${promotionDecision}`);
  process.exit(1);
}

if (strictGate) console.error('Promotion Gate PASS: PROMOTE');

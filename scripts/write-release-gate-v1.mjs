import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'qa-artifacts', 'release-gate');
fs.mkdirSync(outDir, { recursive: true });

const checks = {
  build: process.env.RELEASE_BUILD_RESULT || 'unknown',
  cloudflareDeploy: process.env.RELEASE_DEPLOY_RESULT || 'unknown',
  customDomain: process.env.RELEASE_DOMAIN_RESULT || 'unknown',
  productionSmoke: process.env.RELEASE_SMOKE_RESULT || 'unknown',
  productionReaderQa: process.env.RELEASE_READER_QA_RESULT || 'unknown',
  productionMindmapQa: process.env.RELEASE_MINDMAP_QA_RESULT || 'unknown'
};

const gold = Object.values(checks).every((value) => value === 'success');
const result = {
  schemaVersion: 1,
  gate: 'JoyLab Release Gate V1',
  status: gold ? 'GOLD' : 'BLOCKED',
  commitSha: process.env.GITHUB_SHA || null,
  runId: process.env.GITHUB_RUN_ID || null,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
  repository: process.env.GITHUB_REPOSITORY || null,
  checks,
  generatedAt: new Date().toISOString()
};

const output = path.join(outDir, 'release-gate.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  const summaryLines = [
    '# JoyLab Release Gate V1',
    '',
    '**Status: ' + result.status + '**',
    '',
    '| Check | Result |',
    '| --- | --- |',
    ...Object.entries(checks).map(([name, value]) => '| ' + name + ' | ' + value + ' |'),
    '',
    'Commit: ' + (result.commitSha ?? 'unknown')
  ];
  fs.appendFileSync(summary, summaryLines.join('\n') + '\n');
}

console.log(JSON.stringify(result, null, 2));
if (!gold) {
  console.error('JoyLab Release Gate V1 BLOCKED: Production Smoke GREEN and every required production check are mandatory for GOLD.');
  process.exit(1);
}
console.log('JoyLab Release Gate V1 GOLD');

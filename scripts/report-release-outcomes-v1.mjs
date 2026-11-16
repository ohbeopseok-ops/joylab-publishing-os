#!/usr/bin/env node
// JoyLab Release Outcomes V1: read-only, artifact-backed deployment KPI report.
// Usage: node scripts/report-release-outcomes-v1.mjs <directory-with-release-gate-json-files>
// Input: JSON files containing {gate,status, deployedCommitSha|deployed_sha, runId|run_id,...}.
// This tool does not label an attempt GOLD unless an explicit Release Gate V1 record does.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error('Usage: node scripts/report-release-outcomes-v1.mjs <artifact-directory>');
  process.exit(2);
}
const records = [];
async function walk(dir) {
  for (const e of await fs.readdir(dir, {withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.isFile() && e.name.endsWith('.json')) {
      try {
        const obj = JSON.parse(await fs.readFile(p,'utf8'));
        if (obj?.gate === 'JoyLab Release Gate V1') records.push({file:p,...obj});
      } catch(e) {
        console.error('INVALID JSON: '+p+' '+e.message);
        process.exitCode = 2;
      }
    }
  }
}
try { await walk(root); } catch(e) {
  console.error('ARTIFACT INPUT ERROR: '+e.message);
  process.exit(2);
}
const status = x => String(x.status ?? '').toUpperCase();
const gold = records.filter(x => status(x)==='GOLD');
const pct = (a,b) => b===0 ? 'N/A' : (100*a/b).toFixed(1)+'%';
const result = {
  metric:'JoyLab GOLD deployment success rate',
  source:'Release Gate V1 artifacts only',
  attempts: records.length,
  verifiedGold: gold.length,
  goldDeploymentRate:pct(gold.length,records.length),
  warning:records.length ? null : 'No Release Gate artifacts: not zero failures and not 100% success',
  releases:records.map(x=>({
    status:status(x),
    sha:x.deployed_commit_sha ?? x.deployedCommitSha ?? x.deployed_sha ?? null,
    runId:x.run_id ?? x.runId ?? null,
    file:x.file
  }))
};
console.log(JSON.stringify(result,null,2));
if (records.some(x=>status(x)!=='GOLD')) process.exitCode = 1;

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const repoName = (process.env.GITHUB_REPOSITORY || 'ohbeopseok-ops/joylab-publishing-os').split('/').at(-1);
const registry = JSON.parse(await readFile('config/repository-registry.json', 'utf8'));
const entry = registry.repositories.find((item) => item.name === repoName);

const failures = [];
const warnings = [];
const passes = [];

const pass = (m) => { passes.push(m); console.log('PASS:', m); };
const fail = (m) => { failures.push(m); console.error('FAIL:', m); };
const warn = (m) => { warnings.push(m); console.warn('WARN:', m); };

if (!entry) {
  fail(`Repository ${repoName} is missing from config/repository-registry.json`);
} else {
  pass(`Repository registry entry exists: tier ${entry.tier}`);
}

const defaults = registry.defaults || {};
const workflowDir = '.github/workflows';
let files = [];
try {
  files = (await readdir(workflowDir)).filter((f) => /\.ya?ml$/i.test(f));
} catch {
  fail('Workflow directory is readable');
}

function cronRunsPerDay(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minute, hour] = parts;
  if (hour === '*') return 24;
  if (/^\d+(,\d+)*$/.test(hour)) return hour.split(',').length;
  if (/^\*\/\d+$/.test(hour)) {
    const step = Number(hour.slice(2));
    return step > 0 ? Math.ceil(24 / step) : null;
  }
  if (/^\d+-\d+$/.test(hour)) {
    const [a,b] = hour.split('-').map(Number);
    return b >= a ? b-a+1 : null;
  }
  return null;
}

for (const file of files) {
  const full = path.join(workflowDir, file);
  const text = await readFile(full, 'utf8');
  const crons = [...text.matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const hasSchedule = /(^|\n)\s*schedule:\s*(\n|$)/m.test(text);
  const isHeavy = /playwright|lighthouse|chromium/i.test(text);
  const hasPullRequest = /(^|\n)\s*pull_request:\s*(\n|$)/m.test(text);
  const hasPathFilter = /(^|\n)\s*(paths|paths-ignore):\s*(\n|$)/m.test(text);

  if (hasSchedule && entry && entry.scheduledWorkflowsAllowed === false) {
    fail(`${file}: scheduled workflows are forbidden for tier ${entry.tier}`);
  }

  if (hasSchedule && isHeavy && defaults.heavyBrowserCronAllowed === false) {
    fail(`${file}: heavy browser/Lighthouse/Playwright workflow must not use recurring schedule`);
  }

  for (const cron of crons) {
    const runsPerDay = cronRunsPerDay(cron);

    if (runsPerDay === 24 && defaults.hourlyCronAllowed === false) {
      fail(`${file}: hourly cron is prohibited without a documented registry exception (${cron})`);
    }

    if (
      entry?.tier === 'A' &&
      /production-health/i.test(file) &&
      Number.isFinite(runsPerDay) &&
      runsPerDay > Number(defaults.tierAProductionHealthRunsPerDayMax ?? 4)
    ) {
      fail(`${file}: production health runs ${runsPerDay}/day; max is ${defaults.tierAProductionHealthRunsPerDayMax}`);
    }
  }

  if (hasPullRequest && !hasPathFilter && file !== 'build.yml') {
    warn(`${file}: pull_request trigger has no path filter; review fan-out impact`);
  }
}

if (entry?.tier === 'B') {
  const min = Number(defaults.tierBRequiredChecksMin ?? 1);
  if (!Array.isArray(entry.requiredChecks) || entry.requiredChecks.length < min) {
    fail(`Tier B repository requires at least ${min} required check(s) in registry`);
  } else {
    pass(`Tier B required-check declaration satisfies minimum ${min}`);
  }
}

if (entry?.tier === 'C' && Array.isArray(entry.requiredChecks) && entry.requiredChecks.length > 0) {
  warn('Tier C repository declares required checks; verify this repository should not be Tier B.');
}

console.log(`\nRepository Policy Checker V1: ${passes.length} pass / ${warnings.length} warning / ${failures.length} fail`);
if (failures.length) process.exit(1);

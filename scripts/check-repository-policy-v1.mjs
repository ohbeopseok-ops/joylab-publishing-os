import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
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

function fieldCount(expr, fullRange) {
  if (expr === '*') return fullRange;
  if (/^\d+(,\d+)*$/.test(expr)) return expr.split(',').length;
  if (/^\*\/\d+$/.test(expr)) {
    const step = Number(expr.slice(2));
    return step > 0 ? Math.ceil(fullRange / step) : null;
  }
  if (/^\d+-\d+$/.test(expr)) {
    const [a, b] = expr.split('-').map(Number);
    return b >= a ? b - a + 1 : null;
  }
  return null;
}

function cronRunsPerDay(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minute, hour] = parts;
  const minuteCount = fieldCount(minute, 60);
  const hourCount = fieldCount(hour, 24);
  if (!Number.isFinite(minuteCount) || !Number.isFinite(hourCount)) return null;
  return minuteCount * hourCount;
}

function globToRegExp(glob) {
  let out = '^';
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        i += 1;
        if (glob[i + 1] === '/') {
          i += 1;
          out += '(?:.*/)?';
        } else {
          out += '.*';
        }
      } else {
        out += '[^/]*';
      }
    } else if (ch === '?') {
      out += '[^/]';
    } else {
      out += ch.replace(/[.+^$(){}|\[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(out + '$');
}

function extractList(block, key) {
  const lines = block.split('\n');
  const values = [];
  let capture = false;
  let baseIndent = null;
  for (const line of lines) {
    const keyMatch = line.match(new RegExp(`^(\\s*)${key}:\\s*$`));
    if (keyMatch) {
      capture = true;
      baseIndent = keyMatch[1].length;
      continue;
    }
    if (!capture) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (line.trim() && indent <= baseIndent) break;
    const item = line.match(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/);
    if (item) values.push(item[1]);
  }
  return values;
}

function pullRequestBlock(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^\s{2}pull_request:\s*$/.test(line));
  if (start < 0) return null;
  const selected = [lines[start]];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s{2}[A-Za-z0-9_-]+:\s*$/.test(lines[i])) break;
    selected.push(lines[i]);
  }
  return selected.join('\n');
}

function changedFilesForCurrentEvent() {
  if (process.env.GITHUB_EVENT_NAME !== 'pull_request') return [];
  const base = process.env.GITHUB_BASE_REF;
  if (!base) return [];
  try {
    execFileSync('git', ['fetch', 'origin', base, '--depth=1'], { stdio: 'ignore' });
    return execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
  } catch (error) {
    warn(`Unable to calculate PR changed files for fan-out enforcement: ${error.message}`);
    return [];
  }
}

function workflowMatchesChangedFiles(block, changedFiles) {
  const paths = extractList(block, 'paths');
  const ignores = extractList(block, 'paths-ignore');
  if (!paths.length && !ignores.length) return true;

  const included = paths.length
    ? changedFiles.some((file) => paths.some((pattern) => globToRegExp(pattern).test(file)))
    : true;

  if (!included) return false;

  if (ignores.length && changedFiles.length) {
    const allIgnored = changedFiles.every((file) =>
      ignores.some((pattern) => globToRegExp(pattern).test(file))
    );
    if (allIgnored) return false;
  }
  return true;
}

const changedFiles = changedFilesForCurrentEvent();
let predictedPrFanout = 0;

for (const file of files) {
  const full = path.join(workflowDir, file);
  const text = await readFile(full, 'utf8');
  const crons = [...text.matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const hasSchedule = /(^|\n)\s*schedule:\s*(\n|$)/m.test(text);
  const isHeavy = /playwright|lighthouse|chromium/i.test(text);
  const prBlock = pullRequestBlock(text);
  const hasPullRequest = Boolean(prBlock);
  const hasPathFilter = prBlock ? /(^|\n)\s*(paths|paths-ignore):\s*(\n|$)/m.test(prBlock) : false;

  const tierDefaultScheduleAllowed = defaults.recurringCronAllowed?.[entry?.tier];
  const scheduledAllowed = entry?.scheduledWorkflowsAllowed ?? tierDefaultScheduleAllowed ?? false;

  if (hasSchedule && entry && scheduledAllowed === false) {
    fail(`${file}: scheduled workflows are forbidden for tier ${entry.tier}`);
  }

  if (hasSchedule && isHeavy && defaults.heavyBrowserCronAllowed === false) {
    fail(`${file}: heavy browser/Lighthouse/Playwright workflow must not use recurring schedule`);
  }

  const effectiveHourlyAllowed = entry?.hourlyCronAllowed ?? defaults.hourlyCronAllowed ?? false;
  const hourlyReason = String(entry?.hourlyCronExceptionReason || '').trim();

  if (entry?.hourlyCronAllowed === true && !hourlyReason) {
    fail(`${file}: hourly cron exception requires hourlyCronExceptionReason in registry`);
  }

  for (const cron of crons) {
    const runsPerDay = cronRunsPerDay(cron);

    if (runsPerDay === 24 && effectiveHourlyAllowed === false) {
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

  if (
    process.env.GITHUB_EVENT_NAME === 'pull_request' &&
    hasPullRequest &&
    workflowMatchesChangedFiles(prBlock, changedFiles)
  ) {
    predictedPrFanout += 1;
  }
}

if (process.env.GITHUB_EVENT_NAME === 'pull_request' && changedFiles.length) {
  const limit = Number(entry?.maxAutomaticPrFanout ?? defaults.maxAutomaticPrFanout ?? 3);
  if (predictedPrFanout > limit) {
    fail(`Predicted PR workflow fan-out is ${predictedPrFanout}; max is ${limit}`);
  } else {
    pass(`Predicted PR workflow fan-out ${predictedPrFanout} <= ${limit}`);
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

import { readFile } from 'node:fs/promises';

const repo = process.env.GITHUB_REPOSITORY || 'ohbeopseok-ops/joylab-publishing-os';
const inActions = process.env.GITHUB_ACTIONS === 'true';

const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL: ${message}`);
}

function assert(condition, message) {
  condition ? pass(message) : fail(message);
}

async function text(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    fail(`required file exists: ${path}`);
    return '';
  }
}

function contains(haystack, needle, message) {
  assert(haystack.includes(needle), message);
}

const build = await text('.github/workflows/build.yml');
const deploy = await text('.github/workflows/deploy-cloudflare.yml');
const healthWorkflow = await text('.github/workflows/production-health.yml');
const healthScript = await text('scripts/check-production-health.mjs');
const worker = await text('worker/index.js');
const wrangler = await text('wrangler.jsonc');
const packageJson = await text('package.json');
const packageLock = await text('package-lock.json');
const security = await text('SECURITY.md');

assert(packageLock.length > 0, 'package-lock.json is committed');
assert(security.length > 0, 'SECURITY.md is committed');
contains(packageJson, '"node": ">=22.19.0"', 'Node engine floor remains declared');

contains(build, 'pull_request:', 'Build runs on pull requests');
contains(build, 'branches: [main]', 'Build targets main');
contains(build, 'run: npm ci', 'Build uses deterministic npm ci');
contains(build, 'run: npm audit --omit=dev', 'Build blocks production dependency vulnerabilities');
contains(build, 'run: npm run build', 'Build produces the Astro site');
contains(build, 'node --check scripts/check-production-health.mjs', 'Build syntax-checks Production Health');

contains(deploy, 'permissions:\n  contents: read', 'Deploy workflow keeps read-only repository permissions');
contains(deploy, 'push:\n    branches: [main]', 'Production deploy only follows main pushes');
contains(deploy, 'run: npm ci', 'Deploy uses deterministic npm ci');
contains(deploy, 'run: npm audit --omit=dev', 'Deploy blocks production dependency vulnerabilities');
contains(deploy, 'name: Production smoke test', 'Deploy includes a production smoke test');
contains(deploy, 'https://aijoylab.kr/', 'Canonical production domain is smoke-tested');
contains(deploy, 'https://aijoylab.kr/robots.txt', 'robots.txt is smoke-tested');
contains(deploy, 'https://aijoylab.kr/sitemap.xml', 'sitemap.xml is smoke-tested');
contains(deploy, 'https://aijoylab.kr/rss.xml', 'rss.xml is smoke-tested');
contains(deploy, "test \"$www_code\" = \"301\"", 'www canonical redirect must remain HTTP 301');
contains(deploy, 'strict-transport-security: max-age=31536000; includeSubDomains', 'HSTS is verified in production');
contains(deploy, 'x-content-type-options: nosniff', 'X-Content-Type-Options is verified in production');
contains(deploy, 'x-frame-options: DENY', 'X-Frame-Options is verified in production');
contains(deploy, 'referrer-policy: strict-origin-when-cross-origin', 'Referrer-Policy is verified in production');
contains(deploy, 'permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()', 'Permissions-Policy is verified in production');

contains(healthWorkflow, "cron: '17 * * * *'", 'Production Health runs hourly at minute 17');
contains(healthWorkflow, 'workflow_dispatch:', 'Production Health supports manual dispatch');
contains(healthWorkflow, 'permissions:\n  contents: read', 'Production Health keeps read-only repository permissions');
contains(healthWorkflow, 'node-version: 24', 'Production Health uses Node 24');
contains(healthWorkflow, 'run: node scripts/check-production-health.mjs', 'Production Health runs the canonical checker');
contains(healthWorkflow, 'group: production-health', 'Production Health has concurrency control');

contains(healthScript, "resolve4(HOSTNAME)", 'Production Health checks DNS A records');
contains(healthScript, "resolve6(HOSTNAME)", 'Production Health checks DNS AAAA records');
contains(healthScript, 'tls.connect', 'Production Health validates TLS');
contains(healthScript, "['/robots.txt'", 'Production Health checks robots.txt');
contains(healthScript, "['/sitemap.xml'", 'Production Health checks sitemap.xml');
contains(healthScript, "['/rss.xml'", 'Production Health checks RSS');
contains(healthScript, "['/about'", 'Production Health checks About');
contains(healthScript, "['/contact'", 'Production Health checks Contact');
contains(healthScript, "['/guides/semiconductor-investing'", 'Production Health checks a core guide');
contains(healthScript, "['/articles/what-is-hbm'", 'Production Health checks a representative article');
contains(healthScript, "'strict-transport-security'", 'Production Health checks HSTS');
contains(healthScript, "'x-content-type-options'", 'Production Health checks X-Content-Type-Options');
contains(healthScript, "expectedStatus: 301", 'Production Health checks permanent www redirect');
contains(healthScript, 'SOFT_LATENCY_MS = 1_500', 'Production Health records soft latency threshold');

contains(worker, "'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'", 'Worker sets HSTS');
contains(worker, "'X-Content-Type-Options': 'nosniff'", 'Worker sets X-Content-Type-Options');
contains(worker, "'X-Frame-Options': 'DENY'", 'Worker sets X-Frame-Options');
contains(worker, "'Referrer-Policy': 'strict-origin-when-cross-origin'", 'Worker sets Referrer-Policy');
contains(worker, "'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'", 'Worker sets Permissions-Policy');
contains(worker, "url.hostname === 'www.aijoylab.kr'", 'Worker owns www canonical redirect');
contains(worker, 'status: 301', 'Worker canonical redirect remains permanent');

contains(wrangler, '"workers_dev": false', 'workers.dev exposure remains disabled');
contains(wrangler, '"preview_urls": false', 'Worker preview URLs remain disabled');
contains(wrangler, '"pattern": "aijoylab.kr"', 'Canonical custom domain remains configured');
contains(wrangler, '"pattern": "www.aijoylab.kr"', 'www custom domain remains configured');
contains(wrangler, '"run_worker_first": true', 'Security/canonical worker runs before assets');

async function githubJson(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'joylab-gold-baseline-guard'
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

if (inActions) {
  try {
    const rulesets = await githubJson(`/repos/${repo}/rulesets`);
    const protectMain = rulesets.find((item) => item.name === 'Protect main');
    assert(Boolean(protectMain), 'Protect main ruleset exists');

    if (protectMain) {
      assert(protectMain.enforcement === 'active', 'Protect main ruleset is active');
      const detail = await githubJson(`/repos/${repo}/rulesets/${protectMain.id}`);
      const types = new Set((detail.rules || []).map((rule) => rule.type));
      const prRule = (detail.rules || []).find((rule) => rule.type === 'pull_request');
      const statusRule = (detail.rules || []).find((rule) => rule.type === 'required_status_checks');
      const checks = statusRule?.parameters?.required_status_checks || [];

      assert(detail.conditions?.ref_name?.include?.includes('~DEFAULT_BRANCH'), 'Protect main targets the default branch');
      assert(types.has('deletion'), 'Protect main blocks branch deletion');
      assert(types.has('non_fast_forward'), 'Protect main blocks force pushes');
      assert(types.has('pull_request'), 'Protect main requires pull requests');
      assert(prRule?.parameters?.required_review_thread_resolution === true, 'Protect main requires conversation resolution');
      assert(types.has('required_status_checks'), 'Protect main requires status checks');
      assert(checks.some((check) => check.context === 'build'), 'Protect main requires the build status check');
      assert(detail.current_user_can_bypass === 'never', 'Gold guard token cannot bypass Protect main');

      if (Array.isArray(detail.bypass_actors)) {
        assert(detail.bypass_actors.length === 0, 'Protect main exposes no bypass actors');
      } else {
        console.log('INFO: bypass actor list is not exposed to the GitHub Actions token; baseline establishment/controller review remains authoritative for that field.');
      }
    }
  } catch (error) {
    fail(`GitHub ruleset verification: ${error.message}`);
  }
} else {
  console.log('INFO: GitHub ruleset API verification runs in GitHub Actions only.');
}

console.log(`\nGold baseline checks: ${passes.length} passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);

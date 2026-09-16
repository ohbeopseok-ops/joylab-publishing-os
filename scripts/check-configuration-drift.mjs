import { readFile } from 'node:fs/promises';

const API = 'https://api.cloudflare.com/client/v4';
const token = process.env.CF_AUDIT_API_TOKEN;
const accountId = process.env.CF_ACCOUNT_ID;
const zoneId = process.env.CF_ZONE_ID;

const passes = [];
const warnings = [];
const failures = [];

function pass(message) {
  passes.push(message);
  console.log(`PASS: ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN: ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL: ${message}`);
}

function assert(condition, message) {
  condition ? pass(message) : fail(message);
}

function requireEnv(name, value) {
  if (!value) {
    fail(`required environment variable is set: ${name}`);
    return false;
  }
  pass(`required environment variable is set: ${name}`);
  return true;
}

async function loadBaseline() {
  const raw = await readFile('config/production-baseline.json', 'utf8');
  const baseline = JSON.parse(raw);
  if (baseline.schemaVersion !== 1) {
    throw new Error(`unsupported baseline schemaVersion: ${baseline.schemaVersion}`);
  }
  return baseline;
}

async function cloudflare(path) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'joylab-configuration-drift-audit'
    },
    signal: AbortSignal.timeout(20_000)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false || !payload) {
    const detail = payload?.errors
      ?.map((error) => `${error.code ?? 'unknown'} ${error.message}`)
      .join('; ') || response.statusText;
    throw new Error(`${response.status} ${detail}`);
  }
  return payload.result;
}

async function auditDns(baseline) {
  console.log('\n== DNS inventory ==');
  const records = await cloudflare(`/zones/${zoneId}/dns_records?per_page=500`);

  for (const hostname of baseline.dns.requiredHostnames) {
    const matching = records.filter(
      (record) => String(record.name).toLowerCase() === hostname.toLowerCase()
    );
    assert(matching.length > 0, `required DNS hostname exists: ${hostname}`);

    if (matching.length > 0 && baseline.dns.requireProxied === true) {
      assert(
        matching.some((record) => record.proxied === true),
        `required DNS hostname is Cloudflare proxied: ${hostname}`
      );
    }
  }
}

async function auditCustomDomains(baseline) {
  console.log('\n== Worker custom domains ==');
  const domains = await cloudflare(`/accounts/${accountId}/workers/domains`);
  const expectedHostnames = new Set(
    baseline.customDomains.map((item) => item.toLowerCase())
  );
  const expectedEnvironment = baseline.cloudflare.workerEnvironment;
  const serviceDomains = domains.filter(
    (domain) => domain.service === baseline.cloudflare.workerService
  );

  for (const hostname of expectedHostnames) {
    const matching = serviceDomains.filter(
      (domain) => String(domain.hostname).toLowerCase() === hostname
    );

    assert(
      matching.length > 0,
      `Worker custom domain remains attached: ${hostname}`
    );

    if (matching.length === 0) continue;

    assert(
      matching.some((domain) => domain.environment === expectedEnvironment),
      `custom domain ${hostname} remains attached to Worker environment ${expectedEnvironment}`
    );

    assert(
      matching.some((domain) => domain.zone_id === zoneId),
      `custom domain ${hostname} remains in expected Cloudflare zone`
    );
  }

  for (const domain of serviceDomains) {
    if (!expectedHostnames.has(String(domain.hostname).toLowerCase())) {
      warn(
        `unexpected custom domain attached to Worker: ${domain.hostname}` +
          (domain.environment ? ` (${domain.environment})` : '')
      );
    }
  }
}

async function auditWorkerExposure(baseline) {
  console.log('\n== Worker exposure ==');
  const service = encodeURIComponent(baseline.cloudflare.workerService);
  const state = await cloudflare(
    `/accounts/${accountId}/workers/scripts/${service}/subdomain`
  );

  assert(
    Boolean(state.enabled) === baseline.workerExposure.workersDevEnabled,
    `workers.dev enabled=${baseline.workerExposure.workersDevEnabled}`
  );
  assert(
    Boolean(state.previews_enabled) === baseline.workerExposure.previewUrlsEnabled,
    `preview URLs enabled=${baseline.workerExposure.previewUrlsEnabled}`
  );
}

async function main() {
  console.log('JoyLab Configuration Drift Audit V1');

  const envReady = [
    requireEnv('CF_AUDIT_API_TOKEN', token),
    requireEnv('CF_ACCOUNT_ID', accountId),
    requireEnv('CF_ZONE_ID', zoneId)
  ].every(Boolean);

  if (!envReady) process.exit(1);

  let baseline;
  try {
    baseline = await loadBaseline();
    pass('production baseline loaded');
  } catch (error) {
    fail(`production baseline load failed: ${error.message}`);
    process.exit(1);
  }

  const audits = [
    ['DNS', () => auditDns(baseline)],
    ['Custom Domains', () => auditCustomDomains(baseline)],
    ['Worker Exposure', () => auditWorkerExposure(baseline)]
  ];

  for (const [name, audit] of audits) {
    try {
      await audit();
    } catch (error) {
      fail(`${name} audit error: ${error.message}`);
    }
  }

  console.log('\n== Configuration Drift Summary ==');
  console.log(`PASS: ${passes.length}`);
  console.log(`WARN: ${warnings.length}`);
  console.log(`FAIL: ${failures.length}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach((message) => console.log(`- ${message}`));
  }

  if (failures.length > 0) {
    console.error('\nFailures:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('\nConfiguration Drift Audit completed successfully.');
}

main().catch((error) => {
  console.error(`FATAL: ${error.stack || error.message}`);
  process.exit(1);
});

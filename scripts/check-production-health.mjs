import { resolve4, resolve6 } from 'node:dns/promises';
import tls from 'node:tls';
import { appendFile } from 'node:fs/promises';

const ORIGIN = 'https://aijoylab.kr';
const HOSTNAME = 'aijoylab.kr';
const RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15_000;
const SOFT_LATENCY_MS = 1_500;

const passes = [];
const warnings = [];
const failures = [];
const timings = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function withRetries(label, operation) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`RETRY ${attempt}/${RETRIES}: ${label}: ${error.message}`);
      if (attempt < RETRIES) await sleep(attempt * 1_500);
    }
  }
  throw lastError;
}

async function fetchText(pathOrUrl, {
  expectedStatus = 200,
  required = [],
  redirect = 'follow',
  label = pathOrUrl
} = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${ORIGIN}${pathOrUrl}`;

  return withRetries(label, async () => {
    const startedAt = performance.now();
    const response = await fetch(url, {
      redirect,
      headers: { 'User-Agent': 'JoyLab-Production-Watch/1.0' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    const elapsed = Math.round(performance.now() - startedAt);
    const body = await response.text();

    if (response.status !== expectedStatus) {
      throw new Error(`expected HTTP ${expectedStatus}, got ${response.status}`);
    }
    for (const marker of required) {
      if (!body.includes(marker)) throw new Error(`missing marker: ${marker}`);
    }

    timings.push({ label, elapsed });
    if (elapsed > SOFT_LATENCY_MS) warn(`${label} response time ${elapsed}ms exceeds soft ${SOFT_LATENCY_MS}ms threshold`);
    return { response, body, elapsed };
  });
}

async function checkDns() {
  try {
    const [v4, v6] = await Promise.all([
      resolve4(HOSTNAME).catch(() => []),
      resolve6(HOSTNAME).catch(() => [])
    ]);
    if (v4.length + v6.length === 0) throw new Error('no A or AAAA records resolved');
    pass(`DNS resolves (${v4.length} A, ${v6.length} AAAA)`);
  } catch (error) {
    fail(`DNS resolution: ${error.message}`);
  }
}

async function checkTls() {
  try {
    const certificate = await withRetries('TLS certificate', () => new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: HOSTNAME,
        port: 443,
        servername: HOSTNAME,
        rejectUnauthorized: true
      });

      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error('TLS connection timed out'));
      }, REQUEST_TIMEOUT_MS);

      socket.once('secureConnect', () => {
        clearTimeout(timer);
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        socket.end();
        if (!authorized) return reject(new Error(socket.authorizationError || 'certificate not authorized'));
        resolve(cert);
      });
      socket.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    }));

    const expiresAt = new Date(certificate.valid_to);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new Error(`certificate expiry invalid: ${certificate.valid_to || 'unknown'}`);
    }
    const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
    if (daysRemaining < 14) warn(`TLS certificate expires in ${daysRemaining} days`);
    pass(`TLS certificate valid (${daysRemaining} days remaining)`);
  } catch (error) {
    fail(`TLS validation: ${error.message}`);
  }
}

async function checkCorePages() {
  const checks = [
    ['/', ['JoyLab', 'rel="canonical"', 'https://aijoylab.kr/']],
    ['/guides/semiconductor-investing', ['반도체 투자 가이드']],
    ['/articles/what-is-hbm', ['HBM', 'id="article-contact-cta"']],
    ['/about', ['ABOUT JOYLAB', 'Fact', 'Interpretation', 'Scenario', 'Action']],
    ['/contact', ['CONTACT', 'id="contact-form"']],
    ['/privacy', ['개인정보처리 안내', 'Workers Analytics Engine']],
    ['/robots.txt', ['Sitemap: https://aijoylab.kr/sitemap.xml']],
    ['/sitemap.xml', ['<loc>https://aijoylab.kr/</loc>', 'https://aijoylab.kr/about']],
    ['/rss.xml', ['<link>https://aijoylab.kr</link>']]
  ];

  for (const [path, required] of checks) {
    try {
      await fetchText(path, { required, label: path });
      pass(`${path} is healthy`);
    } catch (error) {
      fail(`${path}: ${error.message}`);
    }
  }
}

async function checkSecurityHeaders() {
  try {
    const { response } = await fetchText('/', { label: 'security headers' });
    const expected = {
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    };

    for (const [name, value] of Object.entries(expected)) {
      const actual = response.headers.get(name);
      if (actual !== value) throw new Error(`${name} expected "${value}", got "${actual}"`);
    }
    pass('security headers match Gold baseline');
  } catch (error) {
    fail(`security headers: ${error.message}`);
  }
}

async function checkCanonicalRedirect() {
  const source = 'https://www.aijoylab.kr/articles/what-is-hbm';
  const expected = 'https://aijoylab.kr/articles/what-is-hbm';
  try {
    const { response } = await fetchText(source, {
      expectedStatus: 301,
      redirect: 'manual',
      label: 'www canonical redirect'
    });
    const location = response.headers.get('location');
    if (location !== expected) throw new Error(`expected Location ${expected}, got ${location}`);
    pass('www canonical redirect remains HTTP 301 to root domain');
  } catch (error) {
    fail(`www canonical redirect: ${error.message}`);
  }
}

async function writeStepSummary() {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  const timingRows = timings
    .map(({ label, elapsed }) => `| ${label.replaceAll('|', '\\|')} | ${elapsed} ms |`)
    .join('\n');
  const warningLines = warnings.length ? warnings.map((item) => `- ${item}`).join('\n') : '- None';
  const failureLines = failures.length ? failures.map((item) => `- ${item}`).join('\n') : '- None';

  await appendFile(summaryPath, `# JoyLab Production Watch V1\n\n- Passed: ${passes.length}\n- Warnings: ${warnings.length}\n- Failed: ${failures.length}\n\n## Response times\n\n| Check | Time |\n| --- | ---: |\n${timingRows}\n\n## Warnings\n${warningLines}\n\n## Failures\n${failureLines}\n`);
}

console.log(`JoyLab Production Watch V1 — ${new Date().toISOString()}`);
await checkDns();
await checkTls();
await checkCorePages();
await checkSecurityHeaders();
await checkCanonicalRedirect();
await writeStepSummary();

console.log(`\nProduction health: ${passes.length} passed, ${warnings.length} warnings, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);

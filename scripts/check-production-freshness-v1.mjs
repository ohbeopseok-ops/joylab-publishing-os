import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const siteOrigin = 'https://aijoylab.kr';
const siteUrl = process.env.GSC_SITE_URL || 'sc-domain:aijoylab.kr';
const serviceAccountRaw = process.env.GSC_SERVICE_ACCOUNT_JSON || '';
const deployedAt = process.env.DEPLOYED_AT || new Date().toISOString();

const probes = [
  {
    name: 'home',
    path: '/',
    localFile: 'dist/index.html',
    markers: ['JoyLab', '최신 업데이트']
  },
  {
    name: 'books',
    path: '/books',
    localFile: 'dist/books/index.html',
    markers: ['LIBRARY · 출간일순', '출간일 2026. 9. 25.', '악보의 쉼표 사이에 고여 있는 침묵의 무게']
  }
];

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function markerState(body, markers) {
  const missing = markers.filter((marker) => !body.includes(marker));
  return { pass: missing.length === 0, missing };
}

async function fetchCdn(pathname) {
  const url = new URL(pathname, siteOrigin);
  url.searchParams.set('freshness_probe', process.env.GITHUB_SHA || String(Date.now()));
  const response = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'User-Agent': 'JoyLab-Freshness-Gate/1.0'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000)
  });
  const body = await response.text();
  return {
    url: url.toString(),
    status: response.status,
    body,
    cfCacheStatus: response.headers.get('cf-cache-status'),
    age: response.headers.get('age'),
    etag: response.headers.get('etag')
  };
}

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function gscAccessToken() {
  if (!serviceAccountRaw) return null;
  const serviceAccount = JSON.parse(serviceAccountRaw);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), serviceAccount.private_key).toString('base64url');
  const assertion = `${unsigned}.${signature}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth-type:jwt-bearer', assertion })
  });

  // Retry with the standards-compliant grant_type when providers reject the defensive first form.
  if (!response.ok) {
    const retry = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
    });
    if (!retry.ok) throw new Error(`GSC OAuth ${retry.status}: ${await retry.text()}`);
    return (await retry.json()).access_token;
  }
  return (await response.json()).access_token;
}

async function inspectGoogle(url, accessToken) {
  if (!accessToken) return { state: 'UNAVAILABLE', reason: 'GSC_SERVICE_ACCOUNT_JSON is not configured' };
  const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl })
  });
  if (!response.ok) return { state: 'UNAVAILABLE', reason: `URL Inspection HTTP ${response.status}: ${(await response.text()).slice(0, 500)}` };
  const payload = await response.json();
  const index = payload.inspectionResult?.indexStatusResult ?? {};
  const lastCrawlTime = index.lastCrawlTime ?? null;
  const crawlMs = lastCrawlTime ? Date.parse(lastCrawlTime) : NaN;
  const deployMs = Date.parse(deployedAt);
  const state = Number.isFinite(crawlMs) && Number.isFinite(deployMs) && crawlMs >= deployMs ? 'CURRENT' : 'STALE_OR_PENDING';
  return {
    state,
    lastCrawlTime,
    coverageState: index.coverageState ?? null,
    indexingState: index.indexingState ?? null,
    pageFetchState: index.pageFetchState ?? null,
    googleCanonical: index.googleCanonical ?? null,
    userCanonical: index.userCanonical ?? null
  };
}

const failures = [];
const results = [];
const accessToken = await gscAccessToken().catch((error) => {
  console.warn(`Search layer unavailable: ${error.message}`);
  return null;
});

for (const probe of probes) {
  const localPath = path.join(root, probe.localFile);
  if (!fs.existsSync(localPath)) {
    failures.push({ probe: probe.name, layer: 'origin', reason: `missing build artifact ${probe.localFile}` });
    continue;
  }

  const originBody = fs.readFileSync(localPath, 'utf8');
  const originMarkers = markerState(originBody, probe.markers);
  if (!originMarkers.pass) failures.push({ probe: probe.name, layer: 'origin', reason: 'missing expected markers', missing: originMarkers.missing });

  const cdn = await fetchCdn(probe.path);
  const cdnMarkers = markerState(cdn.body, probe.markers);
  if (cdn.status !== 200 || !cdnMarkers.pass) {
    failures.push({ probe: probe.name, layer: 'cdn', reason: `HTTP ${cdn.status} or marker mismatch`, missing: cdnMarkers.missing });
  }

  const originHash = sha256(originBody);
  const cdnHash = sha256(cdn.body);
  const search = await inspectGoogle(new URL(probe.path, siteOrigin).toString(), accessToken);

  results.push({
    probe: probe.name,
    url: new URL(probe.path, siteOrigin).toString(),
    origin: {
      state: originMarkers.pass ? 'CURRENT' : 'MISMATCH',
      sha256: originHash,
      source: probe.localFile
    },
    cdn: {
      state: cdn.status === 200 && cdnMarkers.pass ? (originHash === cdnHash ? 'CURRENT' : 'CURRENT_CONTENT_DIFFERENT_BYTES') : 'STALE_OR_BROKEN',
      status: cdn.status,
      sha256: cdnHash,
      cfCacheStatus: cdn.cfCacheStatus,
      age: cdn.age,
      etag: cdn.etag,
      missingMarkers: cdnMarkers.missing
    },
    searchCache: search
  });
}

const report = {
  gate: 'Production Freshness Gate V1',
  generatedAt: new Date().toISOString(),
  deployedAt,
  commit: process.env.GITHUB_SHA || null,
  semantics: {
    origin: 'current build artifact produced from the deployment commit',
    cdn: 'live aijoylab.kr response with cache-busting and no-cache request headers',
    searchCache: 'Google Search Console URL Inspection state; informative because search recrawl is asynchronous'
  },
  releaseVerdict: failures.length ? 'FAIL' : 'GOLD_PASS',
  searchFreshness: results.every((x) => x.searchCache.state === 'CURRENT') ? 'CURRENT' : 'STALE_OR_PENDING',
  results,
  failures
};

const outDir = path.join(root, 'qa-artifacts', 'production-freshness-v1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');

const lines = [
  '# Production Freshness Gate V1',
  '',
  `- Release: **${report.releaseVerdict}**`,
  `- Search freshness: **${report.searchFreshness}**`,
  `- Commit: ${report.commit ?? '-'}`,
  '',
  '| Probe | Origin | CDN | Search Cache |',
  '| --- | --- | --- | --- |',
  ...results.map((x) => `| ${x.probe} | ${x.origin.state} | ${x.cdn.state} | ${x.searchCache.state} |`),
  '',
  '> Search Cache는 Google 재크롤링 시점에 따라 배포보다 늦을 수 있으므로 release blocker가 아니라 freshness 관찰값으로 사용합니다.',
  ''
];
fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'));

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);

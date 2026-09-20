import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const configPath = path.join(root, 'config/ctr-benchmark.json');
const outputDir = path.join(root, 'qa-artifacts/ctr-benchmark');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const rawServiceAccount = process.env.GSC_SERVICE_ACCOUNT_JSON;
const siteUrl = process.env.GSC_SITE_URL || 'sc-domain:aijoylab.kr';

const fmt = (d) => d.toISOString().slice(0, 10);
const normalize = (s) => String(s || '').trim().toLocaleLowerCase('ko-KR');
const isArticlePage = (page) => {
  try { return new URL(page).pathname.startsWith('/articles/'); } catch { return false; }
};
const isBranded = (query) => config.excludeBrandedQueries &&
  config.brandPatterns.some((pattern) => normalize(query).includes(normalize(pattern)));

function bucketFor(position, buckets) {
  return buckets.find((b) => position >= b.min && position <= b.max) ?? null;
}

function aggregate(rows, bucket) {
  const selected = rows.filter((row) => row.position >= bucket.min && row.position <= bucket.max);
  const clicks = selected.reduce((n, row) => n + row.clicks, 0);
  const impressions = selected.reduce((n, row) => n + row.impressions, 0);
  return {
    id: bucket.id,
    positionMin: bucket.min,
    positionMax: bucket.max,
    clicks,
    impressions,
    rows: selected.length,
    rawCtr: impressions ? clicks / impressions : 0
  };
}

function confidence(stats) {
  const m = config.minimums;
  if (stats.impressions >= m.highConfidenceImpressions && stats.rows >= m.highConfidenceRows) return 'HIGH';
  if (stats.impressions >= m.bucketImpressions && stats.rows >= m.bucketRows) return 'MEDIUM';
  return 'LOW';
}

function available(stats) {
  const m = config.minimums;
  return stats.impressions >= m.bucketImpressions && stats.rows >= m.bucketRows;
}

function buildBenchmark(rows) {
  const parents = config.parentBuckets.map((b) => aggregate(rows, b));
  const parentMap = new Map(parents.map((p) => [p.id, p]));
  const priorStrength = config.smoothing.priorStrengthImpressions;

  const fine = config.positionBuckets.map((b) => {
    const stats = aggregate(rows, b);
    const parent = config.parentBuckets.find((p) => b.min >= p.min && b.max <= p.max);
    const parentStats = parent ? parentMap.get(parent.id) : null;
    const parentAvailable = parentStats ? available(parentStats) : false;

    if (available(stats)) {
      const parentCtr = parentStats?.rawCtr ?? 0;
      const expectedCtr = parentStats && parentStats.impressions
        ? (stats.clicks + priorStrength * parentCtr) / (stats.impressions + priorStrength)
        : stats.rawCtr;
      return {
        ...stats,
        parentId: parent?.id ?? null,
        parentCtr: parentStats?.rawCtr ?? null,
        expectedCtr,
        confidence: confidence(stats),
        status: 'AVAILABLE',
        sourceBucket: b.id
      };
    }

    if (parentAvailable) {
      return {
        ...stats,
        parentId: parent.id,
        parentCtr: parentStats.rawCtr,
        expectedCtr: parentStats.rawCtr,
        confidence: confidence(parentStats),
        status: 'FALLBACK_PARENT',
        sourceBucket: parent.id
      };
    }

    return {
      ...stats,
      parentId: parent?.id ?? null,
      parentCtr: parentStats?.rawCtr ?? null,
      expectedCtr: null,
      confidence: 'LOW',
      status: 'INSUFFICIENT_DATA',
      sourceBucket: null
    };
  });

  return { fine, parents };
}

function sanitizeRows(apiRows = []) {
  return apiRows.map((row) => ({
    query: row.keys?.[0] || '',
    page: row.keys?.[1] || '',
    clicks: Number(row.clicks) || 0,
    impressions: Number(row.impressions) || 0,
    ctr: Number(row.ctr) || 0,
    position: Number(row.position) || 0
  }))
  .filter((row) => row.query && isArticlePage(row.page))
  .filter((row) => !isBranded(row.query))
  .filter((row) => row.position > 0 && row.position <= 50.99);
}

if (process.argv.includes('--self-test')) {
  const synthetic = [];
  for (let i = 0; i < 12; i++) {
    synthetic.push({ query: `q4-${i}`, page: 'https://aijoylab.kr/articles/test', clicks: 25, impressions: 500, ctr: 0.05, position: 4.4 });
  }
  for (let i = 0; i < 15; i++) {
    synthetic.push({ query: `q6-${i}`, page: 'https://aijoylab.kr/articles/test', clicks: 20, impressions: 500, ctr: 0.04, position: 7.2 });
  }
  const { fine } = buildBenchmark(synthetic);
  const p4 = fine.find((x) => x.id === 'p4');
  if (!p4 || p4.status !== 'AVAILABLE' || p4.expectedCtr <= 0) throw new Error('p4 benchmark self-test failed');
  const p1 = fine.find((x) => x.id === 'p1');
  if (!p1 || p1.status !== 'INSUFFICIENT_DATA') throw new Error('insufficient-data self-test failed');
  const cleaned = sanitizeRows([
    { keys: ['JoyLab', 'https://aijoylab.kr/articles/test'], clicks: 1, impressions: 2, ctr: .5, position: 1 },
    { keys: ['hbm', 'https://aijoylab.kr/articles/test'], clicks: 1, impressions: 10, ctr: .1, position: 3 }
  ]);
  if (cleaned.length !== 1 || cleaned[0].query !== 'hbm') throw new Error('brand exclusion self-test failed');
  console.log('CTR Benchmark Engine self-test passed.');
  process.exit(0);
}

if (!rawServiceAccount) throw new Error('Missing GSC_SERVICE_ACCOUNT_JSON.');
const serviceAccount = JSON.parse(rawServiceAccount);
const b64url = (value) => Buffer.from(value).toString('base64url');
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

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth2:grant-type:jwt-bearer', assertion })
});
if (!tokenResponse.ok) throw new Error(`GSC OAuth ${tokenResponse.status}: ${await tokenResponse.text()}`);
const { access_token: accessToken } = await tokenResponse.json();
const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

async function queryPage(body) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, type: 'web', dataState: 'final' })
  });
  if (!response.ok) throw new Error(`GSC Search Analytics ${response.status}: ${await response.text()}`);
  return response.json();
}

async function queryAll(body) {
  const rowLimit = 25000;
  const all = [];
  for (let startRow = 0; ; startRow += rowLimit) {
    const response = await queryPage({ ...body, rowLimit, startRow });
    const rows = response.rows ?? [];
    all.push(...rows);
    if (rows.length < rowLimit) break;
  }
  return all;
}

const end = new Date();
end.setUTCDate(end.getUTCDate() - 2);
end.setUTCHours(0, 0, 0, 0);
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - config.windowDays + 1);

const apiRows = await queryAll({
  startDate: fmt(start),
  endDate: fmt(end),
  dimensions: ['query', 'page']
});
const rows = sanitizeRows(apiRows);
const { fine, parents } = buildBenchmark(rows);

const report = {
  version: config.version,
  generatedAt: new Date().toISOString(),
  window: { start: fmt(start), end: fmt(end), days: config.windowDays },
  source: config.source,
  siteUrl,
  excludeBrandedQueries: config.excludeBrandedQueries,
  brandPatterns: config.brandPatterns,
  sourceRows: apiRows.length,
  eligibleRows: rows.length,
  buckets: fine,
  parentBuckets: parents.map((p) => ({
    ...p,
    confidence: confidence(p),
    status: available(p) ? 'AVAILABLE' : 'INSUFFICIENT_DATA'
  }))
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'ctr-benchmark.json'), JSON.stringify(report, null, 2) + '\n');

const lines = [
  '# JoyLab CTR Benchmark V1',
  '',
  `- Window: **${report.window.start} → ${report.window.end}**`,
  `- Source rows: **${report.sourceRows}**`,
  `- Eligible non-brand article rows: **${report.eligibleRows}**`,
  '',
  '| Bucket | Impressions | Rows | Raw CTR | Expected CTR | Confidence | Status | Source |',
  '| --- | ---: | ---: | ---: | ---: | :---: | --- | --- |'
];
for (const b of fine) {
  lines.push(`| ${b.id} | ${b.impressions} | ${b.rows} | ${(b.rawCtr * 100).toFixed(2)}% | ${b.expectedCtr == null ? '-' : (b.expectedCtr * 100).toFixed(2) + '%'} | ${b.confidence} | ${b.status} | ${b.sourceBucket ?? '-'} |`);
}
const md = lines.join('\n') + '\n';
fs.writeFileSync(path.join(outputDir, 'ctr-benchmark.md'), md);
console.log(md);

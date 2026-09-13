import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const inputPath = path.join(root, 'src/data/visual-upgrade-input.json');
const rawServiceAccount = process.env.GSC_SERVICE_ACCOUNT_JSON;
const siteUrl = process.env.GSC_SITE_URL || 'sc-domain:aijoylab.kr';

if (!rawServiceAccount) {
  console.log('GSC sync skipped: missing GSC_SERVICE_ACCOUNT_JSON.');
  process.exit(0);
}

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
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  })
});
if (!tokenResponse.ok) throw new Error(`GSC OAuth ${tokenResponse.status}: ${await tokenResponse.text()}`);
const { access_token: accessToken } = await tokenResponse.json();

const end = new Date();
end.setUTCDate(end.getUTCDate() - 2);
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - 27);
const date = (d) => d.toISOString().slice(0, 10);

const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: date(start),
    endDate: date(end),
    dimensions: ['page'],
    type: 'web',
    rowLimit: 25000,
    dataState: 'final'
  })
});
if (!response.ok) throw new Error(`GSC Search Analytics ${response.status}: ${await response.text()}`);
const payload = await response.json();

const pageMetrics = new Map();
for (const row of payload.rows ?? []) {
  const page = row.keys?.[0];
  if (!page) continue;
  let pathname;
  try { pathname = new URL(page).pathname.replace(/\/$/, ''); } catch { continue; }
  pageMetrics.set(pathname, {
    searchClicks: Number(row.clicks) || 0,
    searchImpressions: Number(row.impressions) || 0,
    ctrPercent: Number(((Number(row.ctr) || 0) * 100).toFixed(2)),
    averagePosition: Number((Number(row.position) || 0).toFixed(2))
  });
}

const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const updated = rows.map((row) => {
  const metric = pageMetrics.get(`/articles/${row.id}`);
  if (!metric) return row;
  return { ...row, ...metric, gscWindowStart: date(start), gscWindowEnd: date(end) };
});

fs.writeFileSync(inputPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`GSC visual metrics synced for ${updated.filter((row) => row.ctrPercent != null).length} queue rows.`);

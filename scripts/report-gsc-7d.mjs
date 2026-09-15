import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const outputDir = path.join(root, 'qa-artifacts/gsc-7d');
const rawServiceAccount = process.env.GSC_SERVICE_ACCOUNT_JSON;
const siteUrl = process.env.GSC_SITE_URL || 'sc-domain:aijoylab.kr';

const fmt = (d) => d.toISOString().slice(0, 10);
const sum = (rows = []) => rows.reduce((acc, row) => {
  acc.clicks += Number(row.clicks) || 0;
  acc.impressions += Number(row.impressions) || 0;
  acc.positionWeighted += (Number(row.position) || 0) * (Number(row.impressions) || 0);
  return acc;
}, { clicks: 0, impressions: 0, positionWeighted: 0 });
const finish = (totals) => ({
  clicks: totals.clicks,
  impressions: totals.impressions,
  ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
  averagePosition: totals.impressions ? totals.positionWeighted / totals.impressions : 0
});

if (process.argv.includes('--self-test')) {
  const test = finish(sum([{ clicks: 2, impressions: 10, position: 3 }, { clicks: 1, impressions: 10, position: 5 }]));
  if (test.clicks !== 3 || test.impressions !== 20 || Math.abs(test.averagePosition - 4) > 0.001) throw new Error('GSC report aggregation self-test failed.');
  console.log('GSC 7-day report self-test passed.');
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
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
});
if (!tokenResponse.ok) throw new Error(`GSC OAuth ${tokenResponse.status}: ${await tokenResponse.text()}`);
const { access_token: accessToken } = await tokenResponse.json();
const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

async function query(body) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, type: 'web', dataState: 'final' })
  });
  if (!response.ok) throw new Error(`GSC Search Analytics ${response.status}: ${await response.text()}`);
  return response.json();
}

const end = new Date();
end.setUTCDate(end.getUTCDate() - 2);
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - 6);
const previousEnd = new Date(start);
previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
const previousStart = new Date(previousEnd);
previousStart.setUTCDate(previousStart.getUTCDate() - 6);

const [currentDaily, previousDaily, topPages] = await Promise.all([
  query({ startDate: fmt(start), endDate: fmt(end), dimensions: ['date'], rowLimit: 100 }),
  query({ startDate: fmt(previousStart), endDate: fmt(previousEnd), dimensions: ['date'], rowLimit: 100 }),
  query({ startDate: fmt(start), endDate: fmt(end), dimensions: ['page'], rowLimit: 20 })
]);

const current = finish(sum(currentDaily.rows));
const previous = finish(sum(previousDaily.rows));
const delta = {
  clicks: current.clicks - previous.clicks,
  impressions: current.impressions - previous.impressions,
  ctrPoints: (current.ctr - previous.ctr) * 100,
  averagePosition: current.averagePosition - previous.averagePosition
};
const pages = (topPages.rows ?? []).map((row) => ({
  page: row.keys?.[0] || '',
  clicks: Number(row.clicks) || 0,
  impressions: Number(row.impressions) || 0,
  ctrPercent: Number(((Number(row.ctr) || 0) * 100).toFixed(2)),
  averagePosition: Number((Number(row.position) || 0).toFixed(2))
}));
const report = {
  generatedAt: new Date().toISOString(),
  siteUrl,
  currentWindow: { start: fmt(start), end: fmt(end), ...current },
  previousWindow: { start: fmt(previousStart), end: fmt(previousEnd), ...previous },
  delta,
  topPages: pages
};
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'gsc-7d.json'), `${JSON.stringify(report, null, 2)}\n`);
const pct = (v) => `${(v * 100).toFixed(2)}%`;
const md = `# JoyLab GSC 7-Day Visibility\n\n- Window: ${fmt(start)} → ${fmt(end)}\n- Clicks: **${current.clicks}** (${delta.clicks >= 0 ? '+' : ''}${delta.clicks})\n- Impressions: **${current.impressions}** (${delta.impressions >= 0 ? '+' : ''}${delta.impressions})\n- CTR: **${pct(current.ctr)}** (${delta.ctrPoints >= 0 ? '+' : ''}${delta.ctrPoints.toFixed(2)}%p)\n- Avg position: **${current.averagePosition.toFixed(2)}** (${delta.averagePosition >= 0 ? '+' : ''}${delta.averagePosition.toFixed(2)})\n\n## Top Pages\n\n${pages.length ? pages.map((row) => `- ${row.page} — ${row.impressions} imp / ${row.clicks} clicks / ${row.ctrPercent}% CTR / pos ${row.averagePosition}`).join('\n') : '- No rows yet.'}\n`;
fs.writeFileSync(path.join(outputDir, 'gsc-7d.md'), md);
console.log(md);

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const outputDir = path.join(root, 'qa-artifacts/gsc-28d');
const rawServiceAccount = process.env.GSC_SERVICE_ACCOUNT_JSON;
const siteUrl = process.env.GSC_SITE_URL || 'sc-domain:aijoylab.kr';
const publicOrigin = process.env.PUBLIC_SITE_ORIGIN || 'https://aijoylab.kr';

const fmt = (d) => d.toISOString().slice(0, 10);
const clampDate = (date, maxDate) => date > maxDate ? new Date(maxDate) : new Date(date);

function parsePublishedAt(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const published = match[1].match(/^publishedAt:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  if (!published) return null;
  const date = new Date(`${published}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function listArticles() {
  return fs.readdirSync(articleDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const filePath = path.join(articleDir, name);
      const publishedAt = parsePublishedAt(filePath);
      if (!publishedAt) return null;
      return {
        slug: path.basename(name, '.md'),
        publishedAt,
        page: new URL(`/articles/${path.basename(name, '.md')}`, publicOrigin).toString()
      };
    })
    .filter(Boolean);
}

function aggregateRows(rows = []) {
  const totals = rows.reduce((acc, row) => {
    const impressions = Number(row.impressions) || 0;
    acc.clicks += Number(row.clicks) || 0;
    acc.impressions += impressions;
    acc.positionWeighted += (Number(row.position) || 0) * impressions;
    return acc;
  }, { clicks: 0, impressions: 0, positionWeighted: 0 });

  return {
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
    averagePosition: totals.impressions ? totals.positionWeighted / totals.impressions : 0
  };
}

function summarizeQueries(rows = []) {
  const queries = (rows ?? []).map((row) => ({
    query: row.keys?.[0] || '',
    clicks: Number(row.clicks) || 0,
    impressions: Number(row.impressions) || 0,
    ctr: Number(row.ctr) || 0,
    position: Number(row.position) || 0
  })).filter((row) => row.query);

  return {
    uniqueQueries: queries.length,
    top20Queries: queries.filter((row) => row.position > 0 && row.position <= 20).length,
    top10Queries: queries.filter((row) => row.position > 0 && row.position <= 10).length,
    queries
  };
}

function windowFor(publishedAt, days, finalDataEnd) {
  const start = new Date(publishedAt);
  const nominalEnd = new Date(start);
  nominalEnd.setUTCDate(nominalEnd.getUTCDate() + days - 1);
  const end = clampDate(nominalEnd, finalDataEnd);
  const availableDays = Math.max(0, Math.floor((end - start) / 86400000) + 1);
  return {
    start,
    end,
    availableDays,
    complete: availableDays >= days
  };
}

if (process.argv.includes('--self-test')) {
  const sample = aggregateRows([
    { clicks: 2, impressions: 10, position: 3 },
    { clicks: 1, impressions: 10, position: 5 }
  ]);
  if (sample.clicks !== 3 || sample.impressions !== 20 || Math.abs(sample.averagePosition - 4) > 0.001) {
    throw new Error('aggregateRows self-test failed');
  }
  const q = summarizeQueries([
    { keys: ['a'], clicks: 1, impressions: 10, ctr: 0.1, position: 8 },
    { keys: ['b'], clicks: 0, impressions: 5, ctr: 0, position: 18 },
    { keys: ['c'], clicks: 0, impressions: 2, ctr: 0, position: 31 }
  ]);
  if (q.uniqueQueries !== 3 || q.top20Queries !== 2 || q.top10Queries !== 1) throw new Error('query summary self-test failed');
  const finalDataEnd = new Date('2026-09-30T00:00:00Z');
  const w = windowFor(new Date('2026-09-10T00:00:00Z'), 28, finalDataEnd);
  if (w.availableDays !== 21 || w.complete !== false) throw new Error('window self-test failed');
  console.log('GSC 28-day reporter self-test passed.');
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

async function query(body) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, type: 'web', dataState: 'final' })
  });
  if (!response.ok) throw new Error(`GSC Search Analytics ${response.status}: ${await response.text()}`);
  return response.json();
}

async function queryPageWindow(page, startDate, endDate) {
  const filter = {
    dimensionFilterGroups: [{
      filters: [{ dimension: 'page', operator: 'equals', expression: page }]
    }]
  };
  const [daily, queryRows] = await Promise.all([
    query({ startDate, endDate, dimensions: ['date'], rowLimit: 25000, ...filter }),
    query({ startDate, endDate, dimensions: ['query'], rowLimit: 25000, ...filter })
  ]);
  return {
    ...aggregateRows(daily.rows),
    ...summarizeQueries(queryRows.rows)
  };
}

const finalDataEnd = new Date();
finalDataEnd.setUTCDate(finalDataEnd.getUTCDate() - 2);
finalDataEnd.setUTCHours(0, 0, 0, 0);

const articles = listArticles();
const results = [];

for (const article of articles) {
  if (article.publishedAt > finalDataEnd) continue;

  const d7Window = windowFor(article.publishedAt, 7, finalDataEnd);
  const d28Window = windowFor(article.publishedAt, 28, finalDataEnd);

  const d7 = d7Window.availableDays > 0
    ? await queryPageWindow(article.page, fmt(d7Window.start), fmt(d7Window.end))
    : null;
  const d28 = d28Window.availableDays > 0
    ? await queryPageWindow(article.page, fmt(d28Window.start), fmt(d28Window.end))
    : null;

  results.push({
    slug: article.slug,
    page: article.page,
    publishedAt: fmt(article.publishedAt),
    d7: d7 ? {
      window: { start: fmt(d7Window.start), end: fmt(d7Window.end), availableDays: d7Window.availableDays, complete: d7Window.complete },
      clicks: d7.clicks,
      impressions: d7.impressions,
      ctr: d7.ctr,
      averagePosition: d7.averagePosition,
      uniqueQueries: d7.uniqueQueries,
      top20Queries: d7.top20Queries,
      top10Queries: d7.top10Queries
    } : null,
    d28: d28 ? {
      window: { start: fmt(d28Window.start), end: fmt(d28Window.end), availableDays: d28Window.availableDays, complete: d28Window.complete },
      clicks: d28.clicks,
      impressions: d28.impressions,
      ctr: d28.ctr,
      averagePosition: d28.averagePosition,
      uniqueQueries: d28.uniqueQueries,
      top20Queries: d28.top20Queries,
      top10Queries: d28.top10Queries
    } : null
  });
}

const report = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  siteUrl,
  publicOrigin,
  finalDataEnd: fmt(finalDataEnd),
  articleCount: results.length,
  completeD28Count: results.filter((row) => row.d28?.window.complete).length,
  articles: results
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'gsc-28d.json'), JSON.stringify(report, null, 2) + '\n');

const lines = [
  '# JoyLab GSC D7 / D28 Article Report',
  '',
  `- Final data end: **${report.finalDataEnd}**`,
  `- Articles: **${report.articleCount}**`,
  `- Complete D28: **${report.completeD28Count}**`,
  '',
  '| Slug | D7 Imp | D7 Pos | D7 Queries | D28 Imp | D28 CTR | D28 Pos | D28 Queries | D28 Complete |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |'
];
for (const row of results) {
  const d7 = row.d7;
  const d28 = row.d28;
  lines.push(`| ${row.slug} | ${d7?.impressions ?? 0} | ${d7 ? d7.averagePosition.toFixed(2) : '-'} | ${d7?.uniqueQueries ?? 0} | ${d28?.impressions ?? 0} | ${d28 ? (d28.ctr * 100).toFixed(2) + '%' : '-'} | ${d28 ? d28.averagePosition.toFixed(2) : '-'} | ${d28?.uniqueQueries ?? 0} | ${d28?.window.complete ? 'YES' : 'NO'} |`);
}
const md = lines.join('\n') + '\n';
fs.writeFileSync(path.join(outputDir, 'gsc-28d.md'), md);
console.log(md);

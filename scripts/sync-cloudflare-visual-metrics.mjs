import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.join(root, 'src/data/visual-upgrade-input.json');
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset = 'joylab_events_v1';

if (!accountId || !token) {
  console.log('Cloudflare analytics sync skipped: missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_ANALYTICS_READ_TOKEN.');
  process.exit(0);
}

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
const query = async (sql) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: `${sql}\nFORMAT JSON`
  });
  if (!response.ok) throw new Error(`Cloudflare SQL ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.data ?? payload.result ?? []);
};

const viewsRows = await query(`
  SELECT blob4 AS path, SUM(_sample_interval) AS views
  FROM ${dataset}
  WHERE index1 = 'article_view' AND timestamp > NOW() - INTERVAL '28' DAY
  GROUP BY blob4
`);

const dwellRows = await query(`
  SELECT blob4 AS path, SUM(_sample_interval) AS dwell60
  FROM ${dataset}
  WHERE index1 = 'article_dwell_60' AND timestamp > NOW() - INTERVAL '28' DAY
  GROUP BY blob4
`);

const linkRows = await query(`
  SELECT blob4 AS path, SUM(_sample_interval) AS internalClicks
  FROM ${dataset}
  WHERE index1 = 'article_internal_link_click' AND timestamp > NOW() - INTERVAL '28' DAY
  GROUP BY blob4
`);

const byPath = new Map();
for (const row of viewsRows) byPath.set(row.path, { ...(byPath.get(row.path) ?? {}), views: Number(row.views) || 0 });
for (const row of dwellRows) byPath.set(row.path, { ...(byPath.get(row.path) ?? {}), dwell60: Number(row.dwell60) || 0 });
for (const row of linkRows) byPath.set(row.path, { ...(byPath.get(row.path) ?? {}), internalClicks: Number(row.internalClicks) || 0 });

const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const updated = rows.map((row) => {
  const pathName = `/articles/${row.id}`;
  const metric = byPath.get(pathName) ?? byPath.get(`${pathName}/`);
  if (!metric || !metric.views) return row;
  const dwell60Rate = Math.min(1, (metric.dwell60 ?? 0) / metric.views);
  const internalRate = Math.min(1, (metric.internalClicks ?? 0) / metric.views);
  return {
    ...row,
    views: Math.round(metric.views),
    dwellSeconds: Number((60 * dwell60Rate).toFixed(1)),
    internalLinkPercent: Number((100 * internalRate).toFixed(2)),
    analyticsWindowDays: 28
  };
});

fs.writeFileSync(inputPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`Cloudflare visual metrics synced for ${updated.filter((row) => row.views != null).length} queue rows.`);

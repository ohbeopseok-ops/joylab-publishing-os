import fs from 'node:fs';
import path from 'node:path';

function parseNumberArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildSearchMetrics(queryRows, clickRows, zeroRows) {
  const clicks = new Map(clickRows.map((row) => [String(row.query), Number(row.clicks) || 0]));
  const zeros = new Map(zeroRows.map((row) => [String(row.query), Number(row.zeros) || 0]));
  return queryRows
    .map((row) => {
      const query = String(row.query || '').trim();
      const searches = Number(row.searches) || 0;
      const queryClicks = clicks.get(query) || 0;
      const zeroResults = zeros.get(query) || 0;
      return {
        query,
        searches: Math.round(searches),
        clicks: Math.round(queryClicks),
        ctr: searches > 0 ? round((queryClicks / searches) * 100) : 0,
        zeroResults: Math.round(zeroResults),
        zeroRate: searches > 0 ? round((zeroResults / searches) * 100) : 0
      };
    })
    .filter((row) => row.query)
    .sort((a,b) => b.searches - a.searches || b.clicks - a.clicks || a.query.localeCompare(b.query, 'ko'));
}

export function buildSummary(metrics) {
  const totalSearches = metrics.reduce((sum, row) => sum + row.searches, 0);
  const totalClicks = metrics.reduce((sum, row) => sum + row.clicks, 0);
  const zeroResultSearches = metrics.reduce((sum, row) => sum + row.zeroResults, 0);
  return {
    totalSearches,
    totalClicks,
    overallCtr: totalSearches > 0 ? round((totalClicks / totalSearches) * 100) : 0,
    zeroResultSearches,
    zeroResultRate: totalSearches > 0 ? round((zeroResultSearches / totalSearches) * 100) : 0,
    uniqueQueries: metrics.length
  };
}

function buildMarkdown({ generatedAt, days, summary, metrics, destinations }) {
  const lines = [
    '# JoyLab Search Dashboard',
    '',
    `- Generated: ${generatedAt}`,
    `- Window: rolling ${days} days`,
    `- Searches: ${summary.totalSearches}`,
    `- Query clicks: ${summary.totalClicks}`,
    `- Overall CTR: ${summary.overallCtr.toFixed(2)}%`,
    `- Zero-result searches: ${summary.zeroResultSearches} (${summary.zeroResultRate.toFixed(2)}%)`,
    `- Unique queries: ${summary.uniqueQueries}`,
    '',
    '## 검색어 TOP20',
    '',
    '| Query | Searches | Clicks | CTR | Zero | Zero Rate |',
    '| --- | ---: | ---: | ---: | ---: | ---: |'
  ];
  for (const row of metrics.slice(0, 20)) {
    lines.push(`| ${row.query.replace(/\|/g, '\\|')} | ${row.searches} | ${row.clicks} | ${row.ctr.toFixed(2)}% | ${row.zeroResults} | ${row.zeroRate.toFixed(2)}% |`);
  }

  const zeros = metrics.filter((row) => row.zeroResults > 0).sort((a,b) => b.zeroResults - a.zeroResults || b.searches - a.searches);
  lines.push('', '## 0건 검색어', '', '| Query | Zero searches | Total searches |', '| --- | ---: | ---: |');
  if (!zeros.length) lines.push('| - | 0 | 0 |');
  else for (const row of zeros.slice(0, 20)) lines.push(`| ${row.query.replace(/\|/g, '\\|')} | ${row.zeroResults} | ${row.searches} |`);

  lines.push('', '## 클릭 목적지 TOP20', '', '| Destination | Clicks |', '| --- | ---: |');
  if (!destinations.length) lines.push('| - | 0 |');
  else for (const row of destinations.slice(0, 20)) lines.push(`| ${row.target} | ${Math.round(Number(row.clicks) || 0)} |`);

  lines.push('', '## 운영 규칙', '', '- CTR = 해당 검색어로 검색한 횟수 대비 결과 클릭 횟수입니다.', '- 0건 검색어는 콘텐츠 공백·동의어·태그 보강 후보로 봅니다.', '- GPC 또는 Do Not Track 사용자의 이벤트는 수집하지 않으므로 전체 방문자 수와 동일하지 않습니다.', '- 검색어는 최대 60자로 정규화하며 허용 문자만 Analytics Engine에 저장합니다.', '');
  return `${lines.join('\n')}\n`;
}

function buildHtml({ generatedAt, days, summary, metrics, destinations }) {
  const topRows = metrics.slice(0, 20).map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.query)}</td><td>${row.searches}</td><td>${row.clicks}</td><td>${row.ctr.toFixed(2)}%</td><td>${row.zeroResults}</td></tr>`).join('');
  const zeroRows = metrics.filter((row) => row.zeroResults > 0).sort((a,b) => b.zeroResults - a.zeroResults || b.searches - a.searches).slice(0, 20)
    .map((row) => `<tr><td>${escapeHtml(row.query)}</td><td>${row.zeroResults}</td><td>${row.searches}</td></tr>`).join('') || '<tr><td colspan="3">0건 검색어 없음</td></tr>';
  const destinationRows = destinations.slice(0, 20).map((row) => `<tr><td>${escapeHtml(row.target)}</td><td>${Math.round(Number(row.clicks) || 0)}</td></tr>`).join('') || '<tr><td colspan="2">클릭 데이터 없음</td></tr>';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>JoyLab Search Dashboard</title><style>body{margin:0;background:#f4f7fb;color:#14284a;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{width:min(calc(100% - 32px),1180px);margin:0 auto;padding:42px 0 70px}.eyebrow{color:#1677ff;font-size:12px;font-weight:900;letter-spacing:.12em}h1{margin:8px 0 6px;font-size:clamp(32px,5vw,58px);letter-spacing:-.05em}.meta{color:#718097}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:26px 0}.card{padding:18px;border:1px solid #dfe6f0;border-radius:14px;background:#fff}.card b{display:block;font-size:26px}.card span{color:#718097;font-size:12px}section{margin-top:30px;padding:22px;border:1px solid #dfe6f0;border-radius:16px;background:#fff}h2{margin:0 0 14px;font-size:20px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:10px;border-bottom:1px solid #edf1f6;text-align:left}th{color:#718097;font-size:12px}@media(max-width:800px){.cards{grid-template-columns:1fr 1fr}.card:last-child{grid-column:1/-1}section{overflow:auto}}</style></head><body><main class="wrap"><div class="eyebrow">JOYLAB SEARCH OPERATIONS</div><h1>Search Dashboard</h1><p class="meta">Rolling ${days} days · generated ${escapeHtml(generatedAt)}</p><div class="cards"><div class="card"><b>${summary.totalSearches}</b><span>Searches</span></div><div class="card"><b>${summary.totalClicks}</b><span>Query Clicks</span></div><div class="card"><b>${summary.overallCtr.toFixed(2)}%</b><span>CTR</span></div><div class="card"><b>${summary.zeroResultRate.toFixed(2)}%</b><span>Zero-result rate</span></div><div class="card"><b>${summary.uniqueQueries}</b><span>Unique queries</span></div></div><section><h2>검색어 TOP20</h2><table><thead><tr><th>#</th><th>Query</th><th>Searches</th><th>Clicks</th><th>CTR</th><th>Zero</th></tr></thead><tbody>${topRows}</tbody></table></section><section><h2>0건 검색어</h2><table><thead><tr><th>Query</th><th>Zero searches</th><th>Total searches</th></tr></thead><tbody>${zeroRows}</tbody></table></section><section><h2>클릭 목적지 TOP20</h2><table><thead><tr><th>Destination</th><th>Clicks</th></tr></thead><tbody>${destinationRows}</tbody></table></section></main></body></html>`;
}

function selfTest() {
  const metrics = buildSearchMetrics(
    [{ query:'codex', searches:10 }, { query:'없는검색', searches:4 }],
    [{ query:'codex', clicks:6 }],
    [{ query:'없는검색', zeros:4 }]
  );
  const summary = buildSummary(metrics);
  if (summary.totalSearches !== 14 || summary.totalClicks !== 6 || summary.overallCtr !== 42.86 || summary.zeroResultRate !== 28.57) {
    throw new Error(`Search dashboard self-test failed: ${JSON.stringify(summary)}`);
  }
  if (metrics[0].query !== 'codex' || metrics[1].zeroResults !== 4) throw new Error('Search dashboard ranking self-test failed.');
  console.log('Search Dashboard report self-test passed.');
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const days = Math.max(1, Math.min(90, Math.round(parseNumberArg('days', 7))));
const outDirArg = process.argv.find((arg) => arg.startsWith('--out-dir='))?.slice('--out-dir='.length) || 'qa-artifacts/search-dashboard';
const outDir = path.resolve(process.cwd(), outDirArg);
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset = 'joylab_events_v1';

if (!accountId || !token) throw new Error('Search Dashboard requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_READ_TOKEN.');

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
const querySql = async (sql) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: `${sql}\nFORMAT JSON`
  });
  if (!response.ok) throw new Error(`Cloudflare SQL ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.data ?? payload.result ?? []);
};

const queryRows = await querySql(`
  SELECT blob2 AS query, SUM(_sample_interval) AS searches
  FROM ${dataset}
  WHERE index1 = 'search_query' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob2
  ORDER BY searches DESC
  LIMIT 500
`);
const clickRows = await querySql(`
  SELECT blob2 AS query, SUM(_sample_interval) AS clicks
  FROM ${dataset}
  WHERE index1 = 'search_query_click' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob2
  ORDER BY clicks DESC
  LIMIT 500
`);
const zeroRows = await querySql(`
  SELECT blob2 AS query, SUM(_sample_interval) AS zeros
  FROM ${dataset}
  WHERE index1 = 'search_zero_result' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob2
  ORDER BY zeros DESC
  LIMIT 500
`);
const destinations = await querySql(`
  SELECT blob2 AS target, SUM(_sample_interval) AS clicks
  FROM ${dataset}
  WHERE index1 = 'search_result_click' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob2
  ORDER BY clicks DESC
  LIMIT 50
`);

const metrics = buildSearchMetrics(queryRows, clickRows, zeroRows);
const summary = buildSummary(metrics);
const generatedAt = new Date().toISOString();
const report = { generatedAt, windowDays: days, summary, metrics, destinations: destinations.map((row) => ({ target: row.target, clicks: Math.round(Number(row.clicks) || 0) })) };

fs.mkdirSync(outDir, { recursive: true });
const baseName = `search-dashboard-${days}d`;
fs.writeFileSync(path.join(outDir, `${baseName}.json`), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, `${baseName}.md`), buildMarkdown({ generatedAt, days, summary, metrics, destinations }));
fs.writeFileSync(path.join(outDir, `${baseName}.html`), buildHtml({ generatedAt, days, summary, metrics, destinations }));
console.log(`Search Dashboard generated: ${outDir}`);

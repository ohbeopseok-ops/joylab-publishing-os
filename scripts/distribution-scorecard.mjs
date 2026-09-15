import fs from 'node:fs';
import path from 'node:path';

const argValue = (args, flag, fallback) => { const i = args.indexOf(flag); return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback; };
function safeRate(a, b) { return b > 0 ? a / b : 0; }
function round4(n) { return Math.round(n * 10000) / 10000; }

export function buildScorecard(metrics) {
  const rows = (metrics.rows || []).map((row) => ({
    ...row,
    ctr: round4(safeRate(row.clicks || 0, row.impressions || 0)),
    dwell60Rate: round4(safeRate(row.dwell60 || 0, row.siteSessions || 0)),
    internalLinkRate: round4(safeRate(row.internalLinkClicks || 0, row.siteSessions || 0)),
    articleCtaRate: round4(safeRate(row.articleCta || 0, row.siteSessions || 0))
  }));
  const total = rows.reduce((acc, row) => {
    for (const key of ['impressions','clicks','siteSessions','dwell60','internalLinkClicks','articleCta']) acc[key] += row[key] || 0;
    return acc;
  }, { impressions:0, clicks:0, siteSessions:0, dwell60:0, internalLinkClicks:0, articleCta:0 });
  const qualifiedVisits = total.dwell60 + total.internalLinkClicks;
  return {
    generatedAt: new Date().toISOString(), windowHours: metrics.windowHours || null,
    articleSlug: metrics.articleSlug,
    status: total.siteSessions > 0 ? 'MEASURED' : 'WAITING_FOR_DATA',
    totals: { ...total, ctr: round4(safeRate(total.clicks, total.impressions)), qualifiedVisits }, rows
  };
}

if (process.argv.includes('--self-test')) {
  const report = buildScorecard({ articleSlug:'demo', windowHours:24, rows:[{channel:'x',variantId:'x_hook_a',impressions:100,clicks:10,siteSessions:8,dwell60:4,internalLinkClicks:2,articleCta:1}] });
  if (report.totals.ctr !== 0.1 || report.totals.qualifiedVisits !== 6) throw new Error('Scorecard self-test failed.');
  console.log('Distribution scorecard self-test passed.');
  process.exit(0);
}

const args = process.argv.slice(2);
const input = argValue(args, '--input');
const out = argValue(args, '--out');
if (!input) throw new Error('Usage: node scripts/distribution-scorecard.mjs --input <metrics.json> [--out <report.json>]');
const metrics = JSON.parse(fs.readFileSync(input, 'utf8'));
const report = buildScorecard(metrics);
const output = out || `distribution/scorecards/${metrics.articleSlug}-${metrics.windowHours || 'window'}h.json`;
fs.mkdirSync(path.dirname(output), { recursive:true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.status}: ${output}`);

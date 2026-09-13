import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rules = JSON.parse(fs.readFileSync(path.join(root, 'src/data/visual-upgrade-scoring.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(path.join(root, 'src/data/visual-upgrade-input.json'), 'utf8'));
const present = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const eligible = rows.filter((row) => row.visualMode === 'AUTO-BASELINE');
const trafficValue = (row) => present(row.views) ? row.views : (present(row.searchClicks) ? row.searchClicks : null);
const maxTraffic = Math.max(1, ...eligible.map((row) => trafficValue(row) ?? 0));

const results = rows.map((row) => {
  if (row.visualMode !== 'AUTO-BASELINE') return { ...row, score: 0, confidence: 'HIGH', coverage: 1, status: 'INELIGIBLE', reasons: ['already curated'] };
  const traffic = trafficValue(row);
  const components = [
    ['traffic', present(traffic) ? clamp01(traffic / maxTraffic) : null, present(row.views) ? 'site views' : 'search clicks'],
    ['dwell', present(row.dwellSeconds) ? clamp01(row.dwellSeconds / rules.normalization.dwell.targetSeconds) : null, '60s dwell qualification'],
    ['ctr', present(row.ctrPercent) ? clamp01(row.ctrPercent / rules.normalization.ctr.targetPercent) : null, 'search CTR'],
    ['internalLink', present(row.internalLinkPercent) ? clamp01(row.internalLinkPercent / rules.normalization.internalLink.targetPercent) : null, 'internal link CTR'],
    ['strategicPriority', clamp01(row.strategicPriority / rules.normalization.strategicPriority.max), 'strategic priority']
  ];
  const availableWeight = components.reduce((sum, [key, value]) => sum + (value === null ? 0 : rules.weights[key]), 0);
  const weighted = components.reduce((sum, [key, value]) => sum + (value === null ? 0 : value * rules.weights[key]), 0);
  const coverage = availableWeight / rules.maxScore;
  const score = availableWeight ? Math.round((weighted / availableWeight) * rules.maxScore) : 0;
  const confidence = coverage >= rules.dataQuality.high ? 'HIGH' : coverage >= rules.dataQuality.medium ? 'MEDIUM' : 'LOW';
  const status = coverage < rules.dataQuality.medium ? 'PROVISIONAL' : score >= rules.thresholds.CURATE_NOW ? 'CURATE_NOW' : score >= rules.thresholds.QUEUE ? 'QUEUE' : 'MONITOR';
  const reasons = components.filter(([,value]) => value !== null).sort((a,b) => b[1]*rules.weights[b[0]] - a[1]*rules.weights[a[0]]).slice(0,3).map(([key,value,label]) => `${label}: ${Math.round(value*100)}% (${rules.weights[key]}pt weight)`);
  return { ...row, score, confidence, coverage, status, reasons };
}).sort((a,b) => b.score-a.score);

const output = path.join(root, '.visual-upgrade-runtime.json');
fs.writeFileSync(output, `${JSON.stringify(results, null, 2)}\n`);
const curateNow = results.filter((row) => row.status === 'CURATE_NOW' && row.confidence !== 'LOW');
console.log(`Visual Upgrade Runtime: ${curateNow.length} CURATE_NOW candidates.`);
for (const row of curateNow) console.log(`- ${row.id}: ${row.score}/100 ${row.confidence}`);

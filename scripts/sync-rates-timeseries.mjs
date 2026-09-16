import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const rulesPath = path.join(root, 'src/data/rates-signal-rules-v1-1.json');
const dashboardPath = path.join(root, 'src/data/rates-dashboard.json');
const outputPath = path.join(root, 'src/data/rates-timeseries.json');
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
const WINDOW = 30;
const statusRank = { GREEN: 0, YELLOW: 1, RED: 2 };

function classify(value, bands) {
  if (value < bands.greenBelow) return 'GREEN';
  if (value < bands.yellowBelow) return 'YELLOW';
  return 'RED';
}

function worst(a, b) {
  return statusRank[a] >= statusRank[b] ? a : b;
}

function gradeRisk(value) {
  if (value >= 65) return 'RED';
  if (value >= 35) return 'YELLOW';
  return 'GREEN';
}

function parseFredCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const points = [];
  for (const line of lines.slice(1)) {
    const [date, raw] = line.split(',');
    const value = Number(raw);
    if (!date || !Number.isFinite(value)) continue;
    points.push({ date, value });
  }
  return points;
}

async function fetchFred(seriesId, startDate) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}&cosd=${startDate}`;
  const response = await fetch(url, { headers: { 'user-agent': 'JoyLab-RatesSync/1.1' } });
  if (!response.ok) throw new Error(`FRED ${seriesId} failed: ${response.status}`);
  const points = parseFredCsv(await response.text());
  if (points.length < WINDOW) throw new Error(`FRED ${seriesId} returned only ${points.length} valid observations`);
  return { points: points.slice(-WINDOW), url };
}

async function fetchUsdKrw(startDate) {
  const url = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW&from=${startDate}`;
  const response = await fetch(url, { headers: { 'user-agent': 'JoyLab-RatesSync/1.1' } });
  if (!response.ok) throw new Error(`Frankfurter USD/KRW failed: ${response.status}`);
  const rows = await response.json();
  const points = rows
    .filter((row) => row.quote === 'KRW' && Number.isFinite(Number(row.rate)) && row.date)
    .map((row) => ({ date: row.date, value: Number(row.rate) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < WINDOW) throw new Error(`Frankfurter USD/KRW returned only ${points.length} valid observations`);
  return { points: points.slice(-WINDOW), url };
}

function buildSeries(key, points, source, sourceUrl) {
  if (points.length !== WINDOW) throw new Error(`${key} must contain exactly ${WINDOW} observations`);
  const current = points.at(-1).value;
  const first = points[0].value;
  const rule = rules.series[key];
  const isRate = key !== 'usdkrw';
  const momentum = isRate ? Number(((current - first) * 100).toFixed(1)) : Number((current - first).toFixed(1));
  const levelStatus = classify(current, rule.level);
  const momentumBands = isRate ? rule.momentum30dBp : rule.momentum30dWon;
  const momentumStatus = classify(momentum, momentumBands);
  const combinedStatus = worst(levelStatus, momentumStatus);
  const stressScore = rules.statusScore[combinedStatus];
  return {
    label: rule.label,
    unit: isRate ? '%' : '원',
    source,
    sourceUrl,
    observedAt: points.at(-1).date,
    points,
    current,
    ...(isRate ? { momentum30dBp: momentum } : { momentum30dWon: momentum }),
    levelStatus,
    momentumStatus,
    combinedStatus,
    stressScore
  };
}

function computeMarketRisk(series) {
  const value = Math.round(Object.entries(series).reduce((sum, [key, item]) => {
    return sum + item.stressScore * rules.series[key].marketRiskWeight;
  }, 0));
  return { value, grade: gradeRisk(value) };
}

function computeTreasuryRiskIndex(marketRisk) {
  const auctionWeakness = 100 - dashboard.scores.auction.value;
  const ticStress = 100 - dashboard.scores.tic.value;
  const w = rules.treasuryRiskIndex.weights;
  const rawContributions = {
    marketRisk: marketRisk.value * w.marketRisk,
    auctionWeakness: auctionWeakness * w.auctionWeakness,
    ticStress: ticStress * w.ticStress
  };
  const contributions = {
    marketRisk: Math.round(rawContributions.marketRisk),
    auctionWeakness: Math.round(rawContributions.auctionWeakness),
    ticStress: Math.round(rawContributions.ticStress)
  };
  const value = Math.round(Object.values(rawContributions).reduce((sum, item) => sum + item, 0));
  const driverLabels = {
    marketRisk: 'Market Risk',
    auctionWeakness: 'Auction Weakness',
    ticStress: 'TIC Stress'
  };
  const dominantDriverKey = Object.entries(rawContributions).sort((a, b) => b[1] - a[1])[0][0];
  return {
    version: '1.1',
    value,
    grade: gradeRisk(value),
    components: {
      marketRisk: marketRisk.value,
      auctionWeakness,
      ticStress
    },
    contributions,
    dominantDriver: {
      key: dominantDriverKey,
      label: driverLabels[dominantDriverKey],
      points: contributions[dominantDriverKey]
    },
    weights: w
  };
}

function updateDashboard(timeseries) {
  const next = structuredClone(dashboard);
  const mapStatus = (status) => status === 'RED' ? 'danger' : status === 'YELLOW' ? 'warning' : 'neutral';
  next.asOf = [timeseries.series.us10y.observedAt, timeseries.series.us30y.observedAt, timeseries.series.usdkrw.observedAt].sort().at(-1);
  next.updatedAt = timeseries.generatedAt;
  next.series.us10y = {
    label: '미국 10년물', value: timeseries.series.us10y.current, unit: '%',
    status: mapStatus(timeseries.series.us10y.combinedStatus), source: 'FRED DGS10', observedAt: timeseries.series.us10y.observedAt
  };
  next.series.us30y = {
    label: '미국 30년물', value: timeseries.series.us30y.current, unit: '%',
    status: mapStatus(timeseries.series.us30y.combinedStatus), source: 'FRED DGS30', observedAt: timeseries.series.us30y.observedAt
  };
  next.series.usdkrw = {
    label: '원·달러', value: timeseries.series.usdkrw.current, unit: '원',
    status: mapStatus(timeseries.series.usdkrw.combinedStatus), source: 'Frankfurter official-source blend', observedAt: timeseries.series.usdkrw.observedAt
  };
  next.series.spread30y10y = {
    label: '30Y-10Y 스프레드',
    value: Math.round((timeseries.series.us30y.current - timeseries.series.us10y.current) * 100),
    unit: 'bp',
    status: next.series.spread30y10y.status,
    source: 'Derived from FRED DGS30 - DGS10'
  };
  next.scores.marketRiskV11 = {
    value: timeseries.marketRisk.value,
    grade: timeseries.marketRisk.grade,
    higherIsWorse: true,
    method: 'US10Y 40% + US30Y 40% + USD/KRW 20%; each stress=max(Level,30D Momentum), GREEN=20/YELLOW=50/RED=80',
    period: `${timeseries.series.us10y.points[0].date}~${next.asOf}`
  };
  next.scores.treasuryRiskV11 = {
    value: timeseries.treasuryRiskIndex.value,
    grade: timeseries.treasuryRiskIndex.grade,
    higherIsWorse: true,
    method: 'Market Risk 50% + Auction Weakness 30% + TIC Stress 20%',
    version: '1.1',
    contributions: timeseries.treasuryRiskIndex.contributions,
    dominantDriver: timeseries.treasuryRiskIndex.dominantDriver
  };
  return next;
}

function selfTest() {
  assert.equal(classify(4.49, rules.series.us10y.level), 'GREEN');
  assert.equal(classify(4.75, rules.series.us10y.level), 'YELLOW');
  assert.equal(classify(5.01, rules.series.us10y.level), 'RED');
  assert.equal(worst('GREEN', 'RED'), 'RED');
  const pts = Array.from({ length: 30 }, (_, i) => ({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, value: 4.4 + i * 0.01 }));
  const s = buildSeries('us10y', pts, 'self-test', 'https://example.com');
  assert.equal(s.points.length, 30);
  assert.equal(s.momentum30dBp, 29);
  assert.equal(s.combinedStatus, 'YELLOW');
  const originalAuction = dashboard.scores.auction.value;
  const originalTic = dashboard.scores.tic.value;
  dashboard.scores.auction.value = 100;
  dashboard.scores.tic.value = 62;
  const risk = computeTreasuryRiskIndex({ value: 80, grade: 'RED' });
  assert.deepEqual(risk.contributions, { marketRisk: 40, auctionWeakness: 0, ticStress: 8 });
  assert.equal(risk.value, 48);
  assert.equal(risk.dominantDriver.key, 'marketRisk');
  dashboard.scores.auction.value = originalAuction;
  dashboard.scores.tic.value = originalTic;
  console.log('rates sync self-test passed');
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const now = new Date();
const start = new Date(now);
start.setUTCDate(start.getUTCDate() - 75);
const startDate = start.toISOString().slice(0, 10);

const [us10yRaw, us30yRaw, usdkrwRaw] = await Promise.all([
  fetchFred('DGS10', startDate),
  fetchFred('DGS30', startDate),
  fetchUsdKrw(startDate)
]);

const series = {
  us10y: buildSeries('us10y', us10yRaw.points, 'Federal Reserve Board via FRED · DGS10', us10yRaw.url),
  us30y: buildSeries('us30y', us30yRaw.points, 'Federal Reserve Board via FRED · DGS30', us30yRaw.url),
  usdkrw: buildSeries('usdkrw', usdkrwRaw.points, 'Frankfurter · official-source blend', usdkrwRaw.url)
};
const marketRisk = computeMarketRisk(series);
const treasuryRiskIndex = computeTreasuryRiskIndex(marketRisk);
const asOf = Object.values(series).map((item) => item.observedAt).sort().at(-1);
const timeseries = {
  version: '1.1',
  ready: true,
  asOf,
  generatedAt: new Date().toISOString(),
  windowTradingDays: WINDOW,
  series,
  marketRisk,
  treasuryRiskIndex
};

fs.writeFileSync(outputPath, `${JSON.stringify(timeseries, null, 2)}\n`, 'utf8');
fs.writeFileSync(dashboardPath, `${JSON.stringify(updateDashboard(timeseries), null, 2)}\n`, 'utf8');
console.log(`Synced rates through ${asOf}; Market Risk ${marketRisk.value}; Treasury Risk V1.1 ${treasuryRiskIndex.value}; contributions M/A/T ${treasuryRiskIndex.contributions.marketRisk}/${treasuryRiskIndex.contributions.auctionWeakness}/${treasuryRiskIndex.contributions.ticStress}.`);

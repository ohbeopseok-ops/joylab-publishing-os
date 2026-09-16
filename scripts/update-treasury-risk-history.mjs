import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const timeseriesPath = path.join(root, 'src/data/rates-timeseries.json');
const dashboardPath = path.join(root, 'src/data/rates-dashboard.json');
const historyPath = path.join(root, 'src/data/treasury-risk-history.json');
const MAX_SNAPSHOTS = 60;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const timeseries = readJson(timeseriesPath);
const dashboard = readJson(dashboardPath);
const history = fs.existsSync(historyPath) ? readJson(historyPath) : { version: '1.0', snapshots: [] };

function sign(n) {
  return n > 0 ? `+${n}` : `${n}`;
}

function classifyDelta(delta) {
  if (delta >= 10) return { level: 'ALERT', direction: 'RISING' };
  if (delta >= 5) return { level: 'WATCH', direction: 'RISING' };
  if (delta <= -10) return { level: 'EASING', direction: 'FALLING' };
  if (delta <= -5) return { level: 'COOLING', direction: 'FALLING' };
  return { level: 'STABLE', direction: delta > 0 ? 'RISING' : delta < 0 ? 'FALLING' : 'FLAT' };
}

function snapshotFrom(data) {
  const risk = data.treasuryRiskIndex;
  return {
    asOf: data.asOf,
    capturedAt: data.generatedAt,
    index: risk.value,
    grade: risk.grade,
    contributions: { ...risk.contributions },
    components: { ...risk.components }
  };
}

function sameSnapshot(a, b) {
  return a && b && a.asOf === b.asOf && a.index === b.index &&
    a.contributions.marketRisk === b.contributions.marketRisk &&
    a.contributions.auctionWeakness === b.contributions.auctionWeakness &&
    a.contributions.ticStress === b.contributions.ticStress;
}

function computeDelta(previous, current) {
  if (!previous) return null;
  const components = {
    marketRisk: current.contributions.marketRisk - previous.contributions.marketRisk,
    auctionWeakness: current.contributions.auctionWeakness - previous.contributions.auctionWeakness,
    ticStress: current.contributions.ticStress - previous.contributions.ticStress
  };
  const indexDelta = current.index - previous.index;
  const drivers = [
    { key: 'marketRisk', label: 'Market', delta: components.marketRisk },
    { key: 'auctionWeakness', label: 'Auction', delta: components.auctionWeakness },
    { key: 'ticStress', label: 'TIC', delta: components.ticStress }
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const state = classifyDelta(indexDelta);
  const primary = drivers[0];
  const interpretation = indexDelta === 0
    ? '전일 대비 Treasury Risk Index는 변하지 않았습니다.'
    : primary.delta > 0
      ? `전일 대비 위험 변화의 가장 큰 상승 요인은 ${primary.label} ${sign(primary.delta)}점입니다.`
      : `전일 대비 위험 변화에서 가장 큰 완화 요인은 ${primary.label} ${sign(primary.delta)}점입니다.`;
  return {
    from: previous.index,
    to: current.index,
    delta: indexDelta,
    gradeFrom: previous.grade,
    gradeTo: current.grade,
    components,
    primaryDriver: primary,
    alert: state,
    interpretation,
    formula: `${previous.index} → ${current.index} (${sign(indexDelta)}): Market ${sign(components.marketRisk)} / Auction ${sign(components.auctionWeakness)} / TIC ${sign(components.ticStress)}`
  };
}

function selfTest() {
  const previous = { index: 48, grade: 'YELLOW', contributions: { marketRisk: 40, auctionWeakness: 0, ticStress: 8 } };
  const current = { index: 55, grade: 'YELLOW', contributions: { marketRisk: 50, auctionWeakness: -2, ticStress: 7 } };
  const result = computeDelta(previous, current);
  assert.equal(result.delta, 7);
  assert.deepEqual(result.components, { marketRisk: 10, auctionWeakness: -2, ticStress: -1 });
  assert.equal(result.primaryDriver.key, 'marketRisk');
  assert.equal(result.alert.level, 'WATCH');
  assert.equal(result.formula, '48 → 55 (+7): Market +10 / Auction -2 / TIC -1');
  assert.equal(classifyDelta(10).level, 'ALERT');
  assert.equal(classifyDelta(-10).level, 'EASING');
  console.log('Treasury risk history self-test passed');
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

if (!timeseries.ready || !timeseries.treasuryRiskIndex?.contributions) {
  throw new Error('Treasury Risk V1.1 contributions are required before history update');
}

const current = snapshotFrom(timeseries);
const existing = Array.isArray(history.snapshots) ? history.snapshots : [];
const previousDistinct = [...existing].reverse().find((item) => !sameSnapshot(item, current)) || null;
const delta = computeDelta(previousDistinct, current);

let snapshots = existing.filter((item) => !sameSnapshot(item, current));
snapshots.push(current);
snapshots = snapshots.slice(-MAX_SNAPSHOTS);

const nextHistory = {
  version: '1.0',
  updatedAt: timeseries.generatedAt,
  maxSnapshots: MAX_SNAPSHOTS,
  latestDelta: delta,
  snapshots
};

timeseries.treasuryRiskIndex.deltaAttribution = delta;
dashboard.scores.treasuryRiskV11.deltaAttribution = delta;

fs.writeFileSync(historyPath, `${JSON.stringify(nextHistory, null, 2)}\n`, 'utf8');
fs.writeFileSync(timeseriesPath, `${JSON.stringify(timeseries, null, 2)}\n`, 'utf8');
fs.writeFileSync(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8');

console.log(delta
  ? `Treasury Risk Delta: ${delta.formula} · ${delta.alert.level}`
  : `Treasury Risk history baseline established at ${current.index}/100 (${current.asOf}).`);

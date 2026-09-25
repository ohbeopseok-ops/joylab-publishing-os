import fs from 'node:fs';
import assert from 'node:assert/strict';

const MODEL_PATH = 'src/data/china-semiconductor-risk-v1.1.json';
const SNAPSHOT_PATH = 'src/data/china-semiconductor-risk-snapshot.json';
const HISTORY_PATH = 'src/data/china-semiconductor-risk-history.json';
const SELF_TEST = process.argv.includes('--self-test');

const readJson = (path) => JSON.parse(fs.readFileSync(path,'utf8'));
const model = readJson(MODEL_PATH);
const snapshot = readJson(SNAPSHOT_PATH);
const history = fs.existsSync(HISTORY_PATH) ? readJson(HISTORY_PATH) : {version:'1.0',granularity:'quarter',snapshots:[]};

function quarterFromIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ISO date: ${iso}`);
  const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()}Q${quarter}`;
}

function getBand(score) {
  return model.bands.find((band) => score >= band.min && score <= band.max)?.label ?? 'UNKNOWN';
}

function computeDimension(metricRows, dimension = null) {
  const selected = metricRows.filter((row) => row.status === 'OK' && (!dimension || row.dimension === dimension));
  const weight = selected.reduce((sum,row) => sum + row.weight,0);
  if (!weight) return {score:null,weight:0,count:0,band:'UNKNOWN'};
  const points = selected.reduce((sum,row) => sum + row.score * row.weight / 100,0);
  const score = Math.round((points / weight) * 100);
  return {score,weight,count:selected.length,band:getBand(score)};
}

function buildSnapshot(modelData, liveSnapshot) {
  const metricRows = modelData.metrics.map((metric) => {
    const live = liveSnapshot.metrics?.[metric.id];
    return {
      id:metric.id,
      dimension:metric.dimension,
      weight:metric.weight,
      status:live?.status ?? 'UNKNOWN',
      score:live?.status === 'OK' ? live.score : null,
      value:live?.status === 'OK' ? live.value : null,
      unit:live?.status === 'OK' ? live.unit : null,
      source:live?.status === 'OK' ? live.source : null,
      observedAt:live?.status === 'OK' ? live.observedAt ?? null : null
    };
  });
  const total = computeDimension(metricRows);
  const structural = computeDimension(metricRows,'structural');
  const earnings = computeDimension(metricRows,'earnings');
  return {
    period:quarterFromIso(liveSnapshot.generatedAt),
    capturedAt:liveSnapshot.generatedAt,
    totalScore:total.score,
    totalBand:total.band,
    structuralScore:structural.score,
    structuralBand:structural.band,
    earningsScore:earnings.score,
    earningsBand:earnings.band,
    coverageWeight:total.weight,
    metricsReady:total.count,
    source:'risk-data-adapter-v1',
    metricState:Object.fromEntries(metricRows.map((row) => [row.id,{
      status:row.status,
      score:row.score,
      value:row.value,
      unit:row.unit,
      source:row.source,
      observedAt:row.observedAt
    }]))
  };
}

function upsertQuarter(existing, current) {
  const next = [...existing.filter((row) => row.period !== current.period), current];
  return next.sort((a,b) => a.period.localeCompare(b.period));
}

function selfTest() {
  assert.equal(quarterFromIso('2026-01-01T00:00:00Z'),'2026Q1');
  assert.equal(quarterFromIso('2026-06-30T23:59:59Z'),'2026Q2');
  assert.equal(quarterFromIso('2026-09-25T10:00:00Z'),'2026Q3');
  assert.equal(quarterFromIso('2026-12-31T23:59:59Z'),'2026Q4');
  const rows=[
    {status:'OK',dimension:'structural',weight:10,score:50},
    {status:'OK',dimension:'structural',weight:10,score:100},
    {status:'OK',dimension:'earnings',weight:20,score:0},
    {status:'UNKNOWN',dimension:'earnings',weight:60,score:null}
  ];
  const total=computeDimension(rows);
  assert.equal(total.weight,40);
  assert.equal(total.score,38);
  const updated=upsertQuarter([{period:'2026Q2',totalScore:31},{period:'2026Q3',totalScore:33}],{period:'2026Q3',totalScore:38});
  assert.equal(updated.length,2);
  assert.equal(updated[1].totalScore,38);
  console.log('China semiconductor quarterly risk history self-test PASS');
}

if (SELF_TEST) {
  selfTest();
  process.exit(0);
}

if (!snapshot.generatedAt) throw new Error('Risk snapshot generatedAt is required');
const current = buildSnapshot(model,snapshot);
const nextHistory = {
  version:'1.0',
  updatedAt:snapshot.generatedAt,
  granularity:'quarter',
  latestPeriod:current.period,
  snapshots:upsertQuarter(Array.isArray(history.snapshots) ? history.snapshots : [],current)
};
fs.writeFileSync(HISTORY_PATH,`${JSON.stringify(nextHistory,null,2)}\n`,'utf8');
console.log(`China Risk History: ${current.period} Total=${current.totalScore ?? 'UNKNOWN'} ${current.totalBand} / Structural=${current.structuralScore ?? 'UNKNOWN'} / Earnings=${current.earningsScore ?? 'UNKNOWN'} / Coverage=${current.coverageWeight}%`);

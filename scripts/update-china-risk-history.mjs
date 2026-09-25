import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const MODEL_PATH = 'src/data/china-semiconductor-risk-v1.1.json';
const SNAPSHOT_PATH = 'src/data/china-semiconductor-risk-snapshot.json';
const HISTORY_PATH = 'src/data/china-semiconductor-risk-history.json';
const SELF_TEST = process.argv.includes('--self-test');
const MAX_QUARTERS = 24;
const MAX_REVISIONS_PER_QUARTER = 16;

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const model = readJson(MODEL_PATH);
const snapshot = readJson(SNAPSHOT_PATH);
const history = fs.existsSync(HISTORY_PATH)
  ? readJson(HISTORY_PATH)
  : { version:'1.0', quarters:[] };

function quarterFromIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid timestamp: ${iso}`);
  return `${d.getUTCFullYear()}Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

function bandFor(score) {
  return model.bands.find((band) => score >= band.min && score <= band.max)?.label ?? 'UNKNOWN';
}

function resolveMetrics(model, snapshot) {
  return model.metrics.map((metric) => {
    const live = snapshot.metrics?.[metric.id];
    const current = live?.status === 'OK'
      ? {
          value:live.value, unit:live.unit, score:live.score,
          asOf:live.observedAt ?? live.fetchedAt?.slice(0,10) ?? null,
          source:live.source ?? null, sourceUrl:live.sourceUrl ?? null,
          freshness:'LIVE'
        }
      : metric.current
        ? { ...metric.current, freshness:live?.status === 'STALE' ? 'STALE' : 'SEED' }
        : null;
    return { ...metric, current, liveStatus:live?.status ?? 'MISSING' };
  });
}

function scoreDimension(metrics, dimension = null) {
  const known = metrics.filter((metric) => metric.current && (!dimension || metric.dimension === dimension));
  const weight = known.reduce((sum, metric) => sum + metric.weight, 0);
  const points = known.reduce((sum, metric) => sum + metric.current.score * metric.weight / 100, 0);
  return {
    score: weight ? Math.round((points / weight) * 100) : null,
    coveredWeight: weight,
    knownCount: known.length
  };
}

function materialMetrics(metrics) {
  return Object.fromEntries(metrics.map((metric) => [
    metric.id,
    metric.current ? {
      value:metric.current.value,
      unit:metric.current.unit,
      score:metric.current.score,
      asOf:metric.current.asOf,
      source:metric.current.source,
      freshness:metric.current.freshness
    } : {
      value:null,
      score:null,
      freshness:'UNKNOWN'
    }
  ]));
}

function snapshotState(model, snapshot) {
  const metrics = resolveMetrics(model, snapshot);
  const total = scoreDimension(metrics);
  const structural = scoreDimension(metrics, 'structural');
  const earnings = scoreDimension(metrics, 'earnings');
  const state = {
    capturedAt:snapshot.generatedAt,
    quarter:quarterFromIso(snapshot.generatedAt),
    totalScore:total.score,
    totalBand:total.score === null ? 'UNKNOWN' : bandFor(total.score),
    structuralScore:structural.score,
    structuralBand:structural.score === null ? 'UNKNOWN' : bandFor(structural.score),
    earningsScore:earnings.score,
    earningsBand:earnings.score === null ? 'UNKNOWN' : bandFor(earnings.score),
    coveredWeight:total.coveredWeight,
    knownCount:total.knownCount,
    metrics:materialMetrics(metrics),
    adapterCoverage:snapshot.coverage ?? null
  };
  const canonical = JSON.stringify({
    totalScore:state.totalScore,
    structuralScore:state.structuralScore,
    earningsScore:state.earningsScore,
    coveredWeight:state.coveredWeight,
    metrics:state.metrics
  });
  state.fingerprint = crypto.createHash('sha256').update(canonical).digest('hex').slice(0,16);
  return state;
}

function computeDelta(previous, current) {
  if (!previous) return null;
  const metricDeltas = {};
  for (const [id, value] of Object.entries(current.metrics)) {
    const prev = previous.metrics?.[id];
    if (typeof value?.score === 'number' && typeof prev?.score === 'number') {
      metricDeltas[id] = {
        score:value.score - prev.score,
        value:(typeof value.value === 'number' && typeof prev.value === 'number')
          ? Math.round((value.value - prev.value) * 1000) / 1000
          : null
      };
    }
  }
  return {
    fromQuarter:previous.quarter,
    toQuarter:current.quarter,
    total:current.totalScore - previous.totalScore,
    structural:current.structuralScore - previous.structuralScore,
    earnings:current.earningsScore - previous.earningsScore,
    coveredWeight:current.coveredWeight - previous.coveredWeight,
    metrics:metricDeltas
  };
}

function selfTest() {
  assert.equal(quarterFromIso('2026-01-01T00:00:00Z'),'2026Q1');
  assert.equal(quarterFromIso('2026-09-25T10:00:00Z'),'2026Q3');
  assert.equal(quarterFromIso('2026-12-31T23:00:00Z'),'2026Q4');
  const fakeModel = {
    ...model,
    metrics:[
      {id:'a',weight:60,dimension:'structural',current:{value:1,unit:'%',score:50,asOf:'2026Q2',source:'seed'}},
      {id:'b',weight:40,dimension:'earnings',current:{value:1,unit:'%',score:0,asOf:'2026Q2',source:'seed'}}
    ]
  };
  const fakeSnapshot = {generatedAt:'2026-09-25T00:00:00Z',metrics:{a:{status:'OK',value:2,unit:'%',score:75,observedAt:'2026-09-24',source:'live'}},coverage:{}};
  const state = snapshotState(fakeModel,fakeSnapshot);
  assert.equal(state.quarter,'2026Q3');
  assert.equal(state.totalScore,45);
  assert.equal(state.structuralScore,75);
  assert.equal(state.earningsScore,0);
  console.log('China semiconductor risk history self-test PASS');
}

if (SELF_TEST) {
  selfTest();
  process.exit(0);
}

if (!snapshot.ready) throw new Error('Risk snapshot is not ready; history update aborted.');

const current = snapshotState(model, snapshot);
const quarters = Array.isArray(history.quarters) ? [...history.quarters] : [];
let quarter = quarters.find((item) => item.period === current.quarter);

if (!quarter) {
  quarter = {
    period:current.quarter,
    firstCapturedAt:current.capturedAt,
    lastCapturedAt:current.capturedAt,
    latest:current,
    revisions:[current]
  };
  quarters.push(quarter);
} else {
  const lastRevision = quarter.revisions?.at(-1);
  quarter.lastCapturedAt = current.capturedAt;
  quarter.latest = current;
  if (!lastRevision || lastRevision.fingerprint !== current.fingerprint) {
    quarter.revisions = [...(quarter.revisions ?? []), current].slice(-MAX_REVISIONS_PER_QUARTER);
  }
}

quarters.sort((a,b) => a.period.localeCompare(b.period));
const trimmed = quarters.slice(-MAX_QUARTERS);
const latestStates = trimmed.map((item) => item.latest);
const latest = latestStates.at(-1) ?? null;
const previousQuarter = latestStates.length > 1 ? latestStates.at(-2) : null;
const latestDelta = latest && previousQuarter ? computeDelta(previousQuarter, latest) : null;

const next = {
  version:'1.0',
  updatedAt:snapshot.generatedAt,
  liveHistoryStartsAt:trimmed[0]?.period ?? current.quarter,
  maxQuarters:MAX_QUARTERS,
  latestDelta,
  quarters:trimmed
};

fs.writeFileSync(HISTORY_PATH, `${JSON.stringify(next,null,2)}\n`, 'utf8');

console.log(latestDelta
  ? `China Risk History: ${latestDelta.fromQuarter} → ${latestDelta.toQuarter}, Total ${latestDelta.total >= 0 ? '+' : ''}${latestDelta.total}, Structural ${latestDelta.structural >= 0 ? '+' : ''}${latestDelta.structural}, Earnings ${latestDelta.earnings >= 0 ? '+' : ''}${latestDelta.earnings}`
  : `China Risk History baseline established at ${current.quarter}: ${current.totalScore}/100 ${current.totalBand}`);

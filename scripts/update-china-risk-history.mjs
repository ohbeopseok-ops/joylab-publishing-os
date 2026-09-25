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
      name:metric.name,
      dimension:metric.dimension,
      weight:metric.weight,
      value:metric.current.value,
      unit:metric.current.unit,
      score:metric.current.score,
      asOf:metric.current.asOf,
      source:metric.current.source,
      freshness:metric.current.freshness
    } : {
      name:metric.name,
      dimension:metric.dimension,
      weight:metric.weight,
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

function signed(n, digits = 0) {
  const rounded = Number(Number(n).toFixed(digits));
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

function normalizedContribution(metric, coveredWeight) {
  if (!metric || typeof metric.score !== 'number' || !coveredWeight) return 0;
  return metric.score * metric.weight / coveredWeight;
}


const WATCH_MAP = {
  cxmtShare: '삼성전자·SK하이닉스의 중국향 범용 DRAM 매출 비중과 DRAM ASP',
  ymtcShare: '삼성전자 NAND·SK하이닉스/Solidigm Enterprise SSD 매출 비중과 NAND ASP',
  cxmtCapa: 'CXMT 유효 Bit Supply 증가율과 삼성전자·SK하이닉스 DRAM Bit Growth',
  ymtcEssd: 'YMTC 해외 eSSD 고객 수와 삼성전자·Solidigm Enterprise SSD 매출 성장률',
  equipment: '중국 장비 실제 양산 채택률과 CXMT·YMTC 수율 개선 속도',
  lithography: '중국 첨단 노광·계측의 반복 양산 사용 여부와 첨단공정 수율',
  hbm: '삼성전자·SK하이닉스 HBM4 고객 인증·출하량·HBM 매출 비중',
  dramAsp: '삼성전자·SK하이닉스 분기 DRAM ASP와 HBM 매출 비중',
  nandAsp: '삼성전자 NAND·Solidigm 분기 ASP와 Enterprise SSD 매출 비중',
  overseas: '중국 메모리의 중국 외 고객 수와 삼성전자·SK하이닉스 중국향 매출 비중'
};

function buildInvestmentBrief(previous,current,delta) {
  const attribution = delta?.attribution ?? null;
  const primary = attribution?.primaryDriver ?? null;
  const primaryName = primary?.name ?? '주요 지표';
  const primaryContribution = typeof primary?.contribution === 'number' ? signed(primary.contribution,1) : '0';
  const nextNumber = WATCH_MAP[primary?.id] ?? '삼성전자·SK하이닉스의 DRAM·NAND ASP, HBM 매출 비중, 중국향 매출 비중';

  const direction = delta.total > 0 ? '상승' : delta.total < 0 ? '하락' : '보합';
  const riskLine = `현재 Risk: ${current.totalScore}점(${current.totalBand}) · Structural ${current.structuralScore} · Earnings ${current.earningsScore} · Coverage ${current.coveredWeight}%`;
  const deltaLine = `전분기 변화: ${previous.quarter} → ${current.quarter}, Total ${signed(delta.total)}점(${direction}) · Structural ${signed(delta.structural)} · Earnings ${signed(delta.earnings)}`;
  const causeLine = primary
    ? `가장 큰 원인: ${primaryName}이 Total Risk에 ${primaryContribution}p 기여했습니다.`
    : '가장 큰 원인: 단일 지표의 유의미한 기여도 변화가 확인되지 않았습니다.';
  const nextLine = `다음 확인 숫자: ${nextNumber}`;

  return {
    currentRisk:riskLine,
    quarterChange:deltaLine,
    primaryCause:causeLine,
    nextNumber:nextLine,
    lines:[riskLine,deltaLine,causeLine,nextLine],
    primaryDriverId:primary?.id ?? null,
    generatedRule:'JOYLAB_CHINA_SEMICONDUCTOR_BRIEF_V1'
  };
}

function buildAttribution(previous, current, metricDeltas) {
  const drivers = Object.keys({ ...(previous.metrics ?? {}), ...(current.metrics ?? {}) })
    .map((id) => {
      const prev = previous.metrics?.[id];
      const curr = current.metrics?.[id];
      const reference = curr ?? prev;
      const before = normalizedContribution(prev, previous.coveredWeight);
      const after = normalizedContribution(curr, current.coveredWeight);
      return {
        id,
        name:reference?.name ?? id,
        dimension:reference?.dimension ?? 'unknown',
        weight:reference?.weight ?? null,
        contribution:Math.round((after - before) * 10) / 10,
        scoreDelta:metricDeltas[id]?.score ?? null,
        valueDelta:metricDeltas[id]?.value ?? null,
        beforeScore:typeof prev?.score === 'number' ? prev.score : null,
        afterScore:typeof curr?.score === 'number' ? curr.score : null
      };
    })
    .filter((item) => Math.abs(item.contribution) >= 0.05)
    .sort((a,b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const rising = drivers.filter((item) => item.contribution > 0);
  const easing = drivers.filter((item) => item.contribution < 0);
  const primary = rising[0] ?? easing[0] ?? null;
  const secondary = rising[1] ?? null;
  const mitigator = easing[0] ?? null;
  const totalDelta = current.totalScore - previous.totalScore;
  const bandChanged = previous.totalBand !== current.totalBand;
  const coverageDelta = current.coveredWeight - previous.coveredWeight;

  let headline;
  if (totalDelta > 0) headline = `${current.quarter} Risk Score는 전분기보다 ${totalDelta}점 상승해 ${current.totalScore}점(${current.totalBand})이 됐습니다.`;
  else if (totalDelta < 0) headline = `${current.quarter} Risk Score는 전분기보다 ${Math.abs(totalDelta)}점 하락해 ${current.totalScore}점(${current.totalBand})이 됐습니다.`;
  else headline = `${current.quarter} Risk Score는 ${current.totalScore}점(${current.totalBand})으로 전분기와 같았습니다.`;

  const driverParts = [];
  if (primary) {
    const verb = primary.contribution > 0 ? '높인' : '낮춘';
    driverParts.push(`가장 큰 요인은 ${primary.name}로 Total Risk를 ${signed(primary.contribution,1)}p ${verb} 것으로 계산됩니다`);
  }
  if (secondary && secondary.id !== primary?.id) {
    driverParts.push(`${secondary.name}도 ${signed(secondary.contribution,1)}p 기여했습니다`);
  }
  if (mitigator && mitigator.id !== primary?.id) {
    driverParts.push(`반면 ${mitigator.name}는 ${signed(mitigator.contribution,1)}p 완화했습니다`);
  }

  const notes = [];
  if (bandChanged) notes.push(`등급은 ${previous.totalBand}에서 ${current.totalBand}로 변경됐습니다`);
  if (coverageDelta !== 0) notes.push(`데이터 커버리지는 ${previous.coveredWeight}%에서 ${current.coveredWeight}%로 ${signed(coverageDelta)}%p 변했습니다`);
  if (current.structuralScore !== previous.structuralScore || current.earningsScore !== previous.earningsScore) {
    notes.push(`Structural ${signed(current.structuralScore - previous.structuralScore)}점, Earnings ${signed(current.earningsScore - previous.earningsScore)}점 변화입니다`);
  }

  return {
    headline,
    summary:[headline, driverParts.length ? `${driverParts.join('. ')}.` : '', notes.length ? `${notes.join('. ')}.` : ''].filter(Boolean).join(' '),
    primaryDriver:primary,
    secondaryDriver:secondary,
    mitigatingDriver:mitigator,
    drivers,
    bandChanged,
    coverageChanged:coverageDelta !== 0
  };
}

function computeDelta(previous, current) {
  if (!previous) return null;
  const metricDeltas = {};
  for (const id of new Set([...Object.keys(previous.metrics ?? {}), ...Object.keys(current.metrics ?? {})])) {
    const value = current.metrics?.[id];
    const prev = previous.metrics?.[id];
    metricDeltas[id] = {
      score:(typeof value?.score === 'number' && typeof prev?.score === 'number') ? value.score - prev.score : null,
      value:(typeof value?.value === 'number' && typeof prev?.value === 'number')
        ? Math.round((value.value - prev.value) * 1000) / 1000
        : null,
      status:`${prev?.freshness ?? 'UNKNOWN'}→${value?.freshness ?? 'UNKNOWN'}`
    };
  }
  const delta = {
    fromQuarter:previous.quarter,
    toQuarter:current.quarter,
    total:current.totalScore - previous.totalScore,
    structural:current.structuralScore - previous.structuralScore,
    earnings:current.earningsScore - previous.earningsScore,
    coveredWeight:current.coveredWeight - previous.coveredWeight,
    metrics:metricDeltas
  };
  delta.attribution = buildAttribution(previous,current,metricDeltas);
  delta.investmentBrief = buildInvestmentBrief(previous,current,delta);
  return delta;
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

  const prev = {
    quarter:'2026Q3', totalScore:30, totalBand:'YELLOW', structuralScore:50, earningsScore:0, coveredWeight:100,
    metrics:{
      a:{name:'CXMT DRAM 점유율',dimension:'structural',weight:60,value:1,score:50,freshness:'LIVE'},
      dramAsp:{name:'DRAM ASP 압력',dimension:'earnings',weight:40,value:10,score:0,freshness:'LIVE'}
    }
  };
  const curr = {
    quarter:'2026Q4', totalScore:55, totalBand:'ORANGE', structuralScore:50, earningsScore:63, coveredWeight:100,
    metrics:{
      a:{name:'CXMT DRAM 점유율',dimension:'structural',weight:60,value:1,score:50,freshness:'LIVE'},
      dramAsp:{name:'DRAM ASP 압력',dimension:'earnings',weight:40,value:-6,score:63,freshness:'LIVE'}
    }
  };
  const delta = computeDelta(prev,curr);
  assert.equal(delta.total,25);
  assert.equal(delta.attribution.primaryDriver.id,'dramAsp');
  assert.equal(delta.attribution.bandChanged,true);
  assert.match(delta.attribution.summary,/DRAM ASP 압력/);
  assert.match(delta.attribution.summary,/YELLOW에서 ORANGE/);
  assert.equal(delta.investmentBrief.lines.length,4);
  assert.match(delta.investmentBrief.currentRisk,/현재 Risk:/);
  assert.match(delta.investmentBrief.quarterChange,/전분기 변화:/);
  assert.match(delta.investmentBrief.primaryCause,/DRAM ASP 압력/);
  assert.match(delta.investmentBrief.nextNumber,/삼성전자·SK하이닉스 분기 DRAM ASP/);
  console.log('China semiconductor risk history + attribution + investment brief self-test PASS');
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

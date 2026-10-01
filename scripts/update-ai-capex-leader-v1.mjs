import fs from 'node:fs';

const INPUT = 'src/data/ai-capex-leader-input-v1.json';
const OUTPUT = 'src/data/ai-capex-leader-v1.json';
const HISTORY = 'src/data/ai-capex-leader-history-v1.json';
const EVENTS = 'src/data/ai-capex-regime-events-v1.json';
const MARKET = 'src/data/ai-capex-market-snapshot-v1.json';
const FUNDAMENTAL = 'src/data/ai-capex-fundamental-snapshot-v1.json';
const SELF_TEST = process.argv.includes('--self-test');
const FORCE_SNAPSHOT = process.argv.includes('--force-snapshot');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

const bandFromScore = (score) => score >= 80 ? 'LEADER' : score >= 70 ? 'STRONG-CANDIDATE' : score >= 60 ? 'WATCH' : 'THEME-ONLY';

export function evaluateSkHynixGate(market = {}) {
  const foreignPass = Number(market.foreignNet5dBillionKrw) > 0 && Number(market.foreignBuyDays5d) >= 3;
  const trendPass = Number(market.close) > Number(market.ma20) && Number(market.aboveMa20Days) >= 2 && Number(market.ma20Slope5dPct) >= 0;
  const rsPass = Number(market.rs20pp) >= 2 && Number(market.rs5pp) >= 0;
  return {
    foreignFlow: foreignPass ? 'PASS' : 'FAIL',
    ma20Trend: trendPass ? 'PASS' : 'WATCH',
    relativeStrength: rsPass ? 'PASS' : 'FAIL',
    confirmed: foreignPass && trendPass && rsPass
  };
}

function scoreCompany(company) {
  return ['aiCapexExposure','bottleneck','epsRevision','priceConfirmation']
    .reduce((sum, key) => sum + Number(company[key] || 0), 0);
}

function sanitizePlainText(value, fallback = '') {
  return String(value ?? fallback).replace(/[<>]/g, '').slice(0, 1000);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMarketCompany(base, live, priceConfirmationMax) {
  if (!live || live.ready !== true) return base;
  const rawPriceConfirmation = Number(live.priceConfirmation);
  return {
    ...base,
    priceConfirmation: Number.isFinite(rawPriceConfirmation)
      ? clamp(rawPriceConfirmation, 0, priceConfirmationMax)
      : base.priceConfirmation,
    market: { ...(base.market || {}), ...(live.market || {}) },
    note: sanitizePlainText(live.note, base.note)
  };
}

function normalizeFundamentalCompany(base, live, epsRevisionMax) {
  if (!live) return base;
  const score = Number(live.epsRevisionScore);
  let epsRevision = base.epsRevision;
  if (live.epsReady && Number.isFinite(score)) {
    const bounded = clamp(score, 0, epsRevisionMax);
    if (bounded <= Number(base.epsRevision) || live.irReady === true) epsRevision = bounded;
  }
  return {
    ...base,
    epsRevision,
    fundamental: {
      epsReady: live.epsReady === true,
      irReady: live.irReady === true,
      epsRevisionScore: Number.isFinite(score) ? score : null,
      eps: live.eps || null,
      irEvidence: Array.isArray(live.irEvidence) ? live.irEvidence : []
    }
  };
}

function compose(input, marketSnapshot, fundamentalSnapshot) {
  const marketByTicker = new Map((marketSnapshot?.companies || []).map((x) => [x.ticker, x]));
  const fundamentalByTicker = new Map((fundamentalSnapshot?.companies || []).map((x) => [x.ticker, x]));
  const priceConfirmationMax = Number(input.weights.priceConfirmation);
  const epsRevisionMax = Number(input.weights.epsRevision);
  const companies = input.companies.map((base) => {
    const marketNormalized = normalizeMarketCompany(base, marketByTicker.get(base.ticker), priceConfirmationMax);
    return normalizeFundamentalCompany(marketNormalized, fundamentalByTicker.get(base.ticker), epsRevisionMax);
  });
  const rows = companies.map((company) => {
    const score = scoreCompany(company);
    const gate = company.ticker === '000660' ? evaluateSkHynixGate(company.market) : null;
    let status = bandFromScore(score);
    if (company.ticker === '000660' && score >= 80) status = gate.confirmed ? 'LEADER-CONFIRMED' : 'LEADER-WAIT';
    return { ...company, score, status, gate };
  }).sort((a,b) => b.score - a.score || a.company.localeCompare(b.company, 'ko'));
  rows.forEach((row, index) => row.rank = index + 1);
  const sk = rows.find((x) => x.ticker === '000660');
  return {
    version: '1.1',
    asOf: marketSnapshot?.asOf || input.asOf,
    sourceMode: marketSnapshot?.ready ? 'direct-adapters' : input.sourceMode,
    fundamentalSourceMode: fundamentalSnapshot?.companies?.length ? 'provider-adapters' : 'seed-manual',
    method: {
      weights: input.weights,
      hardGate: {
        foreignFlow: '5D foreign net flow > 0 AND at least 3 net-buy sessions in last 5 sessions',
        trend: 'Close > 20DMA for 2 consecutive sessions AND 20DMA 5D slope >= 0',
        relativeStrength: '20D stock return - benchmark 20D return >= +2.0%p AND 5D relative return >= 0',
        confirmed: 'All three hard gates PASS and Leader Score >= 80'
      }
    },
    leaders: rows.map(({ gate, market, fundamental, aiCapexExposure, bottleneck, epsRevision, priceConfirmation, ...row }) => ({
      ...row,
      aiCapexExposure,
      bottleneck,
      epsRevision,
      priceConfirmation,
      market,
      fundamental: fundamental || null,
      baseScore: aiCapexExposure + bottleneck + epsRevision
    })),
    skHynixGate: {
      ticker: '000660',
      currentStatus: sk?.status || 'UNKNOWN',
      score: sk?.score ?? null,
      checks: [
        { id:'foreign-flow', label:'Foreign Flow', rule:'5D 외국인 누적 순매수 > 0 AND 최근 5일 중 3일 이상 순매수', status:sk?.gate?.foreignFlow || 'FAIL', evidence:`5D net ${sk?.market?.foreignNet5dBillionKrw ?? 'n/a'}bn KRW · buy days ${sk?.market?.foreignBuyDays5d ?? 'n/a'}/5` },
        { id:'ma20', label:'20DMA Trend', rule:'종가 > 20DMA 2일 연속 AND 20DMA 5일 기울기 >= 0', status:sk?.gate?.ma20Trend || 'WATCH', evidence:`close ${sk?.market?.close ?? 'n/a'} · MA20 ${sk?.market?.ma20 ?? 'n/a'} · above days ${sk?.market?.aboveMa20Days ?? 'n/a'} · slope ${sk?.market?.ma20Slope5dPct ?? 'n/a'}%` },
        { id:'rs20', label:'Relative Strength', rule:'20D 상대수익률(KOSPI) >= +2.0%p AND 5D 상대수익률 >= 0', status:sk?.gate?.relativeStrength || 'FAIL', evidence:`RS20 ${sk?.market?.rs20pp ?? 'n/a'}%p · RS5 ${sk?.market?.rs5pp ?? 'n/a'}%p` },
        { id:'confirm', label:'Confirmation', rule:'Foreign Flow + 20DMA Trend + Relative Strength 모두 PASS + Leader Score >= 80', status:(sk?.gate?.confirmed && Number(sk?.score) >= 80) ? 'PASS' : 'FAIL', evidence:(sk?.gate?.confirmed && Number(sk?.score) >= 80) ? 'All hard gates passed and Leader Score >= 80' : 'At least one hard gate or the score threshold is not passed' }
      ]
    }
  };
}

function appendHistory(history, output) {
  const snapshot = {
    asOf: output.asOf,
    leaders: output.leaders.map(({ticker,score,status}) => ({ticker,score,status}))
  };
  const byDate = new Map((history.snapshots || []).map((item) => [item.asOf, item]));
  byDate.set(snapshot.asOf, snapshot);
  history.snapshots = [...byDate.values()]
    .sort((a, b) => String(a.asOf).localeCompare(String(b.asOf)))
    .slice(-90);
  return history;
}

function appendRegimeEvents(events, previous, output) {
  if (previous?.asOf && output?.asOf && String(output.asOf) < String(previous.asOf)) {
    return events;
  }
  const before = new Map((previous?.leaders || []).map((x) => [x.ticker, x]));
  for (const row of output.leaders) {
    const prev = before.get(row.ticker);
    if (!prev || prev.status === row.status) continue;
    if (row.ticker === '000660' && new Set(['LEADER-WAIT','LEADER-CONFIRMED']).has(prev.status) && new Set(['LEADER-WAIT','LEADER-CONFIRMED']).has(row.status)) {
      events.events.push({
        asOf: output.asOf,
        ticker: row.ticker,
        company: row.company,
        from: prev.status,
        to: row.status,
        score: row.score
      });
    }
  }
  events.events = events.events.slice(-50);
  return events;
}

if (SELF_TEST) {
  const wait = evaluateSkHynixGate({foreignNet5dBillionKrw:-1,foreignBuyDays5d:1,close:101,ma20:100,aboveMa20Days:2,ma20Slope5dPct:0.2,rs20pp:3,rs5pp:1});
  if (wait.confirmed) throw new Error('self-test WAIT case failed');
  const yes = evaluateSkHynixGate({foreignNet5dBillionKrw:1,foreignBuyDays5d:3,close:101,ma20:100,aboveMa20Days:2,ma20Slope5dPct:0.2,rs20pp:3,rs5pp:1});
  if (!yes.confirmed) throw new Error('self-test CONFIRMED case failed');
  console.log('AI CAPEX Leader Runtime V1 self-test PASS');
  process.exit(0);
}

const inputData = readJson(INPUT);
const previous = readJson(OUTPUT);
const historyData = readJson(HISTORY);
const eventData = readJson(EVENTS);
const marketData = fs.existsSync(MARKET) ? readJson(MARKET) : null;
const fundamentalData = fs.existsSync(FUNDAMENTAL) ? readJson(FUNDAMENTAL) : null;

if ((!marketData || marketData.ready !== true) && !FORCE_SNAPSHOT) {
  console.log('AI CAPEX Leader Runtime: direct market snapshot NOT_READY; preserving current snapshot.');
  process.exit(0);
}

const output = compose(inputData, marketData, fundamentalData);
appendHistory(historyData, output);
appendRegimeEvents(eventData, previous, output);
writeJson(OUTPUT, output);
writeJson(HISTORY, historyData);
writeJson(EVENTS, eventData);
console.log('AI CAPEX Leader Runtime updated:', output.asOf, output.skHynixGate.currentStatus);

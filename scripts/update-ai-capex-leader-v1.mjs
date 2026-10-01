import fs from 'node:fs';

const INPUT = 'src/data/ai-capex-leader-input-v1.json';
const OUTPUT = 'src/data/ai-capex-leader-v1.json';
const HISTORY = 'src/data/ai-capex-leader-history-v1.json';
const EVENTS = 'src/data/ai-capex-regime-events-v1.json';
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

function normalizeFeedCompany(base, feed) {
  if (!feed) return base;
  return {
    ...base,
    priceConfirmation: Number.isFinite(Number(feed.priceConfirmation)) ? Number(feed.priceConfirmation) : base.priceConfirmation,
    market: { ...(base.market || {}), ...(feed.market || {}) },
    note: feed.note || base.note
  };
}

async function fetchFeed() {
  const url = process.env.AI_CAPEX_LEADER_FEED_URL;
  if (!url) return null;
  const headers = { accept: 'application/json' };
  if (process.env.AI_CAPEX_LEADER_FEED_TOKEN) headers.authorization = 'Bearer ' + process.env.AI_CAPEX_LEADER_FEED_TOKEN;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('AI CAPEX feed ' + res.status + ' ' + res.statusText);
  return res.json();
}

function compose(input, feed) {
  const feedByTicker = new Map((feed?.companies || []).map((x) => [x.ticker, x]));
  const companies = input.companies.map((base) => normalizeFeedCompany(base, feedByTicker.get(base.ticker)));
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
    asOf: feed?.asOf || input.asOf,
    sourceMode: feed ? 'connected-feed' : input.sourceMode,
    method: {
      weights: input.weights,
      hardGate: {
        foreignFlow: '5D foreign net flow > 0 AND at least 3 net-buy sessions in last 5 sessions',
        trend: 'Close > 20DMA for 2 consecutive sessions AND 20DMA 5D slope >= 0',
        relativeStrength: '20D stock return - benchmark 20D return >= +2.0%p AND 5D relative return >= 0',
        confirmed: 'All three hard gates PASS and Leader Score >= 80'
      }
    },
    leaders: rows.map(({ gate, market, aiCapexExposure, bottleneck, epsRevision, priceConfirmation, ...row }) => ({
      ...row,
      aiCapexExposure,
      bottleneck,
      epsRevision,
      priceConfirmation,
      market,
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
        { id:'confirm', label:'Confirmation', rule:'Foreign Flow + 20DMA Trend + Relative Strength 모두 PASS', status:sk?.gate?.confirmed ? 'PASS' : 'FAIL', evidence:sk?.gate?.confirmed ? 'All hard gates passed' : 'At least one hard gate is not passed' }
      ]
    }
  };
}

function appendHistory(history, output) {
  const latest = history.snapshots.at(-1);
  const sameDate = latest?.asOf === output.asOf;
  const snapshot = {
    asOf: output.asOf,
    leaders: output.leaders.map(({ticker,score,status}) => ({ticker,score,status}))
  };
  if (sameDate) history.snapshots[history.snapshots.length - 1] = snapshot;
  else history.snapshots.push(snapshot);
  history.snapshots = history.snapshots.slice(-90);
  return history;
}

function appendRegimeEvents(events, previous, output) {
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
let feed = null;
try {
  feed = await fetchFeed();
} catch (error) {
  console.error('AI CAPEX feed fetch failed:', error.message);
  process.exitCode = 2;
}

if (!feed && !FORCE_SNAPSHOT) {
  console.log('AI CAPEX Leader Runtime: feed NOT_CONNECTED; preserving current snapshot.');
  process.exit(process.exitCode || 0);
}

const output = compose(inputData, feed);
appendHistory(historyData, output);
appendRegimeEvents(eventData, previous, output);
writeJson(OUTPUT, output);
writeJson(HISTORY, historyData);
writeJson(EVENTS, eventData);
console.log('AI CAPEX Leader Runtime updated:', output.asOf, output.skHynixGate.currentStatus);

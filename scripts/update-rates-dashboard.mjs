import fs from 'node:fs/promises';

const DASHBOARD_PATH = new URL('../src/data/rates-dashboard.json', import.meta.url);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'JoyLab-Rates-Dashboard/1.1' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function latestFred(csv) {
  const lines = csv.trim().split(/\r?\n/).slice(1);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const [date, raw] = lines[i].split(',');
    const value = Number(raw);
    if (date && Number.isFinite(value)) return { date, value };
  }
  throw new Error('No usable FRED observation');
}

function parseTic(text) {
  const lines = text.split(/\r?\n/);
  const header = lines.find((line) => /20\d{2}-\d{2}/.test(line));
  const total = lines.find((line) => /^\s*Grand Total\b/i.test(line));
  if (!header || !total) throw new Error('Unable to parse TIC table');
  const period = header.match(/20\d{2}-\d{2}/)?.[0];
  const values = total.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!period || values.length < 1) throw new Error('Missing TIC period/value');
  return { period, billions: values[0] };
}

function assertRange(label, value, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} failed plausibility check: ${value}`);
  }
}

function computeRisk({ us10y, us30y, spreadBp, usdkrw, auctions, thresholds }) {
  let score = 0;
  if (us10y >= (thresholds.us10yWarning ?? 5)) score += 2;
  if (us30y >= (thresholds.us30yWarning ?? 5.3)) score += 2;
  if (spreadBp >= (thresholds.spread30y10yWarningBp ?? 35)) score += 1;
  if (usdkrw >= (thresholds.usdkrwWarning ?? 1350)) score += 1;

  for (const auction of Object.values(auctions ?? {})) {
    if (Number.isFinite(auction.tailBp) && auction.tailBp >= 2) score += 1;
    if (Number.isFinite(auction.indirectPct) && auction.indirectPct < 60) score += 1;
    if (Number.isFinite(auction.dealerPct) && auction.dealerPct > 18) score += 1;
  }

  const grade = score >= 4 ? 'RED' : score >= 2 ? 'YELLOW' : 'GREEN';
  const summary = grade === 'RED'
    ? '금리·커브·환율 또는 입찰 수요가 동시에 악화된 스트레스 구간입니다.'
    : grade === 'YELLOW'
      ? '일부 장기금리 지표가 경계 구간입니다. 입찰 수요와 달러 전염을 함께 확인합니다.'
      : '금리·커브·입찰 수요가 대체로 안정 범위입니다.';

  return { score, grade, summary, rules: { GREEN: '0-1', YELLOW: '2-3', RED: '4+' } };
}

const [dgs10, dgs30, dexkous, ticText] = await Promise.all([
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10'),
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS30'),
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXKOUS'),
  fetchText('https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt')
]);

const us10y = latestFred(dgs10);
const us30y = latestFred(dgs30);
const usdkrw = latestFred(dexkous);
const tic = parseTic(ticText);

assertRange('US10Y', us10y.value, 1, 10);
assertRange('US30Y', us30y.value, 1, 10);
assertRange('USDKRW', usdkrw.value, 500, 2500);
assertRange('TIC total', tic.billions, 1000, 20000);

const previous = JSON.parse(await fs.readFile(DASHBOARD_PATH, 'utf8'));
const thresholds = previous.thresholds ?? {};
const dateCandidates = [us10y.date, us30y.date, usdkrw.date].sort();
const asOf = dateCandidates[0];
const spreadBp = Math.round((us30y.value - us10y.value) * 100);
assertRange('30Y-10Y spread', spreadBp, -300, 500);

const series = {
  ...previous.series,
  us10y: {
    ...previous.series.us10y,
    value: us10y.value,
    status: us10y.value >= (thresholds.us10yWarning ?? 5) ? 'danger' : us10y.value >= 4.8 ? 'warning' : 'neutral',
    source: `FRED DGS10, ${us10y.date}`
  },
  us30y: {
    ...previous.series.us30y,
    value: us30y.value,
    status: us30y.value >= (thresholds.us30yWarning ?? 5.3) ? 'danger' : us30y.value >= 5.1 ? 'warning' : 'neutral',
    source: `FRED DGS30, ${us30y.date}`
  },
  spread30y10y: {
    ...previous.series.spread30y10y,
    label: '30Y-10Y 스프레드',
    value: spreadBp,
    unit: 'bp',
    status: spreadBp >= (thresholds.spread30y10yWarningBp ?? 35) ? 'warning' : 'neutral',
    source: `Derived from DGS30-DGS10, ${asOf}`
  },
  foreignTreasuryHoldings: {
    ...previous.series.foreignTreasuryHoldings,
    value: Number((tic.billions / 1000).toFixed(3)),
    period: tic.period,
    source: `U.S. Treasury TIC, ${tic.period}`
  },
  usdkrw: {
    ...previous.series.usdkrw,
    value: usdkrw.value,
    status: usdkrw.value >= (thresholds.usdkrwWarning ?? 1350) ? 'danger' : usdkrw.value >= 1330 ? 'warning' : 'neutral',
    source: `FRED DEXKOUS, ${usdkrw.date}`
  }
};

const risk = computeRisk({
  us10y: us10y.value,
  us30y: us30y.value,
  spreadBp,
  usdkrw: usdkrw.value,
  auctions: previous.auctions,
  thresholds
});

const next = {
  ...previous,
  asOf,
  updatedAt: new Date().toISOString(),
  series,
  risk
};

await fs.writeFile(DASHBOARD_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  asOf,
  ticPeriod: tic.period,
  us10y: us10y.value,
  us30y: us30y.value,
  spreadBp,
  usdkrw: usdkrw.value,
  foreignHoldingsT: next.series.foreignTreasuryHoldings.value,
  risk: next.risk
}));

import fs from 'node:fs/promises';

const DASHBOARD_PATH = new URL('../src/data/rates-dashboard.json', import.meta.url);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'JoyLab-Rates-Dashboard/1.2' } });
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
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label} failed plausibility check: ${value}`);
}

function auctionScore(a = {}) {
  const tail = !Number.isFinite(a.tailBp) ? 25 : a.tailBp <= -2 ? 40 : a.tailBp <= 0 ? 30 : a.tailBp <= 2 ? 20 : 10;
  const indirect = a.indirectPct >= 75 ? 25 : a.indirectPct >= 65 ? 20 : a.indirectPct >= 55 ? 12 : 5;
  const dealer = a.dealerPct <= 5 ? 20 : a.dealerPct <= 10 ? 16 : a.dealerPct <= 15 ? 10 : 4;
  const btc = a.bidToCover >= 2.6 ? 15 : a.bidToCover >= 2.4 ? 12 : a.bidToCover >= 2.2 ? 8 : 4;
  return Math.max(0, Math.min(100, tail + indirect + dealer + btc));
}

function computeLegacyRisk({ us10y, us30y, spreadBp, usdkrw, auctions, thresholds }) {
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
  const summary = grade === 'RED' ? '금리·커브·환율 또는 입찰 수요가 동시에 악화된 스트레스 구간입니다.' : grade === 'YELLOW' ? '일부 장기금리 지표가 경계 구간입니다. 입찰 수요와 달러 전염을 함께 확인합니다.' : '금리·커브·입찰 수요가 대체로 안정 범위입니다.';
  return { score, grade, summary, rules: { GREEN: '0-1', YELLOW: '2-3', RED: '4+' } };
}

function marketRatesStress({ us10y, us30y, spreadBp, usdkrw }) {
  let stress = 0;
  if (us10y >= 5.2) stress += 35; else if (us10y >= 5) stress += 25; else if (us10y >= 4.8) stress += 15;
  if (us30y >= 5.5) stress += 35; else if (us30y >= 5.3) stress += 25; else if (us30y >= 5.1) stress += 15;
  if (spreadBp >= 50) stress += 20; else if (spreadBp >= 35) stress += 15; else if (spreadBp >= 20) stress += 8;
  if (usdkrw >= 1380) stress += 10; else if (usdkrw >= 1350) stress += 8; else if (usdkrw >= 1330) stress += 5;
  return Math.min(100, stress);
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
const asOf = [us10y.date, us30y.date, usdkrw.date].sort()[0];
const spreadBp = Math.round((us30y.value - us10y.value) * 100);
assertRange('30Y-10Y spread', spreadBp, -300, 500);

const auctions = Object.fromEntries(Object.entries(previous.auctions ?? {}).map(([key, a]) => [key, { ...a, score: auctionScore(a) }]));
const auctionValues = Object.values(auctions).map((a) => a.score).filter(Number.isFinite);
const auctionAggregate = Math.round(auctionValues.reduce((a, b) => a + b, 0) / Math.max(1, auctionValues.length));

const series = {
  ...previous.series,
  us10y: { ...previous.series.us10y, value: us10y.value, status: us10y.value >= (thresholds.us10yWarning ?? 5) ? 'danger' : us10y.value >= 4.8 ? 'warning' : 'neutral', source: `FRED DGS10, ${us10y.date}` },
  us30y: { ...previous.series.us30y, value: us30y.value, status: us30y.value >= (thresholds.us30yWarning ?? 5.3) ? 'danger' : us30y.value >= 5.1 ? 'warning' : 'neutral', source: `FRED DGS30, ${us30y.date}` },
  spread30y10y: { ...previous.series.spread30y10y, label: '30Y-10Y 스프레드', value: spreadBp, unit: 'bp', status: spreadBp >= (thresholds.spread30y10yWarningBp ?? 35) ? 'warning' : 'neutral', source: `Derived from DGS30-DGS10, ${asOf}` },
  foreignTreasuryHoldings: { ...previous.series.foreignTreasuryHoldings, value: Number((tic.billions / 1000).toFixed(3)), period: tic.period, source: `U.S. Treasury TIC, ${tic.period}` },
  usdkrw: { ...previous.series.usdkrw, value: usdkrw.value, status: usdkrw.value >= (thresholds.usdkrwWarning ?? 1350) ? 'danger' : usdkrw.value >= 1330 ? 'warning' : 'neutral', source: `FRED DEXKOUS, ${usdkrw.date}` }
};

const risk = computeLegacyRisk({ us10y: us10y.value, us30y: us30y.value, spreadBp, usdkrw: usdkrw.value, auctions, thresholds });
const ratesStress = marketRatesStress({ us10y: us10y.value, us30y: us30y.value, spreadBp, usdkrw: usdkrw.value });
const ticScore = previous.scores?.tic?.value ?? 50;
const fxStress = usdkrw.value >= 1380 ? 90 : usdkrw.value >= 1350 ? 70 : usdkrw.value >= 1330 ? 50 : 25;
const composite = Math.round(ratesStress * 0.45 + (100 - auctionAggregate) * 0.20 + (100 - ticScore) * 0.20 + fxStress * 0.15);
const compositeGrade = composite >= 65 ? 'RED' : composite >= 35 ? 'YELLOW' : 'GREEN';

const scores = {
  ...previous.scores,
  auction: { value: auctionAggregate, grade: auctionAggregate >= 80 ? 'STRONG' : auctionAggregate >= 60 ? 'NORMAL' : 'WEAK', higherIsBetter: true, method: 'Tail/Stop-through 40 + Indirect 25 + Dealer 20 + Bid-to-Cover 15; missing tail uses neutral 25/40', period: Object.values(auctions).map((a) => a.date).sort().join('~') },
  compositeRatesRisk: { value: composite, grade: compositeGrade, higherIsWorse: true, method: 'Rates 45% + Auction weakness 20% + TIC stress 20% + FX stress 15%', rules: { GREEN: '0-34', YELLOW: '35-64', RED: '65-100' } }
};

const next = { ...previous, asOf, updatedAt: new Date().toISOString(), series, auctions, scores, risk };
await fs.writeFile(DASHBOARD_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ asOf, ticPeriod: tic.period, us10y: us10y.value, us30y: us30y.value, spreadBp, usdkrw: usdkrw.value, auctionScore: scores.auction.value, ticScore: scores.tic?.value, compositeRatesRisk: scores.compositeRatesRisk }));

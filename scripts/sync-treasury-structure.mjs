import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const DASHBOARD_PATH = new URL('../src/data/rates-dashboard.json', import.meta.url);
const TD_BASE = 'https://www.treasurydirect.gov';
const TIC_HOLDINGS_URL = 'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt';
const TIC_FLOW_URL = 'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table1.txt';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'JoyLab-TreasuryStructure/1.0' }
  });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'JoyLab-TreasuryStructure/1.0' } });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.text();
}

const n = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function pctChange(current, prior) {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) return null;
  return Number((((current - prior) / prior) * 100).toFixed(2));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreAuctionMetric(metric, value) {
  if (!Number.isFinite(value)) return 0;
  if (metric === 'btc') return value >= 2.5 ? 35 : value >= 2.3 ? 27 : value >= 2.1 ? 18 : 8;
  if (metric === 'indirect') return value >= 70 ? 35 : value >= 65 ? 28 : value >= 60 ? 20 : 10;
  if (metric === 'dealer') return value <= 10 ? 30 : value <= 15 ? 23 : value <= 20 ? 15 : 6;
  return 0;
}

function auctionScore(record) {
  return clampScore(
    scoreAuctionMetric('btc', record.bidToCover) +
    scoreAuctionMetric('indirect', record.indirectPct) +
    scoreAuctionMetric('dealer', record.dealerPct)
  );
}

function approxYears(record) {
  const start = new Date(record.auctionDate || record.issueDate);
  const end = new Date(record.maturityDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return (end - start) / (365.25 * 24 * 60 * 60 * 1000);
}

function matchesBenchmark(record, years) {
  const original = String(record.originalSecurityTerm ?? '').toLowerCase();
  const term = String(record.securityTerm ?? '').toLowerCase();
  if (original.includes(`${years}-year`) || term === `${years}-year` || term.startsWith(`${years}-year`)) return true;
  const approx = approxYears(record);
  return Number.isFinite(approx) && approx >= years - 0.6 && approx <= years + 0.6;
}

function normalizeAuction(record, label) {
  const competitiveAccepted = n(record.competitiveAccepted);
  const directAccepted = n(record.directBidderAccepted);
  const indirectAccepted = n(record.indirectBidderAccepted);
  const dealerAccepted = n(record.primaryDealerAccepted);
  const acceptedBase = competitiveAccepted ?? [directAccepted, indirectAccepted, dealerAccepted].filter(Number.isFinite).reduce((a, b) => a + b, 0);
  const indirectPct = acceptedBase > 0 && Number.isFinite(indirectAccepted) ? Number((indirectAccepted / acceptedBase * 100).toFixed(1)) : null;
  const dealerPct = acceptedBase > 0 && Number.isFinite(dealerAccepted) ? Number((dealerAccepted / acceptedBase * 100).toFixed(1)) : null;
  const normalized = {
    label,
    date: String(record.auctionDate ?? '').slice(0, 10),
    cusip: record.cusip,
    securityTerm: record.securityTerm,
    originalSecurityTerm: record.originalSecurityTerm ?? '',
    offeringBillionUsd: Number(((n(record.offeringAmount) ?? 0) / 1e9).toFixed(1)),
    highYield: n(record.highYield),
    bidToCover: n(record.bidToCoverRatio),
    indirectPct,
    dealerPct,
    tailBp: null,
    source: 'U.S. TreasuryDirect TA_WS',
    sourceUrl: `${TD_BASE}/TA_WS/securities/auctioned`
  };
  normalized.score = auctionScore(normalized);
  normalized.quality = normalized.score >= 80 ? 'STRONG' : normalized.score >= 60 ? 'NORMAL' : 'WEAK';
  return normalized;
}

async function fetchLatestBenchmarks() {
  const [notes, bonds] = await Promise.all([
    fetchJson(`${TD_BASE}/TA_WS/securities/auctioned?format=json&type=Note&days=75`),
    fetchJson(`${TD_BASE}/TA_WS/securities/auctioned?format=json&type=Bond&days=120`)
  ]);
  const latest = (rows, years) => rows
    .filter((row) => matchesBenchmark(row, years) && n(row.bidToCoverRatio) !== null)
    .sort((a, b) => String(b.auctionDate).localeCompare(String(a.auctionDate)))[0];
  const ten = latest(notes, 10);
  const thirty = latest(bonds, 30);
  if (!ten) throw new Error('No recent 10-Year Treasury auction result found');
  if (!thirty) throw new Error('No recent 30-Year Treasury auction result found');
  return {
    us10y: normalizeAuction(ten, '10-Year Note'),
    us30y: normalizeAuction(thirty, '30-Year Bond')
  };
}

function parseHoldingsTable(text) {
  const rows = text.split(/\r?\n/).filter(Boolean).map((line) => line.split('\t').map((v) => v.trim()));
  const header = rows.find((row) => row[0] === 'Country' && /^20\d{2}-\d{2}$/.test(row[1] ?? ''));
  if (!header) throw new Error('TIC holdings header not found');
  const periods = header.slice(1).filter((v) => /^20\d{2}-\d{2}$/.test(v));
  if (periods.length < 4) throw new Error('TIC holdings needs at least four monthly periods');
  const getRow = (name) => rows.find((row) => row[0].toLowerCase() === name.toLowerCase());
  const total = getRow('Grand Total');
  const official = getRow('Of Which: Foreign Official');
  const china = getRow('China, Mainland');
  if (!total || !official || !china) throw new Error('TIC holdings required rows not found');
  const series = (row) => periods.map((period, index) => ({ period, value: n(row[index + 1]) })).filter((x) => Number.isFinite(x.value));
  return { periods, total: series(total), official: series(official), china: series(china) };
}

function parseFlowTable(text) {
  const rows = text.split(/\r?\n/).filter(Boolean).map((line) => line.split('\t').map((v) => v.trim()));
  const headerIndex = rows.findIndex((row) => row[0] === 'country' && row.includes('for_lt_treas_net'));
  if (headerIndex < 0) throw new Error('TIC flow machine header not found');
  const header = rows[headerIndex];
  const codeIndex = header.indexOf('country_code');
  const dateIndex = header.indexOf('date');
  const treasuryNetIndex = header.indexOf('for_lt_treas_net');
  const byCode = (code) => rows.slice(headerIndex + 1)
    .filter((row) => row[codeIndex] === code && /^20\d{2}-\d{2}$/.test(row[dateIndex] ?? '') && n(row[treasuryNetIndex]) !== null)
    .map((row) => ({ period: row[dateIndex], netSalesMillionUsd: n(row[treasuryNetIndex]) }))
    .sort((a, b) => b.period.localeCompare(a.period));
  const total = byCode('99996')[0];
  const official = byCode('99990')[0];
  const nonOfficial = byCode('99991')[0];
  if (!total || !official || !nonOfficial) throw new Error('TIC flow required rows not found');
  return { total, official, nonOfficial };
}

function scoreTrend(changePct, maxPoints, bands) {
  if (!Number.isFinite(changePct)) return 0;
  if (changePct >= 0) return maxPoints;
  if (changePct > bands.soft) return Math.round(maxPoints * 0.8);
  if (changePct > bands.hard) return Math.round(maxPoints * 0.45);
  return Math.round(maxPoints * 0.2);
}

function scoreFlow(millionUsd, maxPoints) {
  if (!Number.isFinite(millionUsd)) return 0;
  if (millionUsd >= 20000) return maxPoints;
  if (millionUsd >= 0) return Math.round(maxPoints * 0.8);
  if (millionUsd > -20000) return Math.round(maxPoints * 0.5);
  return Math.round(maxPoints * 0.2);
}

function buildTicScore(holdings, flows) {
  const current = 0;
  const prior3m = Math.min(3, holdings.total.length - 1, holdings.official.length - 1, holdings.china.length - 1);
  const total3mPct = pctChange(holdings.total[current].value, holdings.total[prior3m].value);
  const official3mPct = pctChange(holdings.official[current].value, holdings.official[prior3m].value);
  const china3mPct = pctChange(holdings.china[current].value, holdings.china[prior3m].value);
  const components = {
    totalHoldingsTrend: scoreTrend(total3mPct, 25, { soft: -2, hard: -5 }),
    officialHoldingsTrend: scoreTrend(official3mPct, 20, { soft: -3, hard: -7 }),
    officialTreasuryFlow: scoreFlow(flows.official.netSalesMillionUsd, 20),
    privateTreasuryFlow: scoreFlow(flows.nonOfficial.netSalesMillionUsd, 20),
    chinaHoldingsTrend: scoreTrend(china3mPct, 15, { soft: -3, hard: -7 })
  };
  const value = clampScore(Object.values(components).reduce((a, b) => a + b, 0));
  return {
    value,
    grade: value >= 75 ? 'STABLE' : value >= 55 ? 'STABLE_WATCH' : 'WEAK',
    higherIsBetter: true,
    method: 'Official TIC: foreign total holdings trend 25 + official holdings trend 20 + official Treasury net flow 20 + private Treasury net flow 20 + China holdings trend 15',
    period: holdings.total[0].period,
    auto: true,
    components,
    observations: {
      totalHoldingsBillionUsd: holdings.total[0].value,
      totalHoldings3mPct: total3mPct,
      officialHoldingsBillionUsd: holdings.official[0].value,
      officialHoldings3mPct: official3mPct,
      chinaHoldingsBillionUsd: holdings.china[0].value,
      chinaHoldings3mPct: china3mPct,
      officialTreasuryNetSalesBillionUsd: Number((flows.official.netSalesMillionUsd / 1000).toFixed(1)),
      privateTreasuryNetSalesBillionUsd: Number((flows.nonOfficial.netSalesMillionUsd / 1000).toFixed(1)),
      flowPeriod: flows.total.period
    },
    source: 'U.S. Treasury TIC SLT Table 5 + SLT Table 1',
    sourceUrls: [TIC_HOLDINGS_URL, TIC_FLOW_URL]
  };
}

function selfTest() {
  assert.equal(scoreAuctionMetric('btc', 2.6), 35);
  assert.equal(scoreAuctionMetric('dealer', 9), 30);
  assert.equal(scoreTrend(-1, 25, { soft: -2, hard: -5 }), 20);
  assert.equal(scoreFlow(-10000, 20), 10);
  assert.equal(clampScore(104), 100);
  console.log('treasury structure self-test passed');
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const previous = JSON.parse(await fs.readFile(DASHBOARD_PATH, 'utf8'));
const [auctions, holdingsText, flowText] = await Promise.all([
  fetchLatestBenchmarks(),
  fetchText(TIC_HOLDINGS_URL),
  fetchText(TIC_FLOW_URL)
]);
const holdings = parseHoldingsTable(holdingsText);
const flows = parseFlowTable(flowText);
const ticScore = buildTicScore(holdings, flows);
const auctionValues = Object.values(auctions).map((a) => a.score);
const auctionAggregate = clampScore(auctionValues.reduce((a, b) => a + b, 0) / auctionValues.length);
const auctionPeriod = Object.values(auctions).map((a) => a.date).sort().join('~');

const next = structuredClone(previous);
next.auctions = auctions;
next.series.foreignTreasuryHoldings = {
  ...next.series.foreignTreasuryHoldings,
  value: Number((holdings.total[0].value / 1000).toFixed(3)),
  unit: '조달러',
  period: holdings.total[0].period,
  source: `U.S. Treasury TIC SLT Table 5, ${holdings.total[0].period}`,
  observedAt: holdings.total[0].period
};
next.scores.auction = {
  value: auctionAggregate,
  grade: auctionAggregate >= 80 ? 'STRONG' : auctionAggregate >= 60 ? 'NORMAL' : 'WEAK',
  higherIsBetter: true,
  method: 'Official-only Auction Score V1.1: Bid-to-Cover 35 + Indirect accepted share 35 + Primary Dealer accepted share 30; latest 10Y and 30Y averaged. Tail/stop-through excluded because WI yield is not part of TreasuryDirect official auction data.',
  period: auctionPeriod,
  auto: true,
  source: 'U.S. TreasuryDirect TA_WS'
};
next.scores.tic = ticScore;
next.updatedAt = new Date().toISOString();

await fs.writeFile(DASHBOARD_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  auctionScore: next.scores.auction.value,
  auctionPeriod,
  us10yAuction: auctions.us10y,
  us30yAuction: auctions.us30y,
  ticScore: ticScore.value,
  ticPeriod: ticScore.period,
  ticFlowPeriod: ticScore.observations.flowPeriod
}));
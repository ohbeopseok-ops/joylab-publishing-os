import fs from 'node:fs/promises';

const DASHBOARD_PATH = new URL('../src/data/rates-dashboard.json', import.meta.url);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'JoyLab-Rates-Dashboard/1.0' } });
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
const threshold = previous.thresholds ?? {};
const dateCandidates = [us10y.date, us30y.date, usdkrw.date].sort();
const asOf = dateCandidates[0];

const next = {
  ...previous,
  asOf,
  updatedAt: new Date().toISOString(),
  series: {
    ...previous.series,
    us10y: {
      ...previous.series.us10y,
      value: us10y.value,
      status: us10y.value >= (threshold.us10yWarning ?? 5) ? 'danger' : us10y.value >= 4.8 ? 'warning' : 'neutral',
      source: `FRED DGS10, ${us10y.date}`
    },
    us30y: {
      ...previous.series.us30y,
      value: us30y.value,
      status: us30y.value >= (threshold.us30yWarning ?? 5.3) ? 'danger' : us30y.value >= 5.1 ? 'warning' : 'neutral',
      source: `FRED DGS30, ${us30y.date}`
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
      status: usdkrw.value >= (threshold.usdkrwWarning ?? 1350) ? 'danger' : usdkrw.value >= 1330 ? 'warning' : 'neutral',
      source: `FRED DEXKOUS, ${usdkrw.date}`
    }
  }
};

await fs.writeFile(DASHBOARD_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ asOf, ticPeriod: tic.period, us10y: us10y.value, us30y: us30y.value, usdkrw: usdkrw.value, foreignHoldingsT: next.series.foreignTreasuryHoldings.value }));

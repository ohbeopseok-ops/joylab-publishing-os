import fs from 'node:fs';
import { fetchKrxPriceSnapshot, calcPriceMetrics } from './lib/ai-capex/krx-price-adapter-v1.mjs';
import { fetchKisFlowSnapshot, normalizeFlowRows } from './lib/ai-capex/kis-flow-adapter-v1.mjs';

const INPUT = 'src/data/ai-capex-leader-input-v1.json';
const OUTPUT = 'src/data/ai-capex-market-snapshot-v1.json';
const SELF_TEST = process.argv.includes('--self-test');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const kstDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

export function derivePriceConfirmation(market = {}) {
  let score = 0;
  if (Number(market.close) > Number(market.ma20)) score += 4;
  if (Number(market.ma20Slope5dPct) >= 0) score += 2;
  if (Number(market.aboveMa20Days) >= 2) score += 2;
  if (Number(market.rs20pp) >= 2) score += 4;
  else if (Number(market.rs20pp) >= 0) score += 2;
  if (Number(market.rs5pp) >= 0) score += 2;
  if (Number(market.return20dPct) > 0) score += 2;
  if (Number(market.foreignNet5dBillionKrw) > 0) score += 2;
  if (Number(market.foreignBuyDays5d) >= 3) score += 1;
  if (Number(market.institutionNet5dBillionKrw) > 0) score += 1;
  return Math.max(0, Math.min(20, score));
}

function selfTest() {
  const closes = Array.from({length:25}, (_,i)=>100+i);
  const bench = Array.from({length:25}, (_,i)=>100+i*0.2);
  const metrics = calcPriceMetrics(closes, bench);
  if (!metrics || metrics.rs20pp <= 0 || metrics.ma20Slope5dPct <= 0) throw new Error('price metric self-test failed');

  const flow = normalizeFlowRows([
    {stck_bsop_date:'20261001',frgn_ntby_tr_pbmn:'2000',orgn_ntby_tr_pbmn:'1000'},
    {stck_bsop_date:'20260930',frgn_ntby_tr_pbmn:'1000',orgn_ntby_tr_pbmn:'0'},
    {stck_bsop_date:'20260929',frgn_ntby_tr_pbmn:'-500',orgn_ntby_tr_pbmn:'500'},
    {stck_bsop_date:'20260928',frgn_ntby_tr_pbmn:'3000',orgn_ntby_tr_pbmn:'100'},
    {stck_bsop_date:'20260925',frgn_ntby_tr_pbmn:'-500',orgn_ntby_tr_pbmn:'-100'}
  ]);
  if (!flow || flow.foreignNet5dBillionKrw !== 5 || flow.foreignBuyDays5d !== 3) throw new Error('flow self-test failed');
  const score = derivePriceConfirmation({...metrics, ...flow});
  if (score < 1 || score > 20) throw new Error('price confirmation self-test failed');
  console.log('AI CAPEX Market Adapter V1 self-test PASS');
}

if (SELF_TEST) {
  selfTest();
  process.exit(0);
}

const krxKey = process.env.KRX_AUTH_KEY;
const kisAppKey = process.env.KIS_APP_KEY;
const kisAppSecret = process.env.KIS_APP_SECRET;

if (!krxKey || !kisAppKey || !kisAppSecret) {
  console.log('AI CAPEX Market Adapter: NOT_CONNECTED (KRX_AUTH_KEY / KIS_APP_KEY / KIS_APP_SECRET required).');
  process.exit(0);
}

const input = readJson(INPUT);
const tickers = input.companies.map((x) => x.ticker);
const requestedDate = kstDate();

const price = await fetchKrxPriceSnapshot({
  authKey: krxKey,
  tickers,
  asOfDate: requestedDate
});
const flow = await fetchKisFlowSnapshot({
  appKey: kisAppKey,
  appSecret: kisAppSecret,
  tickers
});

const companies = input.companies.map((company) => {
  const priceData = price.companies[company.ticker] || null;
  const flowData = flow.companies[company.ticker] || null;
  const market = { ...(priceData || {}), ...(flowData || {}) };
  const ready = Boolean(priceData && flowData);
  return {
    ticker: company.ticker,
    company: company.company,
    ready,
    priceConfirmation: ready ? derivePriceConfirmation(market) : null,
    market
  };
});

const readyCount = companies.filter((x) => x.ready).length;
const asOf = price.latestTradeDate
  ? price.latestTradeDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  : requestedDate;

const snapshot = {
  version: '1.0',
  asOf,
  generatedAt: new Date().toISOString(),
  sourceMode: 'direct-adapters',
  ready: readyCount === companies.length,
  sourceHealth: {
    krx: 'LIVE',
    price: 'LIVE',
    flow: 'LIVE',
    eps: 'NOT_CONNECTED',
    ir: 'NOT_CONNECTED'
  },
  providers: {
    krx: 'KRX Data Marketplace OPEN API',
    flow: 'Korea Investment & Securities Open API'
  },
  companies
};

if (!snapshot.ready) {
  console.error('AI CAPEX Market Adapter incomplete: ' + readyCount + '/' + companies.length + ' companies ready. Existing snapshot preserved.');
  process.exit(2);
}

writeJson(OUTPUT, snapshot);
console.log('AI CAPEX Market Adapter updated:', snapshot.asOf, readyCount + '/' + companies.length);

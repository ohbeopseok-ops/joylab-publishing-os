import fs from 'node:fs';
import assert from 'node:assert/strict';

const OUT = 'src/data/market-transmission.json';
const SELF_TEST = process.argv.includes('--self-test');
const nowIso = () => new Date().toISOString();
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const existing = readJson(OUT);

const foreignStatus = (v) => v >= 300 ? 'GREEN' : v <= -300 ? 'RED' : 'YELLOW';
const epsStatus = (v) => v >= 3 ? 'GREEN' : v <= -3 ? 'RED' : 'YELLOW';

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);
  return res.json();
};

const getByPath = (obj, path) => {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

const syncForeignFlow = async () => {
  const url = process.env.KRX_FOREIGN_FLOW_URL;
  const auth = process.env.KRX_AUTH_KEY;
  if (!url || !auth) return { ...existing.foreignFlow, ready: false, note: 'KRX adapter configured in code; KRX_FOREIGN_FLOW_URL / KRX_AUTH_KEY are not connected in this runtime.' };

  const method = (process.env.KRX_FOREIGN_FLOW_METHOD || 'GET').toUpperCase();
  const date = process.env.KRX_BASE_DATE || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()).replaceAll('-', '');
  const options = { method, headers: { AUTH_KEY: auth, accept: 'application/json' } };
  if (method !== 'GET') {
    options.headers['content-type'] = 'application/x-www-form-urlencoded';
    options.body = new URLSearchParams({ basDd: date });
  }
  const payload = await fetchJson(url, options);
  const rowPath = process.env.KRX_FOREIGN_FLOW_ROW_PATH || '';
  const valueField = process.env.KRX_FOREIGN_FLOW_VALUE_FIELD || 'netBuyBillionKrw';
  const dateField = process.env.KRX_FOREIGN_FLOW_DATE_FIELD || 'observedAt';
  const node = getByPath(payload, rowPath);
  const row = Array.isArray(node) ? node.at(-1) : node;
  const raw = Number(String(row?.[valueField] ?? '').replaceAll(',', ''));
  assert.ok(Number.isFinite(raw), `KRX foreign flow value field ${valueField} is not numeric`);
  const divisor = Number(process.env.KRX_FOREIGN_FLOW_DIVISOR || 1);
  const value = Math.round((raw / divisor) * 10) / 10;
  return {
    ready: true,
    provider: 'KRX_OPEN_API',
    source: 'KRX official Open API',
    observedAt: String(row?.[dateField] || date),
    market: process.env.KRX_FOREIGN_FLOW_MARKET || 'KOSPI',
    netBuyBillionKrw: value,
    status: foreignStatus(value),
    note: 'Positive = foreign net buying; negative = foreign net selling.'
  };
};

const syncEpsRevision = async () => {
  const url = process.env.EPS_REVISION_FEED_URL;
  if (!url) return { ...existing.epsRevision, ready: false, note: 'Authorized EPS revision adapter is ready; EPS_REVISION_FEED_URL is not connected in this runtime.' };
  const headers = { accept: 'application/json' };
  if (process.env.EPS_REVISION_FEED_TOKEN) headers.authorization = `Bearer ${process.env.EPS_REVISION_FEED_TOKEN}`;
  const payload = await fetchJson(url, { headers });
  const value = Number(payload.revision30dPct);
  assert.ok(Number.isFinite(value), 'EPS revision feed must provide numeric revision30dPct');
  assert.ok(payload.observedAt, 'EPS revision feed must provide observedAt');
  return {
    ready: true,
    provider: payload.provider || 'AUTHORIZED_EPS_FEED',
    source: payload.source || 'Authorized EPS consensus feed',
    observedAt: String(payload.observedAt),
    universe: Array.isArray(payload.universe) && payload.universe.length ? payload.universe : ['005930', '000660'],
    revision30dPct: Math.round(value * 10) / 10,
    status: epsStatus(value),
    note: payload.note || '30-day change in consensus EPS for the configured semiconductor universe.'
  };
};

if (SELF_TEST) {
  assert.equal(foreignStatus(500), 'GREEN');
  assert.equal(foreignStatus(0), 'YELLOW');
  assert.equal(foreignStatus(-500), 'RED');
  assert.equal(epsStatus(5), 'GREEN');
  assert.equal(epsStatus(0), 'YELLOW');
  assert.equal(epsStatus(-5), 'RED');
  console.log('Market Transmission V0.4 self-test PASS');
  process.exit(0);
}

const [foreignFlow, epsRevision] = await Promise.all([
  syncForeignFlow().catch((error) => ({ ...existing.foreignFlow, ready: false, note: `KRX sync failed: ${error.message}` })),
  syncEpsRevision().catch((error) => ({ ...existing.epsRevision, ready: false, note: `EPS sync failed: ${error.message}` }))
]);

const anyConnected = foreignFlow.ready || epsRevision.ready;
const output = {
  version: '0.4',
  ready: Boolean(foreignFlow.ready && epsRevision.ready),
  generatedAt: anyConnected ? nowIso() : existing.generatedAt,
  foreignFlow,
  epsRevision
};
fs.writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Market Transmission V0.4: foreignFlow=${foreignFlow.ready ? 'READY' : 'NOT_CONNECTED'}, epsRevision=${epsRevision.ready ? 'READY' : 'NOT_CONNECTED'}, combined=${output.ready ? 'READY' : 'PARTIAL'}`);

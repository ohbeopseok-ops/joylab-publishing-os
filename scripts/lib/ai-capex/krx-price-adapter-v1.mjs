const KRX_BASE = 'https://data-dbg.krx.co.kr/svc/apis';

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(n) ? n : null;
}

function ymd(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function parseKstDate(isoDate) {
  return new Date(isoDate + 'T12:00:00+09:00');
}

async function getJson(path, authKey, basDd) {
  const url = new URL(KRX_BASE + path);
  url.searchParams.set('basDd', basDd);
  const res = await fetch(url, {
    method: 'GET',
    headers: { AUTH_KEY: authKey, accept: 'application/json' }
  });
  if (!res.ok) throw new Error('KRX ' + path + ' ' + basDd + ': HTTP ' + res.status);
  const body = await res.json();
  return Array.isArray(body.OutBlock_1) ? body.OutBlock_1 : [];
}

export function normalizeTicker(value) {
  const raw = String(value ?? '').replace(/[^0-9A-Z]/gi, '');
  const m = raw.match(/\d{6}/);
  return m ? m[0] : raw.slice(-6);
}

export function calcPriceMetrics(closes, benchmarkCloses) {
  if (closes.length < 25 || benchmarkCloses.length < 21) return null;
  const latest = closes.at(-1);
  const avg = (xs) => xs.reduce((a,b) => a+b, 0) / xs.length;
  const ma20 = avg(closes.slice(-20));
  const ma20FiveDaysAgo = avg(closes.slice(-25, -5));
  const ma20Slope5dPct = (ma20 / ma20FiveDaysAgo - 1) * 100;

  let aboveMa20Days = 0;
  for (let end = closes.length; end >= 20; end -= 1) {
    const window = closes.slice(end - 20, end);
    const localMa = avg(window);
    const localClose = closes[end - 1];
    if (localClose > localMa) aboveMa20Days += 1;
    else break;
    if (aboveMa20Days >= 20) break;
  }

  const pct = (a,b) => (a / b - 1) * 100;
  const return5dPct = pct(latest, closes.at(-6));
  const return20dPct = pct(latest, closes.at(-21));
  const benchmarkReturn5dPct = pct(benchmarkCloses.at(-1), benchmarkCloses.at(-6));
  const benchmarkReturn20dPct = pct(benchmarkCloses.at(-1), benchmarkCloses.at(-21));

  return {
    close: latest,
    ma20,
    ma20Slope5dPct,
    aboveMa20Days,
    return5dPct,
    return20dPct,
    benchmarkReturn5dPct,
    benchmarkReturn20dPct,
    rs5pp: return5dPct - benchmarkReturn5dPct,
    rs20pp: return20dPct - benchmarkReturn20dPct
  };
}

export async function fetchKrxPriceSnapshot({ authKey, tickers, asOfDate, minimumSessions = 25, maxLookbackDays = 70 }) {
  if (!authKey) throw new Error('KRX_AUTH_KEY is required');
  const wanted = new Set(tickers.map(normalizeTicker));
  const sessions = [];
  const start = parseKstDate(asOfDate);

  for (let offset = 0; offset < maxLookbackDays && sessions.length < minimumSessions; offset += 1) {
    const d = new Date(start.getTime() - offset * 86400000);
    if ([0,6].includes(d.getUTCDay())) continue;
    const basDd = ymd(d);

    let kospiRows, kosdaqRows, indexRows;
    try {
      [kospiRows, kosdaqRows, indexRows] = await Promise.all([
        getJson('/sto/stk_bydd_trd', authKey, basDd),
        getJson('/sto/ksq_bydd_trd', authKey, basDd),
        getJson('/idx/kospi_dd_trd', authKey, basDd)
      ]);
    } catch {
      continue;
    }

    const indexRow =
      indexRows.find((x) => /^(코스피|KOSPI)$/i.test(String(x.IDX_NM || '').trim())) ||
      indexRows.find((x) => /코스피|KOSPI/i.test(String(x.IDX_NM || '')));
    const benchmarkClose = num(indexRow?.CLSPRC_IDX);
    if (!benchmarkClose) continue;

    const stockMap = new Map();
    for (const row of [...kospiRows, ...kosdaqRows]) {
      const ticker = normalizeTicker(row.ISU_CD);
      if (!wanted.has(ticker)) continue;
      const close = num(row.TDD_CLSPRC);
      if (!close) continue;
      stockMap.set(ticker, {
        ticker,
        close,
        volume: num(row.ACC_TRDVOL),
        turnoverKrw: num(row.ACC_TRDVAL),
        market: row.MKT_NM || null
      });
    }

    sessions.push({ date: basDd, benchmarkClose, stocks: stockMap });
  }

  sessions.sort((a,b) => a.date.localeCompare(b.date));
  if (sessions.length < minimumSessions) {
    throw new Error('KRX price history insufficient: ' + sessions.length + '/' + minimumSessions + ' sessions');
  }

  const benchmarkCloses = sessions.map((x) => x.benchmarkClose);
  const byTicker = {};
  for (const ticker of wanted) {
    const rows = sessions.filter((x) => x.stocks.has(ticker));
    const closes = rows.map((x) => x.stocks.get(ticker).close);
    const metrics = calcPriceMetrics(closes, benchmarkCloses.slice(-closes.length));
    if (!metrics) continue;
    const latestRow = rows.at(-1)?.stocks.get(ticker);
    byTicker[ticker] = {
      ...metrics,
      volume: latestRow?.volume ?? null,
      turnoverKrw: latestRow?.turnoverKrw ?? null,
      market: latestRow?.market ?? null,
      latestTradeDate: rows.at(-1)?.date ?? null
    };
  }

  return {
    latestTradeDate: sessions.at(-1).date,
    sessions: sessions.length,
    benchmark: 'KOSPI',
    companies: byTicker
  };
}

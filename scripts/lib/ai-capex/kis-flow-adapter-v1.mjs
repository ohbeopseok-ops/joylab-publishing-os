const KIS_BASE = 'https://openapi.koreainvestment.com:9443';

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(n) ? n : null;
}

async function issueToken(appKey, appSecret) {
  const res = await fetch(KIS_BASE + '/oauth2/tokenP', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret
    })
  });
  if (!res.ok) throw new Error('KIS token HTTP ' + res.status);
  const body = await res.json();
  if (!body.access_token) throw new Error('KIS token missing access_token');
  return body.access_token;
}

async function fetchInvestorRows({ token, appKey, appSecret, ticker }) {
  const url = new URL(KIS_BASE + '/uapi/domestic-stock/v1/quotations/inquire-investor');
  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
  url.searchParams.set('FID_INPUT_ISCD', ticker);
  const res = await fetch(url, {
    headers: {
      authorization: 'Bearer ' + token,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: 'FHKST01010900',
      'content-type': 'application/json; charset=utf-8'
    }
  });
  if (!res.ok) throw new Error('KIS investor ' + ticker + ': HTTP ' + res.status);
  const body = await res.json();
  if (body.rt_cd !== '0') throw new Error('KIS investor ' + ticker + ': ' + (body.msg_cd || '') + ' ' + (body.msg1 || ''));
  return Array.isArray(body.output) ? body.output : [];
}

export function normalizeFlowRows(rows, maxTradeDate = null) {
  const byDate = new Map();
  for (const row of rows) {
    const date = String(row.stck_bsop_date || '');
    if (!/^\d{8}$/.test(date)) continue;
    if (maxTradeDate && date > maxTradeDate) continue;
    if (!byDate.has(date)) byDate.set(date, row);
  }
  const sorted = [...byDate.values()]
    .sort((a,b) => String(b.stck_bsop_date).localeCompare(String(a.stck_bsop_date)))
    .slice(0, 5);
  if (sorted.length !== 5) return null;

  const foreign = sorted.map((x) => num(x.frgn_ntby_tr_pbmn));
  if (foreign.some((x) => !Number.isFinite(x))) return null;
  const institution = sorted.map((x) => num(x.orgn_ntby_tr_pbmn));

  const sum = (xs) => xs.reduce((a,b) => a+b, 0);
  return {
    foreignNet1dBillionKrw: foreign[0] / 1000,
    foreignNet5dBillionKrw: sum(foreign) / 1000,
    foreignBuyDays5d: foreign.filter((x) => x > 0).length,
    institutionNet1dBillionKrw: Number.isFinite(institution[0]) ? institution[0] / 1000 : null,
    institutionNet5dBillionKrw: institution.every(Number.isFinite) ? sum(institution) / 1000 : null,
    latestTradeDate: sorted[0].stck_bsop_date
  };
}

export async function fetchKisFlowSnapshot({ appKey, appSecret, tickers, asOfTradeDate = null }) {
  if (!appKey || !appSecret) throw new Error('KIS_APP_KEY and KIS_APP_SECRET are required');
  const token = await issueToken(appKey, appSecret);
  const companies = {};
  for (const ticker of tickers) {
    const rows = await fetchInvestorRows({ token, appKey, appSecret, ticker });
    companies[ticker] = normalizeFlowRows(rows, asOfTradeDate);
  }
  return { companies };
}

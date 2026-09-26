import fs from 'node:fs';
import path from 'node:path';

function parseArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  return raw || fallback;
}

function pct(n, d) {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function compose(rows, slug) {
  const counts = new Map(rows.map((r) => [r.event, Number(r.count) || 0]));
  const get = (name) => counts.get(name) || 0;
  const metrics = {
    slug,
    landingViews: get('book_landing_view'),
    previewStarts: get('book_preview_start'),
    readerViews: get('book_reader_view'),
    read25: get('book_read_25'),
    read50: get('book_read_50'),
    read75: get('book_read_75'),
    read100: get('book_read_100'),
    purchaseClicks: get('book_purchase_cta_click')
  };
  metrics.rates = {
    landingToPreview: pct(metrics.previewStarts, metrics.landingViews),
    previewToReader: pct(metrics.readerViews, metrics.previewStarts),
    read25: pct(metrics.read25, metrics.readerViews),
    read50: pct(metrics.read50, metrics.readerViews),
    read75: pct(metrics.read75, metrics.readerViews),
    read100: pct(metrics.read100, metrics.readerViews),
    readerToPurchase: pct(metrics.purchaseClicks, metrics.readerViews),
    deepReaderToPurchase: pct(metrics.purchaseClicks, metrics.read75)
  };
  return metrics;
}

export function diagnose(m) {
  const notes = [];
  if (m.landingViews < 100) notes.push('COLLECT: Landing 100회 미만이라 절대 판정보다 기준선 수집이 우선입니다.');
  if (m.rates.landingToPreview < 20) notes.push('CHECK HERO: Landing → Preview가 20% 미만입니다.');
  if (m.previewStarts > 0 && m.rates.previewToReader < 85) notes.push('CHECK ENTRY: Preview 클릭 후 Reader 진입률이 85% 미만입니다.');
  if (m.readerViews > 0 && m.rates.read25 < 60) notes.push('CHECK OPENING: 25% 도달률이 60% 미만입니다.');
  if (m.readerViews > 0 && m.rates.read50 < 40) notes.push('CHECK DENSITY: 50% 도달률이 40% 미만입니다.');
  if (m.readerViews > 0 && m.rates.read75 < 25) notes.push('CHECK CHAPTER FLOW: 75% 도달률이 25% 미만입니다.');
  if (m.readerViews > 0 && m.rates.readerToPurchase < 5) notes.push('CHECK OFFER: Reader → Purchase CTA가 5% 미만입니다.');
  if (!notes.length) notes.push('KEEP: 초기 내부 허들 기준으로 뚜렷한 병목이 없습니다.');
  return notes;
}

function markdown(report) {
  const m = report.metrics;
  const r = m.rates;
  return `# Books Funnel Dashboard V1

- Generated: ${report.generatedAt}
- Window: rolling ${report.windowDays} days
- Book: ${m.slug}

| Stage | Count | Conversion |
| --- | ---: | ---: |
| Landing | ${m.landingViews} | - |
| Preview Start | ${m.previewStarts} | ${r.landingToPreview}% |
| Reader View | ${m.readerViews} | ${r.previewToReader}% |
| Read 25% | ${m.read25} | ${r.read25}% |
| Read 50% | ${m.read50} | ${r.read50}% |
| Read 75% | ${m.read75} | ${r.read75}% |
| Read 100% | ${m.read100} | ${r.read100}% |
| Purchase CTA | ${m.purchaseClicks} | ${r.readerToPurchase}% |

## Deep Reader → Purchase
${r.deepReaderToPurchase}%

## Diagnostic
${report.diagnostic.map((x) => `- ${x}`).join('\n')}
`;
}

function html(report) {
  const m=report.metrics; const r=m.rates;
  const cards=[
    ['Landing',m.landingViews,'방문'],
    ['Preview',m.previewStarts,`${r.landingToPreview}%`],
    ['Reader',m.readerViews,`${r.previewToReader}%`],
    ['25%',m.read25,`${r.read25}%`],
    ['50%',m.read50,`${r.read50}%`],
    ['75%',m.read75,`${r.read75}%`],
    ['100%',m.read100,`${r.read100}%`],
    ['Purchase CTA',m.purchaseClicks,`${r.readerToPurchase}%`]
  ];
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Books Funnel Dashboard V1</title><style>
  body{margin:0;background:#071525;color:#edf6ff;font-family:system-ui,sans-serif}.wrap{max-width:1180px;margin:auto;padding:48px 24px}small{color:#65c8ff;letter-spacing:.14em}h1{font-size:40px;margin:10px 0 8px}.sub{color:#a9bdd1}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:32px 0}.card{background:#0d2239;border:1px solid #1d3e5d;border-radius:18px;padding:20px}.card b{font-size:34px;display:block;margin:8px 0}.card span{color:#ffd83d}.diag{background:#0d2239;border-radius:18px;padding:24px}.diag li{margin:10px 0;line-height:1.6}@media(max-width:760px){.grid{grid-template-columns:repeat(2,1fr)}h1{font-size:30px}}</style></head><body><main class="wrap"><small>JOYLAB BOOKS · FUNNEL V1</small><h1>${safe(m.slug)}</h1><p class="sub">최근 ${report.windowDays}일 · 생성 ${safe(report.generatedAt)}</p><section class="grid">${cards.map(([a,b,c])=>`<article class="card"><small>${a}</small><b>${b}</b><span>${c}</span></article>`).join('')}</section><section class="diag"><h2>Diagnostic</h2><ul>${report.diagnostic.map(x=>`<li>${safe(x)}</li>`).join('')}</ul><p>75% Reader → Purchase: <strong>${r.deepReaderToPurchase}%</strong></p></section></main></body></html>`;
}

function selfTest() {
  const m=compose([
    {event:'book_landing_view',count:200},{event:'book_preview_start',count:60},{event:'book_reader_view',count:55},
    {event:'book_read_25',count:40},{event:'book_read_50',count:30},{event:'book_read_75',count:18},{event:'book_read_100',count:12},
    {event:'book_purchase_cta_click',count:5}
  ],'problem-to-service');
  if (m.rates.landingToPreview !== 30 || m.rates.read50 !== 54.5) throw new Error('self-test failed');
  console.log('Books Funnel Dashboard V1 self-test passed.');
}

if (process.argv.includes('--self-test')) { selfTest(); process.exit(0); }

const days=Math.max(1,Math.min(90,Number(parseArg('days','7'))||7));
const slug=parseArg('slug','problem-to-service');
const outDir=path.resolve(process.cwd(),parseArg('out-dir','qa-artifacts/books-funnel'));
const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
if (!accountId || !token) throw new Error('Books Funnel requires Cloudflare Analytics read credentials.');

const endpoint=`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
const sql=`
SELECT index1 AS event, SUM(_sample_interval) AS count
FROM joylab_events_v1
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
  AND blob2 = '${slug.replace(/'/g,"''")}'
  AND index1 IN ('book_landing_view','book_preview_start','book_reader_view','book_read_25','book_read_50','book_read_75','book_read_100','book_purchase_cta_click')
GROUP BY index1
`;
const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'text/plain'},body:`${sql}\nFORMAT JSON`});
if (!response.ok) throw new Error(`Cloudflare SQL ${response.status}: ${await response.text()}`);
const payload=await response.json();
const rows=Array.isArray(payload)?payload:(payload.data??payload.result??[]);
const metrics=compose(rows,slug);
const report={generatedAt:new Date().toISOString(),windowDays:days,metrics,diagnostic:diagnose(metrics)};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'books-funnel-7d.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'books-funnel-7d.md'),markdown(report));
fs.writeFileSync(path.join(outDir,'index.html'),html(report));
console.log(`Books Funnel Dashboard generated for ${slug}`);

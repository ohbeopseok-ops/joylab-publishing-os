import fs from 'node:fs';
import path from 'node:path';

const articleSnapshotPath=process.env.ARTICLE_SNAPSHOT_JSON || 'qa-artifacts-v2/article/snapshot.json';
const guideSnapshotPath=process.env.GUIDE_SNAPSHOT_JSON || 'qa-artifacts-v2/guide/snapshot.json';
const articleResultPath=process.env.ARTICLE_RESULT_JSON || 'qa-artifacts-v2/article/result.json';
const guideResultPath=process.env.GUIDE_RESULT_JSON || 'qa-artifacts-v2/guide/result.json';
const outDir=process.env.MONETIZATION_DASHBOARD_V2_OUT || 'qa-artifacts/adsense-monetization-dashboard-v2';

function read(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function num(value,digits=1){
  return typeof value==='number'&&Number.isFinite(value)
    ? value.toLocaleString('ko-KR',{maximumFractionDigits:digits})
    : '—';
}
function won(value){
  return typeof value==='number'&&Number.isFinite(value)
    ? value.toLocaleString('ko-KR',{maximumFractionDigits:0})+'원'
    : '—';
}
function pct(value){return typeof value==='number'&&Number.isFinite(value)?num(value,1)+'%':'—';}
function cls(value){return typeof value==='number'&&Number.isFinite(value)?num(value,3):'—';}
function surface(label,snapshot,result){
  return {
    label,
    stage:snapshot.stage,
    decision:String(result.decision||'COLLECT').toUpperCase(),
    days:snapshot.period?.days??0,
    pageViews:snapshot.traffic?.eligibleArticlePageviews??0,
    impressions:snapshot.traffic?.adImpressions??0,
    earnings:snapshot.revenue?.estimatedEarningsKrw??null,
    rpm:snapshot.revenue?.pageRpmKrw??null,
    viewability:snapshot.revenue?.viewabilityPct??null,
    ctr:snapshot.revenue?.ctrPct??null,
    clsP75:snapshot.ux?.clsP75??null,
    readingDepth:snapshot.ux?.readingDepthPct??null,
    exitRate:snapshot.ux?.exitRatePct??null,
    ctaConversion:snapshot.ux?.ctaConversionPct??null,
    reasons:result.reasons??[]
  };
}

const article=surface('Article',read(articleSnapshotPath),read(articleResultPath));
const guide=surface('Guide',read(guideSnapshotPath),read(guideResultPath));
const surfaces=[article,guide];
const overall=surfaces.some(s=>s.decision==='ROLLBACK')
  ? 'ROLLBACK'
  : surfaces.every(s=>s.decision==='ADVANCE')
    ? 'ADVANCE'
    : 'COLLECT';

const rows=surfaces.map(s=>`
<tr>
<td><strong>${s.label}</strong><small>${s.stage}</small></td>
<td><span class="decision decision--${s.decision.toLowerCase()}">${s.decision}</span></td>
<td>${num(s.pageViews,0)}</td>
<td>${num(s.impressions,0)}</td>
<td>${won(s.earnings)}</td>
<td>${won(s.rpm)}</td>
<td>${pct(s.viewability)}</td>
<td>${cls(s.clsP75)}</td>
<td>${pct(s.readingDepth)}</td>
<td>${pct(s.exitRate)}</td>
<td>${pct(s.ctaConversion)}</td>
</tr>`).join('');

const html=`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JoyLab Monetization Dashboard V2</title>
<style>
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#07111f;color:#e5edf7}
*{box-sizing:border-box}body{margin:0;background:#07111f}main{width:min(1320px,calc(100% - 32px));margin:42px auto 64px}
.kicker{font-size:.78rem;letter-spacing:.18em;color:#7f8fa4;text-transform:uppercase}.head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin:8px 0 30px}.head h1{font-size:clamp(2rem,5vw,4rem);margin:0;letter-spacing:-.04em}.overall{padding:10px 14px;border:1px solid #26364b;border-radius:999px;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:22px}.card{background:#0d1929;border:1px solid #1e3048;border-radius:18px;padding:18px}.card small{display:block;color:#7890ad;margin-bottom:8px}.card strong{font-size:1.45rem}
.table{overflow:auto;border:1px solid #1e3048;border-radius:18px;background:#0b1625}table{width:100%;border-collapse:collapse;min-width:1080px}th,td{padding:14px 16px;text-align:right;border-bottom:1px solid #17283b;font-size:.88rem}th{color:#7890ad;font-weight:600;background:#0d1929}th:first-child,td:first-child{text-align:left}td:first-child small{display:block;color:#68809e;margin-top:4px}.decision{font-weight:800}.decision--advance{color:#86efac}.decision--collect{color:#fde68a}.decision--rollback{color:#fca5a5}
.note{margin-top:18px;color:#7589a4;font-size:.84rem;line-height:1.7}
@media(max-width:760px){main{width:min(100% - 20px,1320px);margin-top:24px}.head{align-items:flex-start;flex-direction:column}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
</head>
<body>
<main>
<div class="kicker">JoyLab · Monetization Dashboard V2</div>
<div class="head"><h1>Article × Guide</h1><div class="overall">${overall}</div></div>
<div class="grid">
<div class="card"><small>Article RPM</small><strong>${won(article.rpm)}</strong></div>
<div class="card"><small>Guide RPM</small><strong>${won(guide.rpm)}</strong></div>
<div class="card"><small>Article CLS p75</small><strong>${cls(article.clsP75)}</strong></div>
<div class="card"><small>Guide CLS p75</small><strong>${cls(guide.clsP75)}</strong></div>
</div>
<div class="table"><table>
<thead><tr><th>Surface</th><th>Gate</th><th>Pageviews</th><th>Ad Impressions</th><th>Earnings</th><th>Page RPM</th><th>Viewability</th><th>CLS p75</th><th>Read 50%</th><th>Early Exit</th><th>CTA Conv.</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="note">Article와 Guide는 각각 독립된 AdSense URL 범위와 Cloudflare UX 이벤트를 사용합니다. Books Landing은 별도 book-end 파일럿 게이트에서 관리하며 Web Reader는 광고 제외 상태를 유지합니다.</p>
</main>
</body>
</html>`;

const summary={schemaVersion:2,overall,surfaces};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'index.html'),html);
fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'decision.txt'),overall+'\n');
console.log(JSON.stringify(summary,null,2));

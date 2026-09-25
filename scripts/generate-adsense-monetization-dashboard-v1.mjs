import fs from 'node:fs';
import path from 'node:path';

const resultPath=process.env.MONETIZATION_RESULT_JSON || 'qa-artifacts/adsense-monetization-gate-v1/result.json';
const outDir=process.env.MONETIZATION_DASHBOARD_OUT || 'qa-artifacts/adsense-monetization-gate-v1/dashboard';
const raw=fs.readFileSync(resultPath,'utf8').trim();
const result=JSON.parse(raw);
const decision=String(result.decision||'COLLECT').toUpperCase();
const allowed=new Set(['ADVANCE','COLLECT','ROLLBACK']);
if(!allowed.has(decision)) throw new Error('Unexpected monetization decision: '+decision);

const label={
  ADVANCE:'ADVANCE',
  COLLECT:'COLLECT',
  ROLLBACK:'ROLLBACK'
}[decision];

const detail=decision==='ADVANCE'
  ? 'Current placement is eligible to proceed to the next integration + QA stage.'
  : decision==='ROLLBACK'
    ? 'Disable the newest placement and rerun Production GOLD QA.'
    : 'Keep the current placement only and collect more evidence.';

const html=`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JoyLab Monetization Dashboard V1</title>
<style>
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#07111f;color:#f8fafc}
body{margin:0;min-height:100vh;display:grid;place-items:center}
main{width:min(820px,calc(100% - 32px));text-align:center}
.kicker{font-size:.8rem;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;margin-bottom:18px}
.decision{font-size:clamp(3rem,12vw,7rem);line-height:.95;font-weight:800;letter-spacing:-.04em}
.stage{margin-top:18px;font-size:1rem;color:#cbd5e1}
.detail{margin:28px auto 0;max-width:620px;font-size:1rem;line-height:1.7;color:#94a3b8}
.evidence{margin-top:32px;font-size:.85rem;color:#64748b}
</style>
</head>
<body>
<main>
<div class="kicker">JoyLab · AdSense Monetization Gate V1</div>
<div class="decision">${label}</div>
<div class="stage">${result.stage||'article-end'}</div>
<div class="detail">${detail}</div>
<div class="evidence">${result.evidence?.days??0} days · ${result.evidence?.adImpressions??0} ad impressions</div>
</main>
</body>
</html>`;

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'index.html'),html);
fs.writeFileSync(path.join(outDir,'decision.txt'),decision+'\n');
fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify({
  decision,
  stage:result.stage,
  evidence:result.evidence,
  reasons:result.reasons
},null,2)+'\n');
console.log(`Monetization Dashboard V1: ${decision}`);

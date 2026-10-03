import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const queuePath=process.env.TODAY_CARDS_QUEUE||path.join(root,'qa-artifacts','official-execution-queue-v1','queue.json');
const driftPath=process.env.TODAY_CARDS_DRIFT||path.join(root,'qa-artifacts','ranking-drift-v1','drift.json');
const outDir=process.env.TODAY_CARDS_OUT||path.join(root,'qa-artifacts','today-fix-cards-v1');
if(!fs.existsSync(queuePath)) throw new Error('Official Execution Queue missing: '+queuePath);

const queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
const drift=fs.existsSync(driftPath)?JSON.parse(fs.readFileSync(driftPath,'utf8')):null;
const top3=(queue.queue||[]).slice(0,3).map((item,index)=>({
  rank:index+1,
  path:item.path,
  tier:item.tier,
  executionValue:Number(item.executionValue||0),
  source:item.source,
  debtScore:Number(item.debtScore||0),
  businessImpact:Number(item.businessImpact||0),
  effortScore:Number(item.effortScore||1),
  pageViews:Number(item.pageViews||0),
  seoClicks:Number(item.seoClicks||0),
  action:item.action||'품질 부채 개선',
  status:'TODAY'
}));

const today=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const payload={
  generatedAt:new Date().toISOString(),
  dateKst:today,
  queueMode:queue.mode,
  rumDecision:queue.rumDecision,
  driftState:drift?.state||'MISSING',
  driftMilestone:drift?.milestone??0,
  cards:top3
};

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'cards.json'),JSON.stringify(payload,null,2)+'\n');

const lines=['# 오늘 고칠 것 3개 · '+today,'',
'Queue: **'+queue.mode+'** · RUM: **'+queue.rumDecision+'** · Drift: **'+(drift?.state||'MISSING')+' '+(drift?.milestone??0)+'/20**',''];
for(const card of top3){
  lines.push(
    '## '+card.rank+'. '+card.path,
    '',
    '- Tier: **'+card.tier+'**',
    '- Execution Value: **'+card.executionValue+'**',
    '- Debt / Impact / Effort: **'+card.debtScore+' / '+card.businessImpact+' / '+card.effortScore+'**',
    '- Traffic: **PV '+card.pageViews+' / SEO clicks '+card.seoClicks+'**',
    '- 오늘 액션: **'+card.action+'**',
    '- 완료 조건: 수정 → Build/Visual/Mobile Gate GREEN → 다음 QC 실행에서 순위 하락 확인',
    ''
  );
}
fs.writeFileSync(path.join(outDir,'cards.md'),lines.join('\n')+'\n');

const esc=(v)=>String(v??'').replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const htmlCards=top3.map((card)=>'<article class="card"><div class="rank">#'+card.rank+'</div><h2>'+esc(card.path)+'</h2><div class="meta">'+esc(card.tier)+' · value '+esc(card.executionValue)+'</div><p>'+esc(card.action)+'</p><dl><div><dt>Debt</dt><dd>'+esc(card.debtScore)+'</dd></div><div><dt>Impact</dt><dd>'+esc(card.businessImpact)+'</dd></div><div><dt>Effort</dt><dd>'+esc(card.effortScore)+'</dd></div><div><dt>PV</dt><dd>'+esc(card.pageViews)+'</dd></div></dl><footer>완료 조건: 수정 → GREEN → 다음 QC에서 순위 하락</footer></article>').join('');
const html='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오늘 고칠 것 3개</title><style>body{margin:0;background:#f4f7fb;color:#10233f;font-family:Inter,Pretendard,"Noto Sans KR",system-ui,sans-serif}.wrap{max-width:1100px;margin:auto;padding:24px}.hero{background:#071938;color:#fff;padding:24px;border-radius:18px}.hero h1{margin:0 0 8px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}.card{background:#fff;border:1px solid #dfe6f0;border-radius:16px;padding:18px}.rank{font-weight:900;color:#1677ff}.card h2{font-size:17px;overflow-wrap:anywhere}.meta{font-size:12px;color:#74839a}.card p{font-weight:800}.card dl{display:grid;grid-template-columns:1fr 1fr;gap:8px}.card dl div{background:#f7f9fc;padding:8px}.card dt{font-size:11px;color:#74839a}.card dd{margin:2px 0 0;font-weight:800}.card footer{margin-top:14px;font-size:12px;color:#5d6b80}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap"><section class="hero"><h1>오늘 고칠 것 3개</h1><p>'+esc(today)+' · '+esc(queue.mode)+' · RUM '+esc(queue.rumDecision)+'</p></section><section class="grid">'+htmlCards+'</section></main></body></html>';
fs.writeFileSync(path.join(outDir,'index.html'),html);
console.log('Today Fix Cards V1: '+top3.map((c)=>c.rank+'.'+c.path).join(' | '));

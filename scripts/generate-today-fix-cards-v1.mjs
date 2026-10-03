import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const queuePath=process.env.TODAY_CARDS_QUEUE||path.join(root,'qa-artifacts','official-execution-queue-v1','queue.json');
const driftPath=process.env.TODAY_CARDS_DRIFT||path.join(root,'qa-artifacts','ranking-drift-v1','drift.json');
const outDir=process.env.TODAY_CARDS_OUT||path.join(root,'qa-artifacts','today-fix-cards-v1');
if(!fs.existsSync(queuePath)) throw new Error('Official Execution Queue missing: '+queuePath);
const queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
const drift=fs.existsSync(driftPath)?JSON.parse(fs.readFileSync(driftPath,'utf8')):null;
const executionMode=drift?.executionMode||'BOOTSTRAP_LOCK';
const executionAllowed=executionMode==='RUM_LED'||executionMode==='PROVISIONAL';
const top3=(queue.queue||[]).slice(0,3).map((item,index)=>({
  rank:index+1,path:item.path,tier:item.tier,executionValue:Number(item.executionValue||0),source:item.source,
  debtScore:Number(item.debtScore||0),businessImpact:Number(item.businessImpact||0),effortScore:Number(item.effortScore||1),
  pageViews:Number(item.pageViews||0),seoClicks:Number(item.seoClicks||0),action:item.action||'품질 부채 개선',
  status:executionAllowed?(executionMode==='RUM_LED'?'TODAY':'REVIEW'):'HOLD',
  executionAllowed
}));
const today=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const payload={generatedAt:new Date().toISOString(),dateKst:today,queueMode:queue.mode,rumDecision:queue.rumDecision,
  driftState:drift?.state||'MISSING',driftMilestone:drift?.milestone??0,queueConfidenceScore:drift?.queueConfidenceScore??0,
  confidenceLevel:drift?.confidenceLevel||'LOW',executionMode,executionAllowed,cards:top3};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'cards.json'),JSON.stringify(payload,null,2)+'\n');
const lines=['# 오늘 고칠 것 3개 · '+today,'',
  'Queue: **'+queue.mode+'** · RUM: **'+queue.rumDecision+'** · Confidence: **'+(drift?.queueConfidenceScore??0)+'/100 '+(drift?.confidenceLevel||'LOW')+'** · Mode: **'+executionMode+'**',''];
for(const card of top3){lines.push('## '+card.rank+'. '+card.path,'','- Status: **'+card.status+'**','- Tier: **'+card.tier+'**','- Execution Value: **'+card.executionValue+'**',
  '- Debt / Impact / Effort: **'+card.debtScore+' / '+card.businessImpact+' / '+card.effortScore+'**','- Traffic: **PV '+card.pageViews+' / SEO clicks '+card.seoClicks+'**',
  '- 오늘 액션: **'+card.action+'**','- 완료 조건: First H2 ≤ 3,200px + LCP/CLS Gate GREEN → 다음 QC에서 순위 재계산','');}
fs.writeFileSync(path.join(outDir,'cards.md'),lines.join('\n')+'\n');
console.log('Today Fix Cards V1: mode='+executionMode+' allowed='+executionAllowed+' '+top3.map((c)=>c.rank+'.'+c.path+'['+c.status+']').join(' | '));

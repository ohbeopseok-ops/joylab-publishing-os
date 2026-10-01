import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const rumPath=process.env.RUM_JSON||path.join(root,'qa-artifacts','real-user-experience-gate-v1','rum.json');
const outDir=process.env.EXPERIENCE_DEBT_OUT||path.join(root,'qa-artifacts','experience-debt-ranking-v1');
if(!fs.existsSync(rumPath)) throw new Error('RUM report missing: '+rumPath);

const rum=JSON.parse(fs.readFileSync(rumPath,'utf8'));
const minSamples=Number(rum.minSamples||20);
const thresholds=rum.thresholds||{lcp:2500,cls:0.1,inp:200};
const rows=rum.byPath||[];

const byPath=new Map();
for(const row of rows){
  const pathName=String(row.path||'/');
  const metric=String(row.metric||'');
  if(!['lcp','cls','inp'].includes(metric)) continue;
  const item=byPath.get(pathName)||{path:pathName,metrics:{}};
  item.metrics[metric]={p75:Number(row.p75),samples:Number(row.samples)};
  byPath.set(pathName,item);
}

const ranked=[...byPath.values()].map((item)=>{
  const scored=['lcp','cls','inp'].map((metric)=>{
    const value=item.metrics[metric];
    if(!value||value.samples<minSamples||!Number.isFinite(value.p75)) return {metric,ratio:null,eligible:false,...value};
    return {metric,ratio:value.p75/thresholds[metric],eligible:true,...value};
  });
  const eligible=scored.filter((m)=>m.eligible);
  const worst=eligible.sort((a,b)=>(b.ratio??0)-(a.ratio??0))[0]||null;
  const score=worst?.ratio??0;
  const priority=!worst?'COLLECT':score>=1.5?'P0':score>1?'P1':score>=0.8?'P2':'MONITOR';
  const action=!worst?'표본 수집 지속':
    worst.metric==='lcp'?'Hero·폰트·렌더 차단요소·초기 JS 우선 점검':
    worst.metric==='cls'?'이미지 크기 예약·광고·동적 콘텐츠 레이아웃 점검':
    '메인 스레드 long task·이벤트 핸들러·상호작용 JS 점검';
  return {path:item.path,priority,score:Number(score.toFixed(3)),worstMetric:worst?.metric??null,action,metrics:item.metrics};
}).sort((a,b)=>{
  const order={P0:0,P1:1,P2:2,MONITOR:3,COLLECT:4};
  return (order[a.priority]-order[b.priority])||(b.score-a.score)||a.path.localeCompare(b.path);
});

const payload={
  generatedAt:new Date().toISOString(),
  source:'real-user-experience-gate-v1',
  minSamples,
  thresholds,
  paths:ranked.length,
  actionable:ranked.filter((r)=>['P0','P1','P2'].includes(r.priority)).length,
  top10:ranked.slice(0,10),
  ranked
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'ranking.json'),JSON.stringify(payload,null,2)+'\n');

const lines=[
  '# Experience Debt Ranking V1','',
  'RUM p75 기반 페이지별 개선 우선순위. metric별 '+minSamples+' samples 이상일 때만 점수화합니다.','',
  '| Rank | Priority | Path | Worst | Score | Action |',
  '| ---: | --- | --- | --- | ---: | --- |',
  ...ranked.slice(0,10).map((r,i)=>'| '+(i+1)+' | '+r.priority+' | '+r.path+' | '+(r.worstMetric??'-')+' | '+r.score.toFixed(3)+' | '+r.action+' |')
];
fs.writeFileSync(path.join(outDir,'ranking.md'),lines.join('\n')+'\n');
console.log('Experience Debt Ranking V1: '+ranked.length+' paths / actionable '+payload.actionable+'. TOP10='+ranked.slice(0,10).map(r=>r.path+':'+r.priority).join(','));

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const firstPath=process.env.DRIFT_FIRST||path.join(root,'qa-artifacts','first-content-ranking-v1','ranking.json');
const signalsPath=process.env.DRIFT_SIGNALS||path.join(root,'qa-artifacts','business-impact-signals-v1','signals.json');
const visualPath=process.env.DRIFT_VISUAL||path.join(root,'qa-artifacts','visual-asset-contract-v4','report.json');
const rumPath=process.env.DRIFT_RUM||path.join(root,'qa-artifacts','real-user-experience-gate-v1','rum.json');
const outDir=process.env.DRIFT_OUT||path.join(root,'qa-artifacts','ranking-drift-v1');

const read=(p)=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;
const first=read(firstPath);
const signals=read(signalsPath);
const visual=read(visualPath);
const rum=read(rumPath);
if(!first||!signals||!visual||!rum) throw new Error('Ranking Drift V1 requires first/signals/visual/rum reports.');

const sig=new Map((signals.rows||[]).map((r)=>[r.path,r]));
const max={
  seoClicks:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.seoClicks||0))),
  pageViews:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.pageViews||0))),
  estimatedEarningsKrw:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.estimatedEarningsKrw||0)))
};
const norm=(value,maxValue)=>Math.log1p(Math.max(0,Number(value||0)))/Math.log1p(maxValue);
const impactFor=(pathName)=>{
  const s=sig.get(pathName)||{seoClicks:0,pageViews:0,estimatedEarningsKrw:0};
  return {
    impact:0.35*norm(s.seoClicks,max.seoClicks)+0.35*norm(s.pageViews,max.pageViews)+0.30*norm(s.estimatedEarningsKrw,max.estimatedEarningsKrw),
    seoClicks:Number(s.seoClicks||0),
    pageViews:Number(s.pageViews||0),
    revenue:Number(s.estimatedEarningsKrw||0)
  };
};

const visualByPath=new Map();
for(const record of visual.records||[]){
  if(!record.slug) continue;
  const pathName='/articles/'+record.slug;
  const item=visualByPath.get(pathName)||{supporting:0,rasterSources:new Set()};
  if(record.role==='supporting') item.supporting+=1;
  if(record.format==='raster'&&record.src) item.rasterSources.add(record.src);
  visualByPath.set(pathName,item);
}
const effortFor=(pathName,worstMetric)=>{
  const v=visualByPath.get(pathName)||{supporting:0,rasterSources:new Set()};
  let effort=1;
  if(Number(v.supporting||0)>=2) effort+=1;
  if(Number(v.rasterSources?.size||0)>=2) effort+=1;
  const factor=worstMetric==='inp'?1.5:worstMetric==='cls'?1.2:1.0;
  return Math.min(5,Math.max(1,effort*factor));
};

const bootstrap=(first.ranked||[]).map((r)=>{
  const pathName='/articles/'+r.slug;
  const b=impactFor(pathName);
  const debt=Number(r.firstBodyH2TopPx||0)/Math.max(1,Number(first.targetPx||3200));
  const effort=effortFor(pathName,'first-content');
  const value=debt*(1+b.impact)/effort;
  return {path:pathName,value:Number(value.toFixed(3)),debt:Number(debt.toFixed(3)),impact:Number(b.impact.toFixed(3)),effort};
}).sort((a,b)=>b.value-a.value||a.path.localeCompare(b.path));

const overallSamples=rum.metrics?Object.values(rum.metrics).map((v)=>Number(v.samples||0)):[0];
const minOverall=Math.min(...overallSamples);
const milestone=minOverall>=20?20:minOverall>=10?10:minOverall>=5?5:0;
const thresholds=rum.thresholds||{lcp:2500,cls:0.1,inp:200};

const byPath=new Map();
for(const row of rum.byPath||[]){
  const item=byPath.get(row.path)||{path:row.path,metrics:{}};
  item.metrics[row.metric]={p75:Number(row.p75),samples:Number(row.samples||0)};
  byPath.set(row.path,item);
}
const rumRank=[...byPath.values()].map((item)=>{
  const eligible=['lcp','cls','inp'].map((metric)=>{
    const v=item.metrics[metric];
    if(!v||milestone===0||v.samples<milestone||!Number.isFinite(v.p75)) return null;
    return {metric,ratio:v.p75/thresholds[metric],p75:v.p75,samples:v.samples};
  }).filter(Boolean).sort((a,b)=>b.ratio-a.ratio);
  const worst=eligible[0];
  if(!worst) return null;
  const b=impactFor(item.path);
  const effort=effortFor(item.path,worst.metric);
  const value=worst.ratio*(1+b.impact)/effort;
  return {path:item.path,value:Number(value.toFixed(3)),debt:Number(worst.ratio.toFixed(3)),impact:Number(b.impact.toFixed(3)),effort,worstMetric:worst.metric,samples:worst.samples};
}).filter(Boolean).sort((a,b)=>b.value-a.value||a.path.localeCompare(b.path));

const bootTop=bootstrap.slice(0,10);
const rumTop=rumRank.slice(0,10);
const bootPos=new Map(bootstrap.map((r,i)=>[r.path,i+1]));
const rumPos=new Map(rumRank.map((r,i)=>[r.path,i+1]));
const union=[...new Set([...bootTop.map(r=>r.path),...rumTop.map(r=>r.path)])];
const shifts=union.map((pathName)=>({
  path:pathName,
  bootstrapRank:bootPos.get(pathName)||null,
  rumRank:rumPos.get(pathName)||null,
  shift:(bootPos.get(pathName)&&rumPos.get(pathName))?bootPos.get(pathName)-rumPos.get(pathName):null
}));
const overlap=bootTop.filter((r)=>rumTop.some((x)=>x.path===r.path)).length;
const comparable=shifts.filter((r)=>r.shift!==null);
const avgAbsShift=comparable.length?comparable.reduce((s,r)=>s+Math.abs(r.shift),0)/comparable.length:null;
const state=milestone===20?'GOLD':milestone>=5?'PROVISIONAL':'COLLECT';

const payload={
  generatedAt:new Date().toISOString(),
  state,
  milestone,
  overallSamples:Object.fromEntries(Object.entries(rum.metrics||{}).map(([k,v])=>[k,Number(v.samples||0)])),
  bootstrapTop10:bootTop,
  rumTop10:rumTop,
  overlapTop10:overlap,
  overlapRate:Number((overlap/10).toFixed(2)),
  averageAbsoluteRankShift:avgAbsShift===null?null:Number(avgAbsShift.toFixed(2)),
  shifts
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'drift.json'),JSON.stringify(payload,null,2)+'\n');
const lines=['# Bootstrap ↔ RUM Ranking Drift V1','',
'State: **'+state+'**  ','Milestone: **'+milestone+'/20**  ','TOP10 overlap: **'+overlap+'/10**  ','Avg abs rank shift: **'+(payload.averageAbsoluteRankShift??'—')+'**','',
'| Page | Bootstrap Rank | RUM Rank | Shift |','| --- | ---: | ---: | ---: |',
...shifts.map((r)=>`| ${r.path} | ${r.bootstrapRank??'-'} | ${r.rumRank??'-'} | ${r.shift??'-'} |`)];
fs.writeFileSync(path.join(outDir,'drift.md'),lines.join('\n')+'\n');
console.log('Ranking Drift V1: state='+state+' milestone='+milestone+'/20 overlap='+overlap+'/10 avgAbsShift='+(payload.averageAbsoluteRankShift??'n/a'));

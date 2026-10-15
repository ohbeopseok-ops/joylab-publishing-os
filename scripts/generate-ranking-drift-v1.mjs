import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const firstPath=process.env.DRIFT_FIRST||path.join(root,'qa-artifacts','first-content-ranking-v1','ranking.json');
const signalsPath=process.env.DRIFT_SIGNALS||path.join(root,'qa-artifacts','business-impact-signals-v1','signals.json');
const visualPath=process.env.DRIFT_VISUAL||path.join(root,'qa-artifacts','visual-asset-contract-v4','report.json');
const rumPath=process.env.DRIFT_RUM||path.join(root,'qa-artifacts','real-user-experience-gate-v1','rum.json');
const outDir=process.env.DRIFT_OUT||path.join(root,'qa-artifacts','ranking-drift-v1');
const read=(p)=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;
const first=read(firstPath),signals=read(signalsPath),visual=read(visualPath),rum=read(rumPath);
if(!first||!signals||!visual||!rum) throw new Error('Ranking Drift V1 requires first/signals/visual/rum reports.');

const sig=new Map((signals.rows||[]).map((r)=>[r.path,r]));
const max={
  seoClicks:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.seoClicks||0))),
  pageViews:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.pageViews||0))),
  estimatedEarningsKrw:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.estimatedEarningsKrw||0)))
};
const norm=(v,m)=>Math.log1p(Math.max(0,Number(v||0)))/Math.log1p(m);
const impactFor=(p)=>{const s=sig.get(p)||{};return 0.35*norm(s.seoClicks,max.seoClicks)+0.35*norm(s.pageViews,max.pageViews)+0.30*norm(s.estimatedEarningsKrw,max.estimatedEarningsKrw);};
const visualByPath=new Map();
for(const r of visual.records||[]){if(!r.slug)continue;const p='/articles/'+r.slug;const x=visualByPath.get(p)||{supporting:0,rasterSources:new Set()};if(r.role==='supporting')x.supporting++;if(r.format==='raster'&&r.src)x.rasterSources.add(r.src);visualByPath.set(p,x);}
const firstByPath=new Map((first.ranked||[]).map((r)=>['/articles/'+r.slug,r]));
const effortFor=(p,m)=>{const v=visualByPath.get(p)||{supporting:0,rasterSources:new Set()};let e=1;if(firstByPath.has(p))e++;if(v.supporting>=2)e++;if(v.rasterSources.size>=2)e++;return Math.min(5,Math.max(1,e*(m==='inp'?1.5:m==='cls'?1.2:1)));};

const bootstrap=(first.ranked||[]).map((r)=>{const p='/articles/'+r.slug;const debt=Number(r.firstBodyH2TopPx||0)/Math.max(1,Number(first.targetPx||3200));const impact=impactFor(p);const effort=effortFor(p,'first-content');return {path:p,value:Number((debt*(1+impact)/effort).toFixed(3))};}).sort((a,b)=>b.value-a.value||a.path.localeCompare(b.path));
const overallSamples=Object.values(rum.metrics||{}).map((v)=>Number(v.samples||0));
const minOverall=overallSamples.length?Math.min(...overallSamples):0;
const milestone=minOverall>=20?20:minOverall>=10?10:minOverall>=5?5:0;
const thresholds=rum.thresholds||{lcp:2500,cls:0.1,inp:200};
const byPath=new Map();
for(const row of rum.byPath||[]){const item=byPath.get(row.path)||{path:row.path,metrics:{}};item.metrics[row.metric]={p75:Number(row.p75),samples:Number(row.samples||0)};byPath.set(row.path,item);}
const rumRank=[...byPath.values()].map((item)=>{
  const eligible=['lcp','cls','inp'].map((m)=>{const v=item.metrics[m];if(!v||milestone===0||v.samples<milestone||!Number.isFinite(v.p75))return null;return {metric:m,ratio:v.p75/thresholds[m],samples:v.samples};}).filter(Boolean).sort((a,b)=>b.ratio-a.ratio);
  const worst=eligible[0];if(!worst)return null;const impact=impactFor(item.path);const effort=effortFor(item.path,worst.metric);
  return {path:item.path,value:Number((worst.ratio*(1+impact)/effort).toFixed(3)),worstMetric:worst.metric,samples:worst.samples};
}).filter(Boolean).sort((a,b)=>b.value-a.value||a.path.localeCompare(b.path));

const bootTop=bootstrap.slice(0,10),rumTop=rumRank.slice(0,10);
const bootPos=new Map(bootstrap.map((r,i)=>[r.path,i+1])),rumPos=new Map(rumRank.map((r,i)=>[r.path,i+1]));
const union=[...new Set([...bootTop.map(r=>r.path),...rumTop.map(r=>r.path)])];
const shifts=union.map((p)=>({path:p,bootstrapRank:bootPos.get(p)||null,rumRank:rumPos.get(p)||null,shift:(bootPos.get(p)&&rumPos.get(p))?bootPos.get(p)-rumPos.get(p):null}));
const comparable=shifts.filter((r)=>r.shift!==null);
const overlap=bootTop.filter((r)=>rumTop.some((x)=>x.path===r.path)).length;
const overlapRate=overlap/10;
const avgAbsShift=comparable.length?comparable.reduce((s,r)=>s+Math.abs(r.shift),0)/comparable.length:null;
const maxAbsShift=comparable.length?Math.max(...comparable.map((r)=>Math.abs(r.shift))):null;
let spearman=null;
if(comparable.length>=2){
  const n=comparable.length;
  const d2=comparable.reduce((s,r)=>s+Math.pow(r.bootstrapRank-r.rumRank,2),0);
  spearman=1-(6*d2)/(n*(n*n-1));
  spearman=Math.max(-1,Math.min(1,spearman));
}
const rankConsistency=spearman===null?0:(spearman+1)/2;
const maxDriftScore=maxAbsShift===null?0:Math.max(0,1-Math.min(maxAbsShift,10)/10);
const sampleFactor=milestone/20;
const queueConfidenceScore=Math.round(100*(0.4*rankConsistency+0.35*overlapRate+0.25*maxDriftScore)*sampleFactor);
const confidenceLevel=milestone<10?'LOW':milestone<20?(queueConfidenceScore>=45?'MEDIUM':'LOW'):(queueConfidenceScore>=75?'HIGH':queueConfidenceScore>=55?'MEDIUM':'LOW');
const executionMode=milestone>=20&&queueConfidenceScore>=75?'RUM_LED':milestone>=10&&queueConfidenceScore>=45?'PROVISIONAL':'BOOTSTRAP_LOCK';
const eligiblePageCount=rumRank.length;
const state=milestone===20&&eligiblePageCount>0?'GOLD':milestone>=5&&eligiblePageCount>0?'PROVISIONAL':'COLLECT';

const payload={generatedAt:new Date().toISOString(),state,milestone,eligiblePageCount,
  overallSamples:Object.fromEntries(Object.entries(rum.metrics||{}).map(([k,v])=>[k,Number(v.samples||0)])),
  bootstrapTop10:bootTop,rumTop10:rumTop,overlapTop10:overlap,overlapRate:Number(overlapRate.toFixed(2)),
  spearman:spearman===null?null:Number(spearman.toFixed(3)),averageAbsoluteRankShift:avgAbsShift===null?null:Number(avgAbsShift.toFixed(2)),
  maxAbsoluteRankShift:maxAbsShift,queueConfidenceScore,confidenceLevel,executionMode,shifts};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'drift.json'),JSON.stringify(payload,null,2)+'\n');
const lines=['# Bootstrap ↔ RUM Ranking Drift V1','',
  'State: **'+state+'**  ','Milestone: **'+milestone+'/20**  ','Queue Confidence: **'+queueConfidenceScore+'/100 ('+confidenceLevel+')**  ',
  'Execution mode: **'+executionMode+'**  ','Spearman: **'+(payload.spearman??'—')+'**  ','TOP10 overlap: **'+overlap+'/10**  ',
  'Avg abs shift: **'+(payload.averageAbsoluteRankShift??'—')+'**  ','Max abs shift: **'+(payload.maxAbsoluteRankShift??'—')+'**','',
  '| Page | Bootstrap Rank | RUM Rank | Shift |','| --- | ---: | ---: | ---: |',
  ...shifts.map((r)=>`| ${r.path} | ${r.bootstrapRank??'-'} | ${r.rumRank??'-'} | ${r.shift??'-'} |`)];
fs.writeFileSync(path.join(outDir,'drift.md'),lines.join('\n')+'\n');
console.log('Ranking Drift V1: confidence='+queueConfidenceScore+' mode='+executionMode+' spearman='+(payload.spearman??'n/a')+' overlap='+overlap+'/10 maxShift='+(maxAbsShift??'n/a'));

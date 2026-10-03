import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const effortPath=process.env.OFFICIAL_QUEUE_EFFORT||path.join(root,'qa-artifacts','business-impact-effort-v2','ranking.json');
const firstPath=process.env.OFFICIAL_QUEUE_FIRST||path.join(root,'qa-artifacts','first-content-ranking-v1','ranking.json');
const signalsPath=process.env.OFFICIAL_QUEUE_SIGNALS||path.join(root,'qa-artifacts','business-impact-signals-v1','signals.json');
const visualPath=process.env.OFFICIAL_QUEUE_VISUAL||path.join(root,'qa-artifacts','visual-asset-contract-v4','report.json');
const rumPath=process.env.OFFICIAL_QUEUE_RUM||path.join(root,'qa-artifacts','real-user-experience-gate-v1','rum.json');
const outDir=process.env.OFFICIAL_QUEUE_OUT||path.join(root,'qa-artifacts','official-execution-queue-v1');

const read=(p)=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;
const effort=read(effortPath);
const first=read(firstPath);
const signals=read(signalsPath);
const visual=read(visualPath);
const rum=read(rumPath);

if(!first) throw new Error('First Content ranking is required.');
if(!signals) throw new Error('Business impact signals are required.');
if(!visual) throw new Error('Visual Asset report is required.');

const rumReady=rum?.decision==='PASS' && (effort?.ranked?.length||0)>0;
let mode=rumReady?'RUM_GOLD':'BOOTSTRAP_FIRST_CONTENT';
let ranked=[];

if(rumReady){
  ranked=(effort.ranked||[]).map((r)=>({
    path:r.path,
    source:'RUM',
    tier:r.executionTier,
    executionValue:Number(r.executionValue||0),
    debtScore:Number(r.debtScore||0),
    businessImpact:Number(r.businessImpact||0),
    effortScore:Number(r.effortScore||1),
    worstMetric:r.worstMetric||null,
    seoClicks:Number(r.seoClicks||0),
    pageViews:Number(r.pageViews||0),
    estimatedEarningsKrw:Number(r.estimatedEarningsKrw||0),
    action:r.action||''
  }));
}else{
  const sig=new Map((signals.rows||[]).map((r)=>[r.path,r]));
  const max={
    seoClicks:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.seoClicks||0))),
    pageViews:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.pageViews||0))),
    estimatedEarningsKrw:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.estimatedEarningsKrw||0)))
  };
  const norm=(value,maxValue)=>Math.log1p(Math.max(0,Number(value||0)))/Math.log1p(maxValue);

  const visualByPath=new Map();
  for(const record of visual.records||[]){
    if(!record.slug) continue;
    const p='/articles/'+record.slug;
    const item=visualByPath.get(p)||{supporting:0,rasterSources:new Set()};
    if(record.role==='supporting') item.supporting+=1;
    if(record.format==='raster'&&record.src) item.rasterSources.add(record.src);
    visualByPath.set(p,item);
  }

  ranked=(first.ranked||[]).map((r)=>{
    const pathName='/articles/'+r.slug;
    const s=sig.get(pathName)||{seoClicks:0,seoImpressions:0,pageViews:0,estimatedEarningsKrw:0};
    const seo=norm(s.seoClicks,max.seoClicks);
    const traffic=norm(s.pageViews,max.pageViews);
    const revenue=norm(s.estimatedEarningsKrw,max.estimatedEarningsKrw);
    const businessImpact=0.35*seo+0.35*traffic+0.30*revenue;
    const debtScore=Number(r.firstBodyH2TopPx||0)/Math.max(1,Number(first.targetPx||3200));
    const combined=debtScore*(1+businessImpact);
    const v=visualByPath.get(pathName)||{supporting:0,rasterSources:new Set()};
    let effortScore=1;
    if(Number(v.supporting||0)>=2) effortScore+=1;
    if(Number(v.rasterSources?.size||0)>=2) effortScore+=1;
    effortScore=Math.min(5,Math.max(1,effortScore));
    const executionValue=combined/effortScore;
    const tier=executionValue>=1.2?'X0':executionValue>=0.8?'X1':executionValue>=0.45?'X2':'MONITOR';
    return {
      path:pathName,
      source:'FIRST_CONTENT_BOOTSTRAP',
      tier,
      executionValue:Number(executionValue.toFixed(3)),
      debtScore:Number(debtScore.toFixed(3)),
      businessImpact:Number(businessImpact.toFixed(3)),
      effortScore,
      worstMetric:'first-content',
      firstBodyH2TopPx:Number(r.firstBodyH2TopPx||0),
      excessPx:Number(r.excessPx||0),
      seoClicks:Number(s.seoClicks||0),
      pageViews:Number(s.pageViews||0),
      estimatedEarningsKrw:Number(s.estimatedEarningsKrw||0),
      action:'모바일 첫 본문 진입을 3,200px 이하로 압축'
    };
  }).sort((a,b)=>b.executionValue-a.executionValue||b.pageViews-a.pageViews||a.path.localeCompare(b.path));
}

const queue=ranked.slice(0,10).map((r,index)=>({...r,rank:index+1,status:'READY'}));
const payload={
  generatedAt:new Date().toISOString(),
  mode,
  gold:rumReady,
  note:rumReady
    ? 'RUM p75 + Business Impact + Effort 기반 GOLD 실행 큐.'
    : 'RUM 표본이 READY가 될 때까지 First Content Debt + Business Impact + Effort로 운영하는 Bootstrap 실행 큐.',
  rumDecision:rum?.decision||'MISSING',
  rumSamples:rum?.metrics?Object.fromEntries(Object.entries(rum.metrics).map(([k,v])=>[k,Number(v.samples||0)])):{},
  slots:10,
  filled:queue.length,
  queue
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'queue.json'),JSON.stringify(payload,null,2)+'\n');

const lines=[
  '# JoyLab Official Execution Queue V1','',
  'Mode: **'+mode+'**  ',
  'RUM: **'+(rum?.decision||'MISSING')+'**  ',
  'Filled: **'+queue.length+'/10**','',
  '| Rank | Tier | Page | Value | Debt | Impact | Effort | PV | SEO | Action |',
  '| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ...queue.map((r)=>`| ${r.rank} | ${r.tier} | ${r.path} | ${r.executionValue} | ${r.debtScore} | ${r.businessImpact} | ${r.effortScore} | ${r.pageViews} | ${r.seoClicks} | ${r.action} |`)
];
fs.writeFileSync(path.join(outDir,'queue.md'),lines.join('\n')+'\n');
console.log('Official Execution Queue V1: mode='+mode+' filled='+queue.length+'/10 rum='+(rum?.decision||'MISSING'));
console.log(queue.map((r)=>r.rank+'. '+r.path+' '+r.tier+' value='+r.executionValue).join('\n'));

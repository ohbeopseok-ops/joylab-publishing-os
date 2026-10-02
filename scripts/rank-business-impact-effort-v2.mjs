import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const businessPath=process.env.BUSINESS_IMPACT_JSON||path.join(root,'qa-artifacts','business-impact-debt-v1','ranking.json');
const firstPath=process.env.FIRST_CONTENT_JSON||path.join(root,'qa-artifacts','first-content-ranking-v1','ranking.json');
const visualPath=process.env.VISUAL_JSON||path.join(root,'qa-artifacts','visual-asset-contract-v4','report.json');
const outDir=process.env.EFFORT_RANKING_OUT||path.join(root,'qa-artifacts','business-impact-effort-v2');

if(!fs.existsSync(businessPath)) throw new Error('Business impact ranking missing: '+businessPath);
const business=JSON.parse(fs.readFileSync(businessPath,'utf8'));
const first=fs.existsSync(firstPath)?JSON.parse(fs.readFileSync(firstPath,'utf8')):{ranked:[]};
const visual=fs.existsSync(visualPath)?JSON.parse(fs.readFileSync(visualPath,'utf8')):{records:[]};

const firstByPath=new Map((first.ranked||[]).map((r)=>['/articles/'+r.slug,r]));
const visualByPath=new Map();
for(const record of visual.records||[]){
  if(!record.slug) continue;
  const p='/articles/'+record.slug;
  const item=visualByPath.get(p)||{supporting:0,hero:0,og:0,rasterSources:new Set(),svgSources:new Set()};
  if(record.role==='supporting') item.supporting+=1;
  if(record.role==='hero') item.hero+=1;
  if(record.role==='og') item.og+=1;
  if(record.format==='raster'&&record.src) item.rasterSources.add(record.src);
  if(record.format==='svg'&&record.src) item.svgSources.add(record.src);
  visualByPath.set(p,item);
}

const metricEffort={lcp:1.0,cls:1.2,inp:1.5};
const rows=(business.ranked||[]).map((r)=>{
  const firstEntry=firstByPath.get(r.path);
  const visualInfo=visualByPath.get(r.path)||{supporting:0,hero:0,og:0,rasterSources:new Set(),svgSources:new Set()};

  let effort=1;
  const reasons=['base'];
  if(Number(firstEntry?.firstBodyH2TopPx||0)>3200){effort+=1;reasons.push('long-first-content');}
  if(Number(visualInfo.supporting||0)>=2){effort+=1;reasons.push('multi-supporting-visuals');}
  if(Number(visualInfo.rasterSources?.size||0)>=2){effort+=1;reasons.push('multi-raster-assets');}
  const metricFactor=metricEffort[r.worstMetric]||1.0;
  effort*=metricFactor;
  effort=Math.min(5,Math.max(1,effort));

  const executionValue=Number(r.combinedScore||0)/effort;
  const executionTier=r.tier==='COLLECT'?'COLLECT':
    executionValue>=1.2?'X0':
    executionValue>=0.8?'X1':
    executionValue>=0.45?'X2':'MONITOR';

  return {
    path:r.path,
    executionTier,
    executionValue:Number(executionValue.toFixed(3)),
    combinedScore:Number(r.combinedScore||0),
    debtScore:Number(r.debtScore||0),
    businessImpact:Number(r.businessImpact||0),
    effortScore:Number(effort.toFixed(2)),
    effortReasons:reasons,
    worstMetric:r.worstMetric,
    seoClicks:Number(r.seoClicks||0),
    pageViews:Number(r.pageViews||0),
    estimatedEarningsKrw:Number(r.estimatedEarningsKrw||0),
    action:r.action
  };
}).sort((a,b)=>{
  const order={X0:0,X1:1,X2:2,MONITOR:3,COLLECT:4};
  return (order[a.executionTier]-order[b.executionTier])||(b.executionValue-a.executionValue)||a.path.localeCompare(b.path);
});

const payload={
  generatedAt:new Date().toISOString(),
  formula:'executionValue = businessImpactDebt.combinedScore / effortScore',
  effortModel:{
    base:1,
    longFirstContent:'+1 when first body H2 > 3200px',
    multiSupportingVisuals:'+1 when supporting images >= 2',
    multiRasterAssets:'+1 when distinct raster assets >= 2',
    metricFactor:{lcp:1.0,cls:1.2,inp:1.5},
    clamp:'1..5'
  },
  rows:rows.length,
  actionable:rows.filter(r=>['X0','X1','X2'].includes(r.executionTier)).length,
  top10:rows.slice(0,10),
  ranked:rows
};

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'ranking.json'),JSON.stringify(payload,null,2)+'\n');
const md=[
  '# Business Impact × Effort Ranking V2','',
  '효과 대비 수정비용 기준 실행 우선순위.','',
  '| Rank | Tier | Path | Execution Value | Combined | Effort | Worst |',
  '| ---: | --- | --- | ---: | ---: | ---: | --- |',
  ...rows.slice(0,10).map((r,i)=>`| ${i+1} | ${r.executionTier} | ${r.path} | ${r.executionValue} | ${r.combinedScore} | ${r.effortScore} | ${r.worstMetric??'-'} |`)
];
fs.writeFileSync(path.join(outDir,'ranking.md'),md.join('\n')+'\n');
console.log('Business Impact × Effort Ranking V2: '+rows.length+' paths / actionable '+payload.actionable+'.');

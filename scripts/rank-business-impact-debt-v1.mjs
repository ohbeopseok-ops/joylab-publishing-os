import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const debtPath=process.env.EXPERIENCE_DEBT_JSON||path.join(root,'qa-artifacts','experience-debt-ranking-v1','ranking.json');
const signalsPath=process.env.BUSINESS_SIGNALS_JSON||path.join(root,'qa-artifacts','business-impact-signals-v1','signals.json');
const outDir=process.env.BUSINESS_IMPACT_OUT||path.join(root,'qa-artifacts','business-impact-debt-v1');
if(!fs.existsSync(debtPath)) throw new Error('Experience Debt report missing: '+debtPath);
if(!fs.existsSync(signalsPath)) throw new Error('Business signals missing: '+signalsPath);

const debt=JSON.parse(fs.readFileSync(debtPath,'utf8'));
const signals=JSON.parse(fs.readFileSync(signalsPath,'utf8'));
const sig=new Map((signals.rows||[]).map((r)=>[r.path,r]));
const max={
  seoClicks:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.seoClicks||0))),
  pageViews:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.pageViews||0))),
  estimatedEarningsKrw:Math.max(1,...(signals.rows||[]).map((r)=>Number(r.estimatedEarningsKrw||0)))
};
const norm=(value,maxValue)=>Math.log1p(Math.max(0,Number(value||0)))/Math.log1p(maxValue);
const rows=(debt.ranked||[]).map((r)=>{
  const s=sig.get(r.path)||{seoClicks:0,pageViews:0,estimatedEarningsKrw:0,seoImpressions:0};
  const seo=norm(s.seoClicks,max.seoClicks);
  const traffic=norm(s.pageViews,max.pageViews);
  const revenue=norm(s.estimatedEarningsKrw,max.estimatedEarningsKrw);
  const businessImpact=0.35*seo+0.35*traffic+0.30*revenue;
  const debtScore=Number(r.score||0);
  const combined=debtScore*(1+businessImpact);
  const tier=r.priority==='COLLECT'?'COLLECT':combined>=2.0?'B0':combined>=1.25?'B1':combined>=0.8?'B2':'MONITOR';
  return {
    path:r.path,
    tier,
    combinedScore:Number(combined.toFixed(3)),
    debtScore,
    businessImpact:Number(businessImpact.toFixed(3)),
    worstMetric:r.worstMetric,
    seoClicks:Number(s.seoClicks||0),
    seoImpressions:Number(s.seoImpressions||0),
    pageViews:Number(s.pageViews||0),
    estimatedEarningsKrw:Number(s.estimatedEarningsKrw||0),
    action:r.action
  };
}).sort((a,b)=>{
  const order={B0:0,B1:1,B2:2,MONITOR:3,COLLECT:4};
  return (order[a.tier]-order[b.tier])||(b.combinedScore-a.combinedScore)||a.path.localeCompare(b.path);
});
const payload={generatedAt:new Date().toISOString(),formula:'debtScore × (1 + businessImpact); businessImpact = SEO 35% + pageViews 35% + AdSense earnings 30% (log-normalized)',rows:rows.length,top10:rows.slice(0,10),ranked:rows};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'ranking.json'),JSON.stringify(payload,null,2)+'\n');
const lines=['# Business Impact Debt Ranking V1','',
'품질 부채 × 사업 영향 우선순위. SEO clicks 35% + page views 35% + AdSense earnings 30%.','',
'| Rank | Tier | Path | Combined | Debt | SEO clicks | Page views | Revenue KRW |',
'| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |',
...rows.slice(0,10).map((r,i)=>`| ${i+1} | ${r.tier} | ${r.path} | ${r.combinedScore} | ${r.debtScore} | ${r.seoClicks} | ${r.pageViews} | ${r.estimatedEarningsKrw.toFixed(2)} |`)];
fs.writeFileSync(path.join(outDir,'ranking.md'),lines.join('\n')+'\n');
console.log('Business Impact Debt Ranking V1: '+rows.length+' paths. TOP10='+rows.slice(0,10).map(r=>r.path+':'+r.tier).join(','));

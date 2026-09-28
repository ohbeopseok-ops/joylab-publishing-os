import fs from 'node:fs';
import path from 'node:path';

const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset=process.env.CLOUDFLARE_ANALYTICS_DATASET || 'joylab_events_v1';
const requestedScope=process.env.MONETIZATION_PAGE_SCOPE || 'article';
const scopeConfig={
  article:{
    scope:'article',
    view:'article_view',
    read50:'article_read_50',
    read90:'article_read_90',
    cta:'article_contact_click',
    exit:'article_exit',
    cls:'article_cls_v2'
  },
  guide:{
    scope:'guide',
    view:'guide_view',
    read50:'guide_read_50',
    read90:'guide_read_90',
    cta:'guide_cta_click',
    exit:'guide_exit',
    cls:'guide_cls_v2'
  },
  book:{
    scope:'book',
    view:'book_landing_view',
    read50:'book_landing_read_50',
    read90:'book_landing_read_90',
    cta:'book_landing_cta_click',
    exit:'book_landing_exit',
    cls:'book_landing_cls_v2'
  }
};
const selected=scopeConfig[requestedScope] || scopeConfig.article;
const scope=selected.scope;
const eventNames={
  view:selected.view,
  read50:selected.read50,
  read90:selected.read90,
  cta:selected.cta,
  exit:selected.exit,
  cls:selected.cls
};
const days=Math.max(1,Math.min(30,Number(process.env.MONETIZATION_UX_DAYS || 7)));
const out=process.env.CLOUDFLARE_UX_OUT || 'qa-artifacts/adsense-monetization-gate-v1/cloudflare-ux.json';

if(!accountId||!token) throw new Error('Cloudflare UX adapter requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_READ_TOKEN.');

const endpoint=`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
async function query(sql){
  const res=await fetch(endpoint,{
    method:'POST',
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'text/plain'},
    body:`${sql}\nFORMAT JSON`
  });
  if(!res.ok) throw new Error(`Cloudflare Analytics SQL ${res.status}: ${await res.text()}`);
  const json=await res.json();
  return Array.isArray(json)?json:(json.data??json.result??[]);
}
const count=(rows,key='count')=>Number(rows?.[0]?.[key]||0);
async function windowMetrics(fromDaysAgo,toDaysAgo){
  const where=`timestamp > NOW() - INTERVAL '${fromDaysAgo}' DAY AND timestamp <= NOW() - INTERVAL '${toDaysAgo}' DAY`;
  const events=await query(`
    SELECT index1 AS event, blob3 AS placement, SUM(_sample_interval) AS count
    FROM ${dataset}
    WHERE ${where} AND index1 IN ('${eventNames.view}','${eventNames.read50}','${eventNames.read90}','${eventNames.cta}','${eventNames.exit}')
    GROUP BY index1, blob3
  `);
  const clsRows=await query(`
    SELECT blob2 AS cls_value, blob4 AS path, SUM(_sample_interval) AS samples
    FROM ${dataset}
    WHERE ${where} AND index1 = '${eventNames.cls}'
    GROUP BY blob2, blob4
  `);
  const get=(event,placement=null)=>events
    .filter(r=>r.event===event && (placement==null||r.placement===placement))
    .reduce((sum,r)=>sum+Number(r.count||0),0);

  const views=get(eventNames.view);
  const read50=get(eventNames.read50);
  const read90=get(eventNames.read90);
  const cta=get(eventNames.cta);
  const earlyExit=get(eventNames.exit,'early_exit');

  const clsSamples=clsRows
    .map(r=>({
      value:Number(r.cls_value),
      path:String(r.path||'-'),
      samples:Number(r.samples||0)
    }))
    .filter(r=>Number.isFinite(r.value)&&r.samples>0);

  const weightedP75=(rows)=>{
    const distribution=rows
      .map(r=>({value:r.value,samples:r.samples}))
      .sort((a,b)=>a.value-b.value);
    const total=distribution.reduce((s,r)=>s+r.samples,0);
    if(!total) return null;
    const target=total*0.75;
    let cumulative=0;
    for(const row of distribution){
      cumulative+=row.samples;
      if(cumulative>=target) return row.value;
    }
    return distribution.at(-1)?.value??null;
  };

  const distributionMap=new Map();
  for(const row of clsSamples){
    const key=row.value;
    distributionMap.set(key,(distributionMap.get(key)||0)+row.samples);
  }
  const distribution=[...distributionMap.entries()]
    .map(([value,samples])=>({value:Number(value),samples}))
    .sort((a,b)=>a.value-b.value);

  const byPathMap=new Map();
  for(const row of clsSamples){
    const list=byPathMap.get(row.path)||[];
    list.push(row);
    byPathMap.set(row.path,list);
  }
  const clsByPath=[...byPathMap.entries()]
    .map(([path,rows])=>({
      path,
      samples:rows.reduce((s,r)=>s+r.samples,0),
      p75:weightedP75(rows),
      max:Math.max(...rows.map(r=>r.value))
    }))
    .sort((a,b)=>(b.p75??-1)-(a.p75??-1)||b.samples-a.samples);

  const totalSamples=clsSamples.reduce((s,r)=>s+r.samples,0);
  const clsP75=weightedP75(clsSamples);
  return {
    views,
    read50,
    read90,
    ctaClicks:cta,
    earlyExits:earlyExit,
    readingDepthPct:views?read50/views*100:null,
    read90RatePct:views?read90/views*100:null,
    ctaConversionPct:views?cta/views*100:null,
    exitRatePct:views?earlyExit/views*100:null,
    clsP75,
    clsSamples:totalSamples,
    clsDistribution:distribution,
    clsByPath
  };
}
const current=await windowMetrics(days+1,1);
const baseline=await windowMetrics(days*2+1,days+1);
const payload={
  source:'cloudflare-analytics-engine',
  dataset,
  scope,
  windowDays:days,
  metricDefinitions:{
    readingDepthPct:`Share of ${scope} views reaching at least 50% scroll depth.`,
    exitRatePct:`Share of ${scope} views ending before 25% scroll depth and before 30 visible seconds.`,
    ctaConversionPct:scope==='guide'?'Guide internal CTA clicks divided by guide views.':scope==='book'?'Books landing CTA clicks divided by Books landing views.':'Article contact CTA clicks divided by article views.',
    clsP75:'Weighted p75 of Web Vitals session-window CLS v2 values.'
  },
  current,
  baseline
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify(payload,null,2));

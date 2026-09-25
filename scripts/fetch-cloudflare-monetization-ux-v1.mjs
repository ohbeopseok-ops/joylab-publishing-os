import fs from 'node:fs';
import path from 'node:path';

const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset=process.env.CLOUDFLARE_ANALYTICS_DATASET || 'joylab_events_v1';
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
    WHERE ${where} AND index1 IN ('article_view','article_read_50','article_read_90','article_contact_click','article_exit')
    GROUP BY index1, blob3
  `);
  const clsRows=await query(`
    SELECT blob2 AS cls_value, SUM(_sample_interval) AS samples
    FROM ${dataset}
    WHERE ${where} AND index1 = 'article_cls'
    GROUP BY blob2
  `);
  const get=(event,placement=null)=>events
    .filter(r=>r.event===event && (placement==null||r.placement===placement))
    .reduce((sum,r)=>sum+Number(r.count||0),0);

  const views=get('article_view');
  const read50=get('article_read_50');
  const read90=get('article_read_90');
  const cta=get('article_contact_click');
  const earlyExit=get('article_exit','early_exit');

  const distribution=clsRows
    .map(r=>({value:Number(r.cls_value),samples:Number(r.samples||0)}))
    .filter(r=>Number.isFinite(r.value)&&r.samples>0)
    .sort((a,b)=>a.value-b.value);
  const totalSamples=distribution.reduce((s,r)=>s+r.samples,0);
  let clsP75=null;
  if(totalSamples>0){
    const target=totalSamples*0.75;
    let cumulative=0;
    for(const row of distribution){
      cumulative+=row.samples;
      if(cumulative>=target){clsP75=row.value;break;}
    }
  }
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
    clsSamples:totalSamples
  };
}
const current=await windowMetrics(days+1,1);
const baseline=await windowMetrics(days*2+1,days+1);
const payload={
  source:'cloudflare-analytics-engine',
  dataset,
  windowDays:days,
  metricDefinitions:{
    readingDepthPct:'Share of article views reaching at least 50% scroll depth.',
    exitRatePct:'Share of article views ending before 25% scroll depth and before 30 visible seconds.',
    ctaConversionPct:'Article contact CTA clicks divided by article views.',
    clsP75:'Weighted p75 of client-reported CLS values.'
  },
  current,
  baseline
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify(payload,null,2));

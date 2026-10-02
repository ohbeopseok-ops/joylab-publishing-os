import fs from 'node:fs';
import path from 'node:path';

const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset=process.env.CLOUDFLARE_ANALYTICS_DATASET||'joylab_events_v1';
const days=Math.max(1,Math.min(30,Number(process.env.RUM_DAYS||7)));
const minSamples=Math.max(1,Number(process.env.RUM_MIN_SAMPLES||20));
const out=process.env.RUM_OUT||'qa-artifacts/real-user-experience-gate-v1/rum.json';
if(!accountId||!token) throw new Error('RUM adapter requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_READ_TOKEN.');

const endpoint=`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
async function query(sql){
  const res=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'text/plain'},body:`${sql}\nFORMAT JSON`});
  if(!res.ok){
    const body=await res.text();
    if(res.status===422 && /unable to find type of column/i.test(body)){
      console.warn('Cloudflare Analytics schema not ready for Web Vitals yet; treating as COLLECT.');
      return [];
    }
    throw new Error(`Cloudflare Analytics SQL ${res.status}: ${body}`);
  }
  const json=await res.json();
  return Array.isArray(json)?json:(json.data??json.result??[]);
}

const rows=await query(`
  SELECT
    blob2 AS metric,
    blob3 AS device,
    quantileExactWeighted(0.75)(double1, _sample_interval) AS p75,
    SUM(_sample_interval) AS samples
  FROM ${dataset}
  WHERE timestamp > NOW() - INTERVAL '${days}' DAY
    AND index1 = 'web_vital'
    AND blob4 != '/__smoke'
    AND blob2 IN ('lcp','cls','inp')
  GROUP BY blob2, blob3
  ORDER BY blob2, blob3
`);

const overall=await query(`
  SELECT
    blob2 AS metric,
    quantileExactWeighted(0.75)(double1, _sample_interval) AS p75,
    SUM(_sample_interval) AS samples
  FROM ${dataset}
  WHERE timestamp > NOW() - INTERVAL '${days}' DAY
    AND index1 = 'web_vital'
    AND blob4 != '/__smoke'
    AND blob2 IN ('lcp','cls','inp')
  GROUP BY blob2
  ORDER BY blob2
`);

const pathRows=await query(`
  SELECT
    blob4 AS path,
    blob2 AS metric,
    quantileExactWeighted(0.75)(double1, _sample_interval) AS p75,
    SUM(_sample_interval) AS samples
  FROM ${dataset}
  WHERE timestamp > NOW() - INTERVAL '${days}' DAY
    AND index1 = 'web_vital'
    AND blob4 != '/__smoke'
    AND blob2 IN ('lcp','cls','inp')
  GROUP BY blob4, blob2
  ORDER BY blob4, blob2
`);

const thresholds={lcp:2500,cls:0.1,inp:200};
const metrics=Object.fromEntries(['lcp','cls','inp'].map((metric)=>{
  const row=overall.find((r)=>r.metric===metric);
  return [metric,{p75:row?Number(row.p75):null,samples:row?Number(row.samples):0,threshold:thresholds[metric]}];
}));
const insufficient=Object.entries(metrics).filter(([,v])=>v.samples<minSamples).map(([k])=>k);
const exceeded=Object.entries(metrics).filter(([,v])=>v.samples>=minSamples&&v.p75!==null&&v.p75>v.threshold).map(([k])=>k);
const decision=exceeded.length?'FAIL':insufficient.length?'COLLECT':'PASS';

const payload={
  generatedAt:new Date().toISOString(),
  source:'cloudflare-analytics-engine',
  dataset,
  windowDays:days,
  minSamples,
  thresholds,
  decision,
  insufficient,
  exceeded,
  metrics,
  byDevice:rows.map((r)=>({metric:r.metric,device:r.device,p75:Number(r.p75),samples:Number(r.samples)})),
  byPath:pathRows.map((r)=>({path:String(r.path||'/'),metric:r.metric,p75:Number(r.p75),samples:Number(r.samples)}))
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify(payload,null,2));
if(decision==='FAIL') process.exit(1);

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const gscPath=process.env.BUSINESS_GSC_JSON||path.join(root,'qa-artifacts','gsc-7d','gsc-7d.json');
const adsPath=process.env.BUSINESS_ADSENSE_JSON||path.join(root,'qa-artifacts','business-impact-signals-v1','adsense.json');
const out=process.env.BUSINESS_SIGNALS_OUT||path.join(root,'qa-artifacts','business-impact-signals-v1','signals.json');
const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset=process.env.CLOUDFLARE_ANALYTICS_DATASET||'joylab_events_v1';
const days=Math.max(1,Math.min(30,Number(process.env.BUSINESS_SIGNAL_DAYS||7)));

if(!fs.existsSync(gscPath)) throw new Error('GSC report missing: '+gscPath);
if(!fs.existsSync(adsPath)) throw new Error('AdSense report missing: '+adsPath);
if(!accountId||!token) throw new Error('Cloudflare credentials required for page views.');

const gsc=JSON.parse(fs.readFileSync(gscPath,'utf8'));
const ads=JSON.parse(fs.readFileSync(adsPath,'utf8'));
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
const query=async(sql)=>{
  const res=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'text/plain'},body:`${sql}\nFORMAT JSON`});
  if(!res.ok) throw new Error(`Cloudflare Analytics SQL ${res.status}: ${await res.text()}`);
  const json=await res.json();
  return Array.isArray(json)?json:(json.data??json.result??[]);
};
const views=await query(`
  SELECT blob4 AS path, SUM(_sample_interval) AS views
  FROM ${dataset}
  WHERE timestamp > NOW() - INTERVAL '${days}' DAY
    AND index1 = 'article_view'
  GROUP BY blob4
  ORDER BY views DESC
`);

const normalizePath=(value)=>{
  try{
    if(/^https?:\/\//i.test(value)) return new URL(value).pathname||'/';
  }catch{}
  const s=String(value||'/').split('?')[0].split('#')[0];
  return s.startsWith('/')?s:'/'+s;
};
const map=new Map();
const ensure=(p)=>{
  const pathName=normalizePath(p);
  if(!map.has(pathName)) map.set(pathName,{path:pathName,seoClicks:0,seoImpressions:0,pageViews:0,estimatedEarningsKrw:0});
  return map.get(pathName);
};
for(const row of gsc.topPages||[]){
  const item=ensure(row.page);
  item.seoClicks=Number(row.clicks||0);
  item.seoImpressions=Number(row.impressions||0);
}
for(const row of ads.pages||[]){
  const item=ensure(row.path||row.pageUrl);
  item.estimatedEarningsKrw=Number(row.estimatedEarningsKrw||0);
  if(!item.pageViews) item.pageViews=Number(row.pageViews||0);
}
for(const row of views||[]){
  const item=ensure(row.path);
  item.pageViews=Number(row.views||0);
}
const rows=[...map.values()].filter((r)=>r.path.startsWith('/articles/')).sort((a,b)=>b.pageViews-a.pageViews||b.seoClicks-a.seoClicks);
const payload={generatedAt:new Date().toISOString(),windowDays:days,source:{gsc:'search-console',revenue:'adsense-management-api-v2',pageViews:'cloudflare-analytics-engine'},rows};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(payload,null,2)+'\n');
console.log('Business Impact Signals V1: '+rows.length+' article paths.');

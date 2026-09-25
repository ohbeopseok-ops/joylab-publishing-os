import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const outPath=process.argv.find(x=>x.startsWith('--out='))?.slice(6) || 'qa-artifacts/adsense-monetization/adsense.json';
const days=Math.max(1,Math.min(90,Number(process.argv.find(x=>x.startsWith('--days='))?.slice(7)||7));
const account=(process.env.ADSENSE_ACCOUNT_NAME || 'accounts/pub-6938956176929357').replace(/^\/+|\/+$/g,'');
const siteDomain=process.env.ADSENSE_SITE_DOMAIN || 'aijoylab.kr';

async function getAccessToken(){
  if(process.env.ADSENSE_ACCESS_TOKEN) return process.env.ADSENSE_ACCESS_TOKEN;
  const clientId=process.env.ADSENSE_OAUTH_CLIENT_ID;
  const clientSecret=process.env.ADSENSE_OAUTH_CLIENT_SECRET;
  const refreshToken=process.env.ADSENSE_OAUTH_REFRESH_TOKEN;
  if(!clientId||!clientSecret||!refreshToken){
    throw new Error('AdSense adapter requires ADSENSE_ACCESS_TOKEN or ADSENSE_OAUTH_CLIENT_ID + ADSENSE_OAUTH_CLIENT_SECRET + ADSENSE_OAUTH_REFRESH_TOKEN.');
  }
  const r=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({
      client_id:clientId,
      client_secret:clientSecret,
      refresh_token:refreshToken,
      grant_type:'refresh_token'
    })
  });
  if(!r.ok) throw new Error(`AdSense OAuth ${r.status}: ${await r.text()}`);
  const p=await r.json();
  if(!p.access_token) throw new Error('AdSense OAuth response missing access_token.');
  return p.access_token;
}

function fmt(d){return d.toISOString().slice(0,10);}
function dateParam(prefix,date){
  const [year,month,day]=fmt(date).split('-');
  return [[`${prefix}.year`,year],[`${prefix}.month`,String(Number(month))],[`${prefix}.day`,String(Number(day))]];
}
function cellValue(cell){
  if(!cell) return null;
  if(cell.value!=null) return Number(cell.value);
  if(cell.stringValue!=null) return Number(cell.stringValue);
  return null;
}

const end=new Date();
end.setUTCDate(end.getUTCDate()-1);
const start=new Date(end);
start.setUTCDate(start.getUTCDate()-(days-1));
const token=await getAccessToken();

const params=new URLSearchParams();
for(const [k,v] of [...dateParam('startDate',start),...dateParam('endDate',end)]) params.append(k,v);
for(const metric of ['ESTIMATED_EARNINGS','PAGE_VIEWS','IMPRESSIONS','INDIVIDUAL_AD_IMPRESSIONS','PAGE_VIEWS_RPM','IMPRESSIONS_RPM','CLICKS']) params.append('metrics',metric);
params.append('dimensions','DATE');
params.append('reportingTimeZone','ACCOUNT_TIME_ZONE');
params.append('currencyCode','KRW');
params.append('languageCode','en');
if(siteDomain) params.append('filters',`OWNED_SITE_DOMAIN_NAME==${siteDomain}`);

const url=`https://adsense.googleapis.com/v2/${account}/reports:generate?${params.toString()}`;
const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
if(!res.ok) throw new Error(`AdSense report ${res.status}: ${await res.text()}`);
const payload=await res.json();
const headers=(payload.headers||[]).map(h=>h.name);
const index=Object.fromEntries(headers.map((h,i)=>[h,i]));
const sums={estimatedEarningsKrw:0,pageViews:0,impressions:0,individualAdImpressions:0,clicks:0};
let weightedPageRpmNumerator=0,weightedImpressionRpmNumerator=0;
for(const row of payload.rows||[]){
  const cells=row.cells||[];
  const pv=cellValue(cells[index.PAGE_VIEWS])||0;
  const imp=cellValue(cells[index.IMPRESSIONS])||0;
  const rpm=cellValue(cells[index.PAGE_VIEWS_RPM]);
  const impRpm=cellValue(cells[index.IMPRESSIONS_RPM]);
  sums.estimatedEarningsKrw+=cellValue(cells[index.ESTIMATED_EARNINGS])||0;
  sums.pageViews+=pv;
  sums.impressions+=imp;
  sums.individualAdImpressions+=cellValue(cells[index.INDIVIDUAL_AD_IMPRESSIONS])||0;
  sums.clicks+=cellValue(cells[index.CLICKS])||0;
  if(Number.isFinite(rpm)) weightedPageRpmNumerator+=rpm*pv;
  if(Number.isFinite(impRpm)) weightedImpressionRpmNumerator+=impRpm*imp;
}
const result={
  source:'Google AdSense Management API v2',
  account,
  siteDomain,
  window:{start:fmt(start),end:fmt(end),days},
  estimatedEarningsKrw:Number(sums.estimatedEarningsKrw.toFixed(2)),
  pageViews:Math.round(sums.pageViews),
  impressions:Math.round(sums.impressions),
  individualAdImpressions:Math.round(sums.individualAdImpressions),
  clicks:Math.round(sums.clicks),
  ctrPct:sums.impressions?Number((sums.clicks/sums.impressions*100).toFixed(4)):null,
  pageRpmKrw:sums.pageViews?Number((weightedPageRpmNumerator/sums.pageViews).toFixed(2)):null,
  impressionRpmKrw:sums.impressions?Number((weightedImpressionRpmNumerator/sums.impressions).toFixed(2)):null,
  observedAt:new Date().toISOString()
};
fs.mkdirSync(path.dirname(path.resolve(root,outPath)),{recursive:true});
fs.writeFileSync(path.resolve(root,outPath),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));

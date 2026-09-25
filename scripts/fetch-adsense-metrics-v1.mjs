import fs from 'node:fs';
import path from 'node:path';

const DOMAIN = process.env.ADSENSE_SITE_DOMAIN || 'aijoylab.kr';
const DAYS = Math.max(1, Math.min(30, Number(process.env.ADSENSE_REPORT_DAYS || 7)));
const OUT = process.env.ADSENSE_METRICS_OUT || 'qa-artifacts/adsense-monetization-gate-v1/adsense.json';

function kstDate(offsetDays = 0) {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() };
}
function iso(d){return `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`;}
function previousDate(dateObj, days){
  const d=new Date(Date.UTC(dateObj.year,dateObj.month-1,dateObj.day));
  d.setUTCDate(d.getUTCDate()-days);
  return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};
}
async function accessToken(){
  if(process.env.ADSENSE_ACCESS_TOKEN) return process.env.ADSENSE_ACCESS_TOKEN;
  const clientId=process.env.ADSENSE_OAUTH_CLIENT_ID;
  const clientSecret=process.env.ADSENSE_OAUTH_CLIENT_SECRET;
  const refreshToken=process.env.ADSENSE_OAUTH_REFRESH_TOKEN;
  if(!clientId||!clientSecret||!refreshToken){
    throw new Error('Set ADSENSE_ACCESS_TOKEN or ADSENSE_OAUTH_CLIENT_ID + ADSENSE_OAUTH_CLIENT_SECRET + ADSENSE_OAUTH_REFRESH_TOKEN.');
  }
  const body=new URLSearchParams({
    client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:'refresh_token'
  });
  const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  if(!res.ok) throw new Error(`Google OAuth token refresh failed ${res.status}: ${await res.text()}`);
  const json=await res.json();
  if(!json.access_token) throw new Error('Google OAuth response did not include access_token.');
  return json.access_token;
}
async function api(url, token){
  const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
  if(!res.ok) throw new Error(`AdSense API ${res.status}: ${await res.text()}`);
  return res.json();
}
async function accountResource(token){
  if(process.env.ADSENSE_ACCOUNT_RESOURCE) return process.env.ADSENSE_ACCOUNT_RESOURCE;
  const json=await api('https://adsense.googleapis.com/v2/accounts',token);
  const accounts=(json.accounts||[]).filter(a=>a.state!=='CLOSED');
  if(accounts.length!==1){
    throw new Error(`Expected one active AdSense account, found ${accounts.length}. Set ADSENSE_ACCOUNT_RESOURCE explicitly (accounts/...).`);
  }
  return accounts[0].name;
}
function cellMap(result){
  const headers=result.headers||[];
  const row=result.rows?.[0];
  if(!row) return {};
  const out={};
  headers.forEach((h,i)=>{out[h.name]=row.cells?.[i]?.value ?? null;});
  return out;
}

const token=await accessToken();
const account=await accountResource(token);
const end=kstDate(-1);
const start=previousDate(end,DAYS-1);
const params=new URLSearchParams();
for(const metric of ['PAGE_VIEWS','IMPRESSIONS','ESTIMATED_EARNINGS','PAGE_VIEWS_RPM','ACTIVE_VIEW_VIEWABILITY','AD_REQUESTS_COVERAGE','PAGE_VIEWS_CTR']){
  params.append('metrics',metric);
}
params.append('filters',`OWNED_SITE_DOMAIN_NAME==${DOMAIN}`);
params.set('currencyCode','KRW');
params.set('startDate.year',String(start.year));
params.set('startDate.month',String(start.month));
params.set('startDate.day',String(start.day));
params.set('endDate.year',String(end.year));
params.set('endDate.month',String(end.month));
params.set('endDate.day',String(end.day));

const url=`https://adsense.googleapis.com/v2/${account}/reports:generate?${params.toString()}`;
const result=await api(url,token);
const m=cellMap(result);
const num=(key)=>m[key]==null?null:Number(m[key]);
const payload={
  source:'adsense-management-api-v2',
  site:DOMAIN,
  accountResource:account,
  period:{days:DAYS,startDate:iso(start),endDate:iso(end)},
  metrics:{
    pageViews:num('PAGE_VIEWS'),
    adImpressions:num('IMPRESSIONS'),
    estimatedEarningsKrw:num('ESTIMATED_EARNINGS'),
    pageRpmKrw:num('PAGE_VIEWS_RPM'),
    viewabilityPct:num('ACTIVE_VIEW_VIEWABILITY')==null?null:num('ACTIVE_VIEW_VIEWABILITY')*100,
    fillRatePct:num('AD_REQUESTS_COVERAGE')==null?null:num('AD_REQUESTS_COVERAGE')*100,
    ctrPct:num('PAGE_VIEWS_CTR')==null?null:num('PAGE_VIEWS_CTR')*100
  }
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify(payload,null,2));

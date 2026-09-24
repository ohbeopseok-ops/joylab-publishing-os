import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const outputPath = path.join(root, "data/gsc/latest.json");
const historyDir = path.join(root, "data/gsc/history");
const siteUrl = process.env.GSC_SITE_URL || "sc-domain:aijoylab.kr";
const rawCredentials = process.env.GSC_SERVICE_ACCOUNT_JSON;

if (!rawCredentials) throw new Error("GSC_SERVICE_ACCOUNT_JSON is not configured.");

let credentials;
try { credentials = JSON.parse(rawCredentials); }
catch { throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON."); }

if (!credentials.client_email || !credentials.private_key) {
  throw new Error("Service account JSON requires client_email and private_key.");
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const claims = b64url(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const unsigned = header + "." + claims;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), credentials.private_key).toString("base64url");
  const assertion = unsigned + "." + signature;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({
      grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error("Google OAuth token exchange failed: " + JSON.stringify(data));
  }
  return data.access_token;
}

function isoDate(date) {
  return date.toISOString().slice(0,10);
}

function normalizeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const u = new URL(raw);
  const host = u.hostname.toLowerCase().replace(/^www\./,"");
  let pathname = u.pathname.replace(/\/{2,}/g,"/");
  if (pathname.length > 1) pathname = pathname.replace(/\/$/,"");
  return `https://${host}${pathname}`;
}

function percentile(values, value) {
  const sorted = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!sorted.length) return 0;
  if (sorted.length === 1) return value > 0 ? 1 : 0;
  let count = 0;
  for (const x of sorted) if (x <= value) count++;
  return (count - 1) / (sorted.length - 1);
}

const end = new Date();
end.setUTCDate(end.getUTCDate() - 3);
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - 27);
const startDate = process.env.GSC_START_DATE || isoDate(start);
const endDate = process.env.GSC_END_DATE || isoDate(end);

const token = await accessToken();
const endpoint = "https://searchconsole.googleapis.com/webmasters/v3/sites/" + encodeURIComponent(siteUrl) + "/searchAnalytics/query";

const response = await fetch(endpoint, {
  method:"POST",
  headers:{
    authorization:"Bearer " + token,
    "content-type":"application/json"
  },
  body:JSON.stringify({
    startDate,
    endDate,
    dimensions:["page"],
    type:"web",
    dataState:"final",
    rowLimit:25000,
    startRow:0
  })
});

const payload = await response.json();
if (!response.ok) throw new Error("Search Console API failed: " + JSON.stringify(payload));

const rows = payload.rows ?? [];
if (!rows.length) throw new Error("Search Console API returned zero page rows.");

const rawPages = rows.map(row => ({
  url: normalizeUrl(row.keys?.[0]),
  clicks: Number(row.clicks ?? 0),
  impressions: Number(row.impressions ?? 0),
  ctr: Number(row.ctr ?? 0),
  position: Number(row.position ?? 0)
})).filter(x=>x.url);

const clickValues = rawPages.map(x=>x.clicks);
const impressionValues = rawPages.map(x=>x.impressions);
const pages = rawPages.map(x => ({
  ...x,
  trafficScore: Math.round((percentile(clickValues,x.clicks)*6 + percentile(impressionValues,x.impressions)*4)*10)/10
})).sort((a,b)=>b.trafficScore-a.trafficScore || b.clicks-a.clicks || b.impressions-a.impressions);

const sourceHash = crypto.createHash("sha256")
  .update(JSON.stringify({siteUrl,startDate,endDate,pages:rawPages}))
  .digest("hex");

const snapshot = {
  contract:"JoyLab GSC Direct API V1",
  importedAt:new Date().toISOString(),
  source:"GOOGLE_SEARCH_CONSOLE_API",
  siteUrl,
  sourceHash,
  sourceFiles:[],
  rejectedFiles:[],
  range:{startDate,endDate,status:"FINAL_MINUS_3D"},
  scoring:{
    version:"traffic-v1",
    formula:"click percentile × 6 + impression percentile × 4",
    maxScore:10
  },
  totals:{
    pages:pages.length,
    clicks:pages.reduce((a,x)=>a+x.clicks,0),
    impressions:pages.reduce((a,x)=>a+x.impressions,0)
  },
  pages
};

fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.mkdirSync(historyDir,{recursive:true});

let changed=true;
if(fs.existsSync(outputPath)){
  try{
    const previous=JSON.parse(fs.readFileSync(outputPath,"utf8"));
    if(previous.sourceHash===sourceHash) changed=false;
  }catch{}
}

if(changed){
  fs.writeFileSync(outputPath,JSON.stringify(snapshot,null,2)+"\n");
  const stamp=snapshot.importedAt.replace(/[:.]/g,"-");
  fs.writeFileSync(path.join(historyDir,`${stamp}-api-${sourceHash.slice(0,10)}.json`),JSON.stringify(snapshot,null,2)+"\n");
}

console.log(JSON.stringify({
  changed,
  siteUrl,
  range:snapshot.range,
  totals:snapshot.totals,
  topPages:pages.slice(0,10).map(x=>({url:x.url,clicks:x.clicks,impressions:x.impressions,trafficScore:x.trafficScore}))
},null,2));

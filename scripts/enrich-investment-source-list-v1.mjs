import fs from "node:fs";
import path from "node:path";
import { upsertFrontmatter } from "./lib/frontmatter-upsert-v1.mjs";

const root=process.cwd();
const articleDir=path.join(root,"src/data/articles");
const gate=JSON.parse(fs.readFileSync(path.join(root,"config/investment-primary-source-gate-v1.json"),"utf8"));
const priority=JSON.parse(fs.readFileSync(path.join(root,"config/adsense-trust-rollout-priority-v1.json"),"utf8"));
const apply=process.argv.includes("--apply");
const onlyTop20=!process.argv.includes("--all");
const targets=onlyTop20 ? new Set(priority.top20) : null;

function frontmatter(text){
  const raw=text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]||"";
  const get=k=>raw.match(new RegExp("^"+k+":\\s*(.+)$","m"))?.[1]?.trim().replace(/^['"]|['"]$/g,"")||"";
  return {raw,get};
}
function accepted(url){
  try{
    const host=new URL(url).hostname.toLowerCase().replace(/^www\./,"");
    return gate.acceptedHosts.some(x=>host===x||host.endsWith("."+x))||gate.acceptedHostSuffixes.some(s=>host.endsWith(s));
  }catch{return false;}
}
function labelFor(url){
  try{
    const host=new URL(url).hostname.replace(/^www\./,"");
    const map={
      "dart.fss.or.kr":"금융감독원 DART",
      "data.krx.co.kr":"한국거래소",
      "krx.co.kr":"한국거래소",
      "kind.krx.co.kr":"KIND",
      "federalreserve.gov":"Federal Reserve",
      "treasury.gov":"U.S. Treasury",
      "sec.gov":"U.S. SEC",
      "samsung.com":"Samsung",
      "skhynix.com":"SK hynix",
      "news.skhynix.com":"SK hynix Newsroom",
      "kbfg.com":"KB Financial Group",
      "doosanenerbility.com":"Doosan Enerbility",
      "hd-hyundaielectric.com":"HD Hyundai Electric",
      "hyosungheavyindustries.com":"Hyosung Heavy Industries",
      "hd-hhi.com":"HD Hyundai Heavy Industries",
      "hdksoe.co.kr":"HD Korea Shipbuilding & Offshore Engineering",
      "samsungshi.com":"Samsung Heavy Industries"
    };
    return map[host]||host;
  }catch{return "Primary source";}
}

const report=[];
for(const name of fs.readdirSync(articleDir).filter(x=>x.endsWith(".md")).sort()){
  const slug=name.replace(/\.md$/,"");
  if(targets && !targets.has(slug)) continue;
  const file=path.join(articleDir,name);
  const text=fs.readFileSync(file,"utf8");
  const fm=frontmatter(text);
  if(fm.get("category")!=="투자·경제") continue;
  if(/^sourceList:/m.test(fm.raw)){
    report.push({slug,status:"SKIP_EXISTING_SOURCE_LIST"});
    continue;
  }
  const urls=[...new Set([...text.matchAll(/https?:\/\/[^\s)>"']+/g)].map(m=>m[0].replace(/[.,;:]$/,"")).filter(accepted))];
  const selected=urls.slice(0,8);
  if(selected.length<gate.minimumPrimaryLinks){
    report.push({slug,status:"BLOCKED_NOT_ENOUGH_PRIMARY_SOURCES",found:selected.length,required:gate.minimumPrimaryLinks,urls:selected});
    continue;
  }
  const sourceList=selected.map(url=>({label:labelFor(url),url}));
  if(apply){
    const next=upsertFrontmatter(text,{sourceList});
    fs.writeFileSync(file,next);
    report.push({slug,status:"UPDATED",count:sourceList.length,sourceList});
  }else{
    report.push({slug,status:"DRY_RUN_READY",count:sourceList.length,sourceList});
  }
}

const outDir=path.join(root,"qa-artifacts","source-list-enrichment-v1");
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,"report.json"),JSON.stringify({mode:apply?"apply":"dry-run",scope:onlyTop20?"top20":"all",report},null,2)+"\n");
console.log(JSON.stringify({mode:apply?"apply":"dry-run",scope:onlyTop20?"top20":"all",report},null,2));
if(report.some(x=>x.status==="BLOCKED_NOT_ENOUGH_PRIMARY_SOURCES")) process.exitCode=2;

import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/data/articles");
const cfg = JSON.parse(fs.readFileSync("config/research-quality-gate-v2.json","utf8"));
const files = fs.readdirSync(root).filter(f=>f.endsWith(".md")).sort();

const hasAny=(s,arr)=>arr.some(x=>s.toLowerCase().includes(x.toLowerCase()));
const urlCount=s=>(s.match(/https?:\/\/[^\s)\]>"']+/g)||[]).length;
const hasHeading=(s,words)=>new RegExp(`^#{1,3}\\s+.*(${words.join("|")}).*$`,"im").test(s);

const results=[];
for(const file of files){
  const full=path.join(root,file);
  const s=fs.readFileSync(full,"utf8");
  const reasons=[];
  const urls=urlCount(s);
  const explicitSources=hasAny(s,cfg.sourceSectionPatterns);
  const nonInvest=cfg.nonInvestmentSlugHints.some(x=>file.includes(x));
  const investment=cfg.investmentSlugHints.some(x=>file.includes(x));
  const templateMarkers=cfg.templateErrorPatterns.filter(p=>s.toLowerCase().includes(p.toLowerCase()));
  const genericHits=cfg.genericPatterns.filter(p=>s.toLowerCase().includes(p.toLowerCase()));
  const templateError=nonInvest && templateMarkers.length>0;
  const sourceWeak=urls===0 || (!explicitSources && urls<2);
  const hasLimit=hasHeading(s,["한계","limit","counter","반대","리스크","failure"]);
  const hasAction=hasHeading(s,["action","watch","체크","실행","적용","다음"]);
  const hasRecheck=/재점검|recheck|다시 확인|업데이트 조건|review trigger/i.test(s);
  const hasQuestion=/research question|핵심 질문|질문[:：]|무엇을.*\?/i.test(s);

  let status="PASS";
  if(templateError){status="TEMPLATE ERROR";reasons.push(`wrong-template markers: ${templateMarkers.join(", ")}`);}
  else if(sourceWeak){status="SOURCE WEAK";reasons.push(`source links=${urls}, explicit source section=${explicitSources}`);}
  else if(genericHits.length>=1 || !hasLimit || !hasAction || !hasRecheck || !hasQuestion){
    status="REVISION";
    if(genericHits.length) reasons.push(`generic boilerplate: ${genericHits.join(", ")}`);
    if(!hasQuestion) reasons.push("no explicit research question");
    if(!hasLimit) reasons.push("no explicit limit/counter-evidence section");
    if(!hasAction) reasons.push("no explicit action/watch section");
    if(!hasRecheck) reasons.push("no recheck trigger");
  }

  results.push({file,status,urls,explicitSources,investment,nonInvest,reasons});
}

const counts=Object.fromEntries(["PASS","REVISION","TEMPLATE ERROR","SOURCE WEAK"].map(k=>[k,results.filter(x=>x.status===k).length]));
const lines=[
  "# JoyLab Research V2 Corpus Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Articles: ${results.length}`,
  "",
  "## Summary",
  "",
  ...Object.entries(counts).map(([k,v])=>`- **${k}**: ${v}`),
  "",
  "## Articles",
  "",
  "| Article | Status | Sources | Reasons |",
  "|---|---|---:|---|",
  ...results.map(r=>`| ${r.file} | ${r.status} | ${r.urls} | ${r.reasons.join("; ").replaceAll("|","/")} |`)
];
fs.mkdirSync("artifacts",{recursive:true});
fs.writeFileSync("artifacts/research-v2-audit.md",lines.join("\n"));
fs.writeFileSync("artifacts/research-v2-audit.json",JSON.stringify({version:"2.0",counts,results},null,2));
console.log(JSON.stringify({counts,total:results.length},null,2));

if(results.some(r=>r.status==="TEMPLATE ERROR")){
  console.error("Research V2 gate failed: TEMPLATE ERROR detected.");
  process.exitCode=1;
}

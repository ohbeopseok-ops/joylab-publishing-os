import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/data/articles");
const cfg = JSON.parse(fs.readFileSync("config/research-quality-gate-v2.json","utf8"));
const files = fs.readdirSync(root).filter(f=>f.endsWith(".md")).sort();
const auditMode = process.env.AUDIT_MODE || "gate";
const changedSet = new Set((process.env.CHANGED_ARTICLES || "")
  .split(/[\n,]+/)
  .map(x=>x.trim().replace(/^src\/data\/articles\//,""))
  .filter(Boolean));

const hasAny=(s,arr)=>arr.some(x=>s.toLowerCase().includes(x.toLowerCase()));
const urlCount=s=>(s.match(/https?:\/\/[^\s)\]>"']+/g)||[]).length;
const hasHeading=(s,words)=>new RegExp(`^#{1,3}\\s+.*(${words.join("|")}).*$`,"im").test(s);

function frontmatter(text){
  if(!text.startsWith("---")) return {};
  const end=text.indexOf("\n---",3);
  if(end<0) return {};
  const block=text.slice(3,end);
  const out={};
  for(const line of block.split("\n")){
    const m=line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.+?)\s*$/);
    if(m) out[m[1]]=m[2].replace(/^["']|["']$/g,"");
  }
  return out;
}

function evidenceMap(text){
  if(!text.startsWith("---")) return [];
  const end=text.indexOf("\n---",3);
  if(end<0) return [];
  const block=text.slice(3,end);
  const start=block.search(/^evidenceMap:\s*$/m);
  if(start<0) return [];
  const tail=block.slice(start).split("\n").slice(1);
  const lines=[];
  for(const line of tail){
    if(/^\S/.test(line) && line.trim()) break;
    lines.push(line);
  }
  const joined=lines.join("\n");
  const chunks=joined.split(/\n\s*-\s+claim:\s*/).slice(1);
  return chunks.map(chunk=>{
    const claim=(chunk.split("\n")[0]||"").trim().replace(/^["']|["']$/g,"");
    const source=(chunk.match(/^\\s+source:\\s*["']?(https?:\\/\\/[^"'\\s]+)/m)||[])[1]||"";
    const sourceType=((chunk.match(/^\s+sourceType:\s*([A-Za-z_-]+)/m)||[])[1]||"").toLowerCase();
    const checkedAt=((chunk.match(/^\\s+checkedAt:\\s*([^\\n]+)/m)||[])[1]||"").trim().replace(/^["']|["']$/g,"");
    return {claim,source,sourceType,checkedAt};
  }).filter(x=>x.claim||x.source);
}

function inferType(file, meta){
  const explicit=(meta.researchType || meta.articleType || "").toLowerCase();
  if(["research","framework","guide","benchmark"].includes(explicit)) return explicit;
  const hay=`${file} ${meta.category||""} ${meta.title||""}`.toLowerCase();
  if(/benchmark|field.?test|실측|비교.?실험/.test(hay) || /aside-ai-browser-benchmark|aside-vs-/.test(file)) return "benchmark";
  if(/codex|guide|plugin|skill|computer-use|goal-mode|automation-10/.test(hay)) return "guide";
  if(/leadership|performance|fairness|feedback|recognition|learning|리더십|성과|공정|피드백|학습/.test(hay)) return "framework";
  return "research";
}

const results=[];
for(const file of files){
  const full=path.join(root,file);
  const s=fs.readFileSync(full,"utf8");
  const meta=frontmatter(s);
  const mapped=evidenceMap(s);
  const type=inferType(file,meta);
  const changed=changedSet.has(file);
  const reasons=[];
  const hardFailures=[];
  const urls=urlCount(s);
  const explicitSources=hasAny(s,cfg.sourceSectionPatterns);
  const templateMarkers=cfg.investmentOnlyPatterns.filter(p=>s.toLowerCase().includes(p.toLowerCase()));
  const genericHits=cfg.genericPatterns.filter(p=>s.toLowerCase().includes(p.toLowerCase()));
  const crossPillar=(cfg.crossPillarPatterns[type]||[]).filter(p=>s.toLowerCase().includes(p.toLowerCase()));
  const templateError=(type!=="research" && templateMarkers.length>0) || crossPillar.length>0;
  const sourceWeak=urls===0 || (!explicitSources && urls<2);
  const hasLimit=hasHeading(s,["한계","limit","counter","반대","리스크","failure"]);
  const hasAction=hasHeading(s,["action","watch","체크","실행","적용","다음"]);
  const hasRecheck=/재점검|recheck|다시 확인|업데이트 조건|review trigger/i.test(s);
  const hasQuestion=/research question|핵심 질문|질문[:：]|무엇을.*\?/i.test(s);
  const hasExplicitType=Boolean(meta.researchType || meta.articleType);

  const minClaims=cfg.claimSource.minMappedClaims[type] ?? 2;
  const minPrimary=cfg.claimSource.minPrimarySources[type] ?? 0;
  const validMapped=mapped.filter(x=>x.claim && /^https?:\/\//.test(x.source));
  const primaryCount=validMapped.filter(x=>x.sourceType==="primary").length;
  const staleMap=validMapped.filter(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.checkedAt));

  let status="PASS";
  if(templateError){
    status="TEMPLATE ERROR";
    if(templateMarkers.length) reasons.push(`wrong-template markers for ${type}: ${templateMarkers.join(", ")}`);
    if(crossPillar.length) reasons.push(`cross-pillar CTA/section: ${crossPillar.join(", ")}`);
  } else if(sourceWeak){
    status="SOURCE WEAK";
    reasons.push(`source links=${urls}, explicit source section=${explicitSources}`);
  } else if(genericHits.length>=1 || !hasLimit || !hasAction || !hasRecheck || !hasQuestion){
    status="REVISION";
    if(genericHits.length) reasons.push(`generic boilerplate: ${genericHits.join(", ")}`);
    if(!hasQuestion) reasons.push("no explicit research question");
    if(!hasLimit) reasons.push("no explicit limit/counter-evidence section");
    if(!hasAction) reasons.push("no explicit action/watch section");
    if(!hasRecheck) reasons.push("no recheck trigger");
  }

  if(changed && auditMode==="gate"){
    if(!hasExplicitType) hardFailures.push("changed/new article must declare researchType: research|framework|guide|benchmark");
    if(sourceWeak) hardFailures.push("changed/new article violates source hard gate");
    if(templateError) hardFailures.push("changed/new article contains template contamination");
    if(validMapped.length<minClaims) hardFailures.push(`claim-source map requires at least ${minClaims} mapped claims for ${type}; found ${validMapped.length}`);
    if(primaryCount<minPrimary) hardFailures.push(`claim-source map requires at least ${minPrimary} primary source(s) for ${type}; found ${primaryCount}`);
    if(staleMap.length>0) hardFailures.push(`claim-source map has ${staleMap.length} item(s) without checkedAt YYYY-MM-DD`);
  }

  results.push({file,type,changed,status,urls,explicitSources,hasExplicitType,mappedClaims:validMapped.length,primarySources:primaryCount,reasons,hardFailures});
}

const statuses=["PASS","REVISION","TEMPLATE ERROR","SOURCE WEAK"];
const counts=Object.fromEntries(statuses.map(k=>[k,results.filter(x=>x.status===k).length]));
const hardFailCount=results.reduce((n,r)=>n+r.hardFailures.length,0);
const lines=[
  "# JoyLab Research V2.2 Corpus Audit","",
  `Generated: ${new Date().toISOString()}`,
  `Mode: ${auditMode}`,
  `Articles: ${results.length}`,
  `Changed articles in gate scope: ${results.filter(x=>x.changed).length}`,
  `Hard failures: ${hardFailCount}`,"",
  "## Summary","",
  ...Object.entries(counts).map(([k,v])=>`- **${k}**: ${v}`),"",
  "## Articles","",
  "| Article | Type | Changed | Status | URLs | Claim Map | Primary | Reasons / Hard failures |",
  "|---|---|---:|---|---:|---:|---:|---|",
  ...results.map(r=>`| ${r.file} | ${r.type} | ${r.changed?"yes":"no"} | ${r.status} | ${r.urls} | ${r.mappedClaims} | ${r.primarySources} | ${[...r.reasons,...r.hardFailures].join("; ").replaceAll("|","/")} |`)
];
fs.mkdirSync("artifacts",{recursive:true});
fs.writeFileSync("artifacts/research-v2-audit.md",lines.join("\n"));
fs.writeFileSync("artifacts/research-v2-audit.json",JSON.stringify({version:"2.2",auditMode,counts,hardFailCount,results},null,2));
console.log(JSON.stringify({version:"2.2",auditMode,counts,hardFailCount,total:results.length},null,2));

if(auditMode==="gate" && hardFailCount>0){
  console.error(`Research V2.2 gate failed: ${hardFailCount} hard-gate violation(s) in changed/new articles.`);
  process.exitCode=1;
}

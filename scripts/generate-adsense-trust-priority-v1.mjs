import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const articleDir=path.join(root,"src/data/articles");
const first=JSON.parse(fs.readFileSync(path.join(root,"src/data/first-content-priority-v1.json"),"utf8"));
const prioritySet=new Set((first.top15||[]).map(x=>x.slug));
const strategic=new Set([
  "samsung-electronics-outlook",
  "sk-hynix-outlook",
  "us-economic-indicators-guide",
  "korea-financial-holdings-compare",
  "ai-power-value-chain-compare",
  "korea-ai-power-companies-compare",
  "korea-shipbuilding-companies-compare",
  "samsung-vs-sk-hynix-ai-memory"
]);

function fm(text){
  const raw=text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]||"";
  const get=k=>raw.match(new RegExp("^"+k+":\\s*(.+)$","m"))?.[1]?.trim().replace(/^['"]|['"]$/g,"")||"";
  return {raw,get};
}
function countUrls(text){ return new Set([...text.matchAll(/https?:\/\/[^\s)>"']+/g)].map(m=>m[0])).size; }

const rows=[];
for(const name of fs.readdirSync(articleDir).filter(x=>x.endsWith(".md"))){
  const slug=name.replace(/\.md$/,"");
  const text=fs.readFileSync(path.join(articleDir,name),"utf8");
  const m=fm(text);
  const category=m.get("category");
  const hasSource=/^sourceList:/m.test(m.raw);
  const hasTrust=["authorBio","researchMethod","riskFactors","counterScenarios"].every(k=>new RegExp("^"+k+":","m").test(m.raw));
  const urls=countUrls(text);
  let score=0;
  const reasons=[];
  if(prioritySet.has(slug)){ score+=40; reasons.push("First Content Priority TOP15"); }
  if(category==="투자·경제"){ score+=30; reasons.push("YMYL 투자·경제"); }
  if(strategic.has(slug)){ score+=25; reasons.push("Pillar/대표 리서치"); }
  if(!hasSource){ score+=15; reasons.push("sourceList 미보강"); }
  if(!hasTrust){ score+=10; reasons.push("article-specific Trust metadata 미완성"); }
  if(urls<2 && category==="투자·경제"){ score+=10; reasons.push("외부 원문 링크 2개 미만"); }
  rows.push({slug,score,category,reasons,hasSourceList:hasSource,hasArticleTrustMetadata:hasTrust,outboundUrls:urls});
}
rows.sort((a,b)=>b.score-a.score||a.slug.localeCompare(b.slug));
const out={version:"1.0",generatedAt:new Date().toISOString(),criteria:"YMYL + First Content Priority + Pillar/representative + Trust/source gaps",top20:rows.slice(0,20),allCount:rows.length};
fs.writeFileSync(path.join(root,"config/adsense-trust-rollout-priority-v1.json"),JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2));

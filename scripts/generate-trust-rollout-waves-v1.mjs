import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const articleDir=path.join(root,"src/data/articles");
const priority=JSON.parse(fs.readFileSync(path.join(root,"config/adsense-trust-rollout-priority-v1.json"),"utf8"));
const wave1=new Set(priority.top20||[]);
const rows={wave1:[],wave2:[],wave3:[]};

function meta(text){
  const raw=text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]||"";
  const get=k=>raw.match(new RegExp("^"+k+":\\s*(.+)$","m"))?.[1]?.trim().replace(/^['"]|['"]$/g,"")||"";
  return {get,draft:/^draft:\s*true\s*$/m.test(raw)};
}

for(const name of fs.readdirSync(articleDir).filter(x=>x.endsWith(".md")).sort()){
  const slug=name.replace(/\.md$/,"");
  const text=fs.readFileSync(path.join(articleDir,name),"utf8");
  const m=meta(text);
  if(m.draft) continue;
  const category=m.get("category");
  if(wave1.has(slug)) rows.wave1.push({slug,category});
  else if(category==="투자·경제") rows.wave2.push({slug,category});
  else rows.wave3.push({slug,category});
}

const out={
  version:"1.0",
  generatedAt:new Date().toISOString(),
  totals:{published:rows.wave1.length+rows.wave2.length+rows.wave3.length,wave1:rows.wave1.length,wave2:rows.wave2.length,wave3:rows.wave3.length},
  ...rows
};
const outDir=path.join(root,"qa-artifacts","trust-rollout-waves-v1");
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,"report.json"),JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2));

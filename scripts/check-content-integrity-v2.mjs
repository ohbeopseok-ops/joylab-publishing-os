import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const dir=path.join(root,"src/data/articles");
const outDir=path.join(root,"qa-artifacts/content-integrity-v2");
fs.mkdirSync(outDir,{recursive:true});

const required=["title","description","category","publishedAt"];
const trustKeys=["authorBio","researchMethod","sourceList","riskFactors","counterScenarios"];
const top=/^([A-Za-z0-9_-]+)\s*:/;
const dateRe=/^["']?(\d{4}-\d{2}-\d{2})["']?\s*$/;

function inspect(file){
  const source=fs.readFileSync(file,"utf8");
  const lines=source.split(/\r?\n/);
  const errors=[],warnings=[];
  if(lines[0]?.trim()!=="---") return {errors:[{type:"frontmatter-start"}],warnings};
  const endRel=lines.slice(1).findIndex(l=>l.trim()==="---");
  if(endRel<0) return {errors:[{type:"frontmatter-end"}],warnings};
  const end=endRel+1;
  const keys=new Map(),blocks=new Map();
  const starts=[];
  for(let i=1;i<end;i++){
    const line=lines[i];
    if(!line || /^\s/.test(line) || line.trimStart().startsWith("#")) continue;
    const m=line.match(top); if(!m) continue;
    const key=m[1];
    if(keys.has(key)) errors.push({type:"duplicate-key",key,firstLine:keys.get(key).line,line:i+1});
    else keys.set(key,{line:i+1,value:line.slice(line.indexOf(":")+1).trim()});
    starts.push({key,i});
  }
  starts.push({key:"__END__",i:end});
  for(let j=0;j<starts.length-1;j++) blocks.set(starts[j].key,lines.slice(starts[j].i,starts[j+1].i).join("\n"));

  for(const key of required) if(!keys.has(key)) errors.push({type:"required-key",key});

  for(const key of ["publishedAt","updatedAt"]){
    if(!keys.has(key)) continue;
    const raw=keys.get(key).value;
    const m=raw.match(dateRe);
    if(!m || Number.isNaN(Date.parse(m[1]+"T00:00:00Z"))) errors.push({type:"invalid-date",key,value:raw});
  }
  if(keys.has("publishedAt")&&keys.has("updatedAt")){
    const p=keys.get("publishedAt").value.match(dateRe)?.[1];
    const u=keys.get("updatedAt").value.match(dateRe)?.[1];
    if(p&&u&&u<p) warnings.push({type:"updated-before-published",publishedAt:p,updatedAt:u});
  }

  const trustPresent=trustKeys.filter(k=>keys.has(k));
  if(trustPresent.length){
    for(const key of trustKeys) if(!keys.has(key)) errors.push({type:"trust-required-key",key});
    const sourceBlock=blocks.get("sourceList")||"";
    const urls=[
      ...[...sourceBlock.matchAll(/\burl:\s*["']?([^"'\s,}\]]+)/g)].map(m=>m[1]),
      ...[...sourceBlock.matchAll(/"url"\s*:\s*"([^"]+)"/g)].map(m=>m[1])
    ];
    const unique=[...new Set(urls)];
    if(!unique.length) errors.push({type:"source-list-empty"});
    for(const url of unique){
      try{
        const u=new URL(url);
        if(!["http:","https:"].includes(u.protocol)) throw new Error();
      }catch{ errors.push({type:"invalid-source-url",url}); }
    }
  }

  const canonical=keys.get("canonical")?.value?.replace(/^["']|["']$/g,"");
  if(canonical){
    try{
      if(canonical.startsWith("http")){
        const u=new URL(canonical);
        if(!["http:","https:"].includes(u.protocol)) throw new Error();
      }else if(!canonical.startsWith("/")) throw new Error();
    }catch{ errors.push({type:"invalid-canonical",value:canonical}); }
  }

  const body=lines.slice(end+1).join("\n");
  if(!/^##\s+\S/m.test(body)) errors.push({type:"body-h2-missing"});

  return {errors,warnings};
}

const files=fs.readdirSync(dir).filter(n=>n.endsWith(".md")).sort();
const results=[],failures=[];
for(const name of files){
  const result=inspect(path.join(dir,name));
  const item={file:"src/data/articles/"+name,...result};
  results.push(item);
  if(result.errors.length) failures.push(item);
}
const report={version:"2.0",generatedAt:new Date().toISOString(),articles:files.length,failedFiles:failures.length,results};
fs.writeFileSync(path.join(outDir,"report.json"),JSON.stringify(report,null,2));

console.log("Content Integrity Gate V2: scanned "+files.length+" articles.");
for(const f of failures){
  console.error("\n"+f.file);
  for(const e of f.errors) console.error("  - "+JSON.stringify(e));
}
if(failures.length){
  console.error("\nContent Integrity Gate V2 BLOCKED: "+failures.length+" file(s).");
  process.exit(1);
}
const warningCount=results.reduce((n,r)=>n+r.warnings.length,0);
console.log("Content Integrity Gate V2 PASS; warnings="+warningCount);

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config','investment-primary-source-gate-v1.json'),'utf8'));
const dir=path.join(root,'src','data','articles');

function fm(text,key){
  const m=text.match(/^---\n([\s\S]*?)\n---/);
  if(!m) return '';
  const hit=m[1].match(new RegExp('^'+key+':\\s*(.+)$','m'));
  return hit ? hit[1].trim().replace(/^['"]|['"]$/g,'') : '';
}
function published(text){
  const raw=fm(text,'publishedAt');
  const d=new Date(raw+'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : d;
}
function urls(text){
  return [...text.matchAll(/https?:\/\/[^)\s>"']+/g)].map(m=>m[0]);
}
function isAllowed(url){
  try{
    const h=new URL(url).hostname.toLowerCase();
    return cfg.allowedDomains.some(d=>h===d || h.endsWith('.'+d));
  }catch{return false;}
}

const cutoff=new Date(cfg.effectivePublishedAt+'T00:00:00Z');
const failures=[];
const checked=[];

function walkMarkdown(currentDir){
  return fs.readdirSync(currentDir,{withFileTypes:true}).flatMap((entry)=>{
    const full=path.join(currentDir,entry.name);
    if(entry.isDirectory()) return walkMarkdown(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

for(const full of walkMarkdown(dir).sort()){
  const file=path.relative(dir,full).replace(/\\/g,'/');
  const text=fs.readFileSync(full,'utf8');
  if(fm(text,'draft')==='true') continue;
  if(fm(text,'category')!==cfg.category) continue;
  const d=published(text);
  if(!d || d<cutoff) continue;
  const primary=[...new Set(urls(text).filter(isAllowed))];
  checked.push({file,publishedAt:d.toISOString().slice(0,10),count:primary.length,primary});
  if(primary.length<cfg.minPrimarySources){
    failures.push({file,publishedAt:d.toISOString().slice(0,10),count:primary.length,required:cfg.minPrimarySources});
  }
}

console.log(JSON.stringify({checked:checked.length,failures},null,2));
if(failures.length){
  console.error('Investment Primary Source Gate V1 FAILED');
  process.exit(1);
}
console.log('Investment Primary Source Gate V1 PASS');

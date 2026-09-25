import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config','investment-primary-source-gate-v1.json'),'utf8'));

function frontmatterValue(text,key){
  const fm=text.match(/^---\n([\s\S]*?)\n---/m)?.[1]||'';
  const m=fm.match(new RegExp('^'+key+':\\s*(.+)$','m'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g,'') : '';
}
function isDraft(text){
  const fm=text.match(/^---\n([\s\S]*?)\n---/m)?.[1]||'';
  return /^draft:\s*true\s*$/m.test(fm);
}
function isPrimary(url){
  try{
    const host=new URL(url).hostname.toLowerCase();
    if(cfg.acceptedHosts.some(x=>host===x||host.endsWith('.'+x))) return true;
    return cfg.acceptedHostSuffixes.some(s=>host.endsWith(s));
  }catch{return false;}
}
function addedArticles(base){
  try{
    const out=execFileSync('git',['diff','--diff-filter=A','--name-only',base,'HEAD','--','src/data/articles/*.md'],{encoding:'utf8'}).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  }catch{
    const out=execFileSync('git',['diff','--diff-filter=A','--name-only','HEAD^','HEAD','--','src/data/articles/*.md'],{encoding:'utf8'}).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  }
}

const base=(process.env.PRIMARY_SOURCE_BASE_SHA||'').trim()||'HEAD^';
const files=addedArticles(base);
const failures=[];
const checked=[];
for(const rel of files){
  const text=fs.readFileSync(path.join(root,rel),'utf8');
  const category=frontmatterValue(text,'category');
  if(category!==cfg.category||isDraft(text)) continue;
  const urls=[...text.matchAll(/https?:\/\/[^\s)>"']+/g)].map(m=>m[0]);
  const primary=[...new Set(urls.filter(isPrimary))];
  checked.push({file:rel,primaryLinks:primary});
  if(primary.length<cfg.minimumPrimaryLinks){
    failures.push({file:rel,found:primary.length,required:cfg.minimumPrimaryLinks,primaryLinks:primary});
  }
}
console.log(JSON.stringify({gate:cfg.name,base,checked,failures},null,2));
if(failures.length){
  console.error('Investment Primary Source Gate V1 BLOCKED: new investing articles require at least '+cfg.minimumPrimaryLinks+' accepted primary-source links.');
  process.exit(1);
}
console.log('Investment Primary Source Gate V1 PASS');

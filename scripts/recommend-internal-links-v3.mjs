import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/internal-link-recommender-v3.json'), 'utf8'));
const outDir = path.join(root, 'qa-artifacts/internal-link-recommender-v3');
fs.mkdirSync(outDir, { recursive: true });

const stop = new Set(['하는','이유','방법','분석','가이드','총정리','시대','무엇','어떻게','투자','보기','핵심','구조','연결','이란','인가','위한']);

function frontmatter(src){
  const m=src.match(/^---\n([\s\S]*?)\n---/); return m?.[1] ?? '';
}
function field(fm,key){
  const m=fm.match(new RegExp('^'+key+':\\s*["\\\']?([^"\\\'\\n]+)', 'm')); return m?.[1]?.trim() ?? '';
}
function arr(fm,key){
  const m=fm.match(new RegExp('^'+key+':\\s*\\[([^\\]]*)\\]','m')); if(!m) return [];
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x=>x[1]);
}
function body(src){
  const i=src.indexOf('\n---',3); return i<0?src:src.slice(i+4);
}
function links(src){
  return new Set([...src.matchAll(/\]\((\/articles\/[^)#?\s]+)[^)]*\)/g)].map(m=>m[1]));
}
function tokens(text){
  return [...new Set((text.toLowerCase().match(/[a-z0-9가-힣]+/g)||[]).filter(x=>x.length>1&&!stop.has(x)))];
}
function changedFiles(){
  if(process.argv.includes('--all')) return fs.readdirSync(articleDir).filter(x=>x.endsWith('.md')).map(x=>'src/data/articles/'+x);
  const base=process.env.RECOMMENDER_BASE_SHA;
  try{
    const range=base && !/^0+$/.test(base) ? `${base}...HEAD` : 'HEAD^...HEAD';
    const out=execSync(`git diff --name-only ${range} -- src/data/articles`,{encoding:'utf8'}).trim();
    return out?out.split(/\r?\n/).filter(x=>x.endsWith('.md')&&fs.existsSync(x)):[];
  }catch{return [];}
}

const articles = fs.readdirSync(articleDir).filter(x=>x.endsWith('.md')).map(name=>{
  const file=path.join(articleDir,name), src=fs.readFileSync(file,'utf8'), fm=frontmatter(src);
  return {
    id:name.replace(/\.md$/,''),
    route:'/articles/'+name.replace(/\.md$/,''),
    title:field(fm,'title'),
    category:field(fm,'category'),
    series:field(fm,'series'),
    tags:arr(fm,'tags'),
    draft:field(fm,'draft')==='true',
    src,
    existing:links(body(src)),
    titleTokens:tokens(field(fm,'title'))
  };
}).filter(x=>!x.draft);

function bestHub(a){
  const hay=new Set([...a.tags,...a.titleTokens]);
  const scored=cfg.hubProfiles.map(h=>({
    route:h.route,
    score:h.keywords.reduce((s,k)=>s+(hay.has(k)||a.title.includes(k)?10:0),0)
  })).sort((a,b)=>b.score-a.score);
  return scored[0]?.score>0?scored[0]:null;
}

function score(a,b,hubA){
  let s=0; const reasons=[];
  if(a.category && a.category===b.category){s+=cfg.weights.sameCategory;reasons.push('same category');}
  const shared=a.tags.filter(t=>b.tags.includes(t));
  if(shared.length){s+=shared.length*cfg.weights.sharedTag;reasons.push('shared tags: '+shared.join(', '));}
  if(a.series && a.series===b.series){s+=cfg.weights.sameSeries;reasons.push('same series');}
  const overlap=a.titleTokens.filter(t=>b.titleTokens.includes(t));
  if(overlap.length){s+=Math.min(15,overlap.length*cfg.weights.titleToken);reasons.push('title overlap: '+overlap.join(', '));}
  const hubB=bestHub(b);
  if(hubA&&hubB&&hubA.route===hubB.route){s+=cfg.weights.sameHub;reasons.push('same hub');}
  if(a.existing.has(b.route)){s+=cfg.weights.alreadyLinkedPenalty;reasons.push('already linked');}
  return {score:s,reasons};
}

const changed = changedFiles();
const recommendations=[];

for(const rel of changed){
  const id=path.basename(rel,'.md');
  const a=articles.find(x=>x.id===id); if(!a) continue;
  const hub=bestHub(a);
  const candidates=articles.filter(b=>b.id!==a.id).map(b=>({article:b,...score(a,b,hub)}))
    .filter(x=>x.score>=cfg.minimumScore)
    .sort((x,y)=>y.score-x.score || x.article.title.localeCompare(y.article.title,'ko'))
    .slice(0,cfg.topN);
  recommendations.push({
    id:a.id,
    title:a.title,
    route:a.route,
    hub:hub?.route ?? null,
    existingLinks:[...a.existing],
    related:candidates.map(x=>({id:x.article.id,route:x.article.route,title:x.article.title,score:x.score,reasons:x.reasons}))
  });
}

const report={version:3,generatedAt:new Date().toISOString(),changedCount:changed.length,recommendations};
fs.writeFileSync(path.join(outDir,'recommendations.json'),JSON.stringify(report,null,2)+'\n');

let md='# Internal Link Recommender V3\n\n';
if(!recommendations.length) md+='변경된 Article이 없습니다.\n';
for(const r of recommendations){
  md+=`## ${r.title}\n\n- Hub: ${r.hub ?? '추천 없음'}\n`;
  for(const [i,x] of r.related.entries()) md+=`- Related ${i+1}: [${x.title}](${x.route}) — score ${x.score} · ${x.reasons.join('; ')}\n`;
  md+='\n';
}
fs.writeFileSync(path.join(outDir,'recommendations.md'),md);
console.log(md);

if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);

import fs from 'node:fs';
import path from 'node:path';

const dist=path.join(process.cwd(),'dist');
const articlesDir=path.join(dist,'articles');
const outDir=path.join(process.cwd(),'qa-artifacts','search-growth-v1');
fs.mkdirSync(outDir,{recursive:true});

function walk(dir,acc=[]){
  if(!fs.existsSync(dir)) return acc;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p,acc); else acc.push(p);
  }
  return acc;
}
function text(html,tag){
  const m=html.match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i'));
  return (m?.[1]||'').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();
}
function meta(html,name){
  for(const tag of html.match(/<meta\\b[^>]*>/gi)||[]){
    if((tag.match(/name=["']([^"']+)["']/i)?.[1]||'').toLowerCase()===name.toLowerCase())
      return tag.match(/content=["']([^"']*)["']/i)?.[1]||'';
  }
  return '';
}

const pages=walk(articlesDir).filter(f=>path.basename(f)==='index.html');
const report=[]; const failures=[];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  const rel=path.relative(articlesDir,file).split(path.sep);
  if(rel.length!==2) continue;
  const slug=rel[0];
  const title=text(html,'title');
  const description=meta(html,'description');
  const internal=(html.match(/href=["']\/articles\//g)||[]).length;
  const checks={
    growthPath: html.includes('data-search-growth-path="v1"'),
    relatedLinks: internal>=2,
    booksLink: html.includes('href="/books"'),
    youtubeLink: html.includes('https://www.youtube.com/@JoyLabResearch'),
    contactLink: html.includes('/contact#contact-form'),
    canonicalPresent: /rel=["']canonical["']/.test(html),
    indexable: !meta(html,'robots').toLowerCase().includes('noindex')
  };
  const opportunities={
    titleLength:title.length,
    descriptionLength:description.length,
    titleLengthOk:title.length>=28&&title.length<=70,
    descriptionLengthOk:description.length>=70&&description.length<=180
  };
  const passed=Object.values(checks).every(Boolean);
  if(!passed) failures.push(slug);
  report.push({slug,checks,opportunities,internalArticleLinks:internal});
}
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),pages:report.length,report},null,2));
console.log('Search Growth Gate V1: articles='+report.length+', failures='+failures.length);
if(failures.length){
  console.error('FAILED: '+failures.join(', '));
  process.exit(1);
}
console.log('Search Growth Gate V1 PASS');

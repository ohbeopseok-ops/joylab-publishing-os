import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/topic-clusters-v2.json'), 'utf8'));
const articleDir = path.join(root, 'src/data/articles');
const bookDir = path.join(root, 'src/data/books');
const guideDir = path.join(root, 'src/pages/guides');

function read(file){ return fs.readFileSync(file, 'utf8'); }
function slug(file){ return path.basename(file).replace(/\.md$/,''); }
function fmValue(src, key){
  const m = src.match(new RegExp('^' + key.replace(/[.*+?^$()|[\\]\\]/g,'\\$&') + ':\\s*["\\\']?([^"\\\'\\n]+)', 'm'));
  return m ? m[1].trim() : '';
}
function yamlArray(src, key){
  const m = src.match(new RegExp('^' + key + ':\\s*\\[([^\\]]*)\\]', 'm'));
  if(!m) return [];
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x=>x[1]);
}
function mdLinks(src){
  return [...src.matchAll(/\]\((\/(?:articles|guides|books)\/[^)#?\s]+)[^)]*\)/g)].map(m=>m[1])
    .concat([...src.matchAll(/href=["'](\/(?:articles|guides|books)\/[^"'#?\s]+)[^"']*["']/g)].map(m=>m[1]));
}
function routeExists(route){
  if(route === '/articles' || route === '/books') return true;
  if(route.startsWith('/articles/')) return fs.existsSync(path.join(articleDir, route.slice(10)+'.md'));
  if(route.startsWith('/books/')) return fs.existsSync(path.join(bookDir, route.slice(7)+'.md'));
  if(route.startsWith('/guides/')){
    const rel=route.slice(8);
    return fs.existsSync(path.join(guideDir, rel+'.astro')) || fs.existsSync(path.join(guideDir, rel, 'index.astro'));
  }
  return true;
}
function changedFiles(){
  const base=process.env.TOPIC_CLUSTER_BASE_SHA;
  try{
    const range=base && !/^0+$/.test(base) ? `${base}...HEAD` : 'HEAD^...HEAD';
    return execSync(`git diff --name-only ${range}`, {encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  }catch{return [];}
}
function inboundCount(targetRoute){
  let count=0;
  for(const dir of [articleDir, guideDir]){
    if(!fs.existsSync(dir)) continue;
    const stack=[dir];
    while(stack.length){
      const d=stack.pop();
      for(const ent of fs.readdirSync(d,{withFileTypes:true})){
        const p=path.join(d,ent.name);
        if(ent.isDirectory()) stack.push(p);
        else if(/\.(md|astro)$/.test(ent.name) && read(p).includes(targetRoute)) count++;
      }
    }
  }
  return count;
}

const changed=changedFiles();
const errors=[];
const warnings=[];

for(const rel of changed.filter(x=>x.startsWith('src/data/articles/') && x.endsWith('.md') && fs.existsSync(x))){
  const src=read(rel);
  const category=fmValue(src,'category');
  const links=[...new Set(mdLinks(src))];

  for(const route of links) if(!routeExists(route)) errors.push(`${rel}: broken internal route ${route}`);

  const cluster=cfg.articleClusters.find(c=>c.categories.includes(category));
  if(!cluster) continue;

  const hubHit=cluster.hubAny.some(h=>links.includes(h));
  if(!hubHit) errors.push(`${rel}: ${cluster.id} article must link to at least one cluster hub: ${cluster.hubAny.join(', ')}`);

  const related=links.filter(x=>x.startsWith('/articles/') && x !== '/articles/'+slug(rel));
  if(related.length < cluster.minRelatedArticles) errors.push(`${rel}: needs at least ${cluster.minRelatedArticles} related article links (found ${related.length})`);

  const inbound=inboundCount('/articles/'+slug(rel));
  if(inbound === 0) warnings.push(`${rel}: no inbound internal link found yet; add a hub or sibling backlink`);
}

for(const rel of changed.filter(x=>x.startsWith('src/data/books/') && x.endsWith('.md') && fs.existsSync(x))){
  const src=read(rel);
  const related=yamlArray(src,'relatedArticleIds');
  if(related.length < cfg.books.minRelatedArticleIds){
    errors.push(`${rel}: book needs at least ${cfg.books.minRelatedArticleIds} relatedArticleIds entry`);
  }
  for(const id of related){
    if(!fs.existsSync(path.join(articleDir,id+'.md'))) errors.push(`${rel}: relatedArticleIds references missing article ${id}`);
  }
}

for(const w of warnings) console.warn('Topic Cluster CI V2 warning: '+w);
if(errors.length){
  console.error('Topic Cluster CI V2 failed:\n- '+errors.join('\n- '));
  process.exit(1);
}
console.log(`Topic Cluster CI V2 passed. Checked ${changed.length} changed path(s), ${warnings.length} warning(s).`);

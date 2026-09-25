import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const pillarRoute = '/guides/ai-inference-memory';
const pillarFile = path.join(root, 'src/pages/guides/ai-inference-memory.astro');
const articleDir = path.join(root, 'src/data/articles');
const guideDir = path.join(root, 'src/pages/guides');

const semiconductorTags = new Set(['HBM','HBM4','DRAM','NAND','CXMT','YMTC','삼성전자','SK하이닉스','반도체','AI메모리','EnterpriseSSD']);

function read(file){ return fs.readFileSync(file,'utf8'); }
function slugFromArticle(file){ return path.basename(file).replace(/\.md$/,''); }
function tagsFromFrontmatter(src){
  const m = src.match(/^---\s*[\s\S]*?\btags:\s*\[([^\]]*)\][\s\S]*?---/);
  if(!m) return [];
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x=>x[1]);
}
function links(src){
  return [...src.matchAll(/\]\((\/(?:articles|guides)\/[^)#?\s]+)[^)]*\)/g)].map(m=>m[1])
    .concat([...src.matchAll(/href=["'](\/(?:articles|guides)\/[^"'#?\s]+)[^"']*["']/g)].map(m=>m[1]));
}
function routeExists(route){
  if(route.startsWith('/articles/')) return fs.existsSync(path.join(articleDir, route.slice('/articles/'.length)+'.md'));
  if(route.startsWith('/guides/')){
    const rel = route.slice('/guides/'.length);
    return fs.existsSync(path.join(guideDir, rel+'.astro')) || fs.existsSync(path.join(guideDir, rel, 'index.astro'));
  }
  return true;
}
function changedFiles(){
  const base = process.env.INTERNAL_LINK_BASE_SHA;
  try {
    const range = base && !/^0+$/.test(base) ? `${base}...HEAD` : 'HEAD^...HEAD';
    return execSync(`git diff --name-only ${range}`, {encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

const changed = changedFiles();
const changedArticles = changed.filter(f=>f.startsWith('src/data/articles/') && f.endsWith('.md') && fs.existsSync(f));
const errors = [];

for(const rel of changedArticles){
  const src = read(rel);
  const tags = tagsFromFrontmatter(src);
  const isSemi = tags.some(t=>semiconductorTags.has(t));
  const internal = [...new Set(links(src))];

  for(const route of internal){
    if(!routeExists(route)) errors.push(`${rel}: broken internal route ${route}`);
  }

  if(!isSemi) continue;
  if(!src.includes(pillarRoute)) errors.push(`${rel}: semiconductor article must link to ${pillarRoute}`);
  const articleLinks = internal.filter(x=>x.startsWith('/articles/') && x !== '/articles/'+slugFromArticle(rel));
  if(articleLinks.length < 2) errors.push(`${rel}: semiconductor article needs at least 2 related article links (found ${articleLinks.length})`);

  if(!fs.existsSync(pillarFile)) errors.push(`missing pillar file: ${pillarFile}`);
  else {
    const pillar = read(pillarFile);
    const route = '/articles/'+slugFromArticle(rel);
    if(!pillar.includes(route)) errors.push(`pillar missing backlink to changed semiconductor article ${route}`);
  }
}

if(errors.length){
  console.error('Internal Link Gate V1 failed:\n- '+errors.join('\n- '));
  process.exit(1);
}
console.log(`Internal Link Gate V1 passed. Checked ${changedArticles.length} changed article(s).`);

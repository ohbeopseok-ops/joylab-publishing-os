import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const pillarRoute = '/guides/ai-inference-memory';
const pillarFile = path.join(root, 'src/pages/guides/ai-inference-memory.astro');
const articleDir = path.join(root, 'src/data/articles');
const guideDir = path.join(root, 'src/pages/guides');

const semiconductorTags = new Set(['HBM','HBM4','DRAM','NAND','CXMT','YMTC','삼성전자','SK하이닉스','반도체','AI메모리','EnterpriseSSD']);

const globalConnectivityPillarRoute = '/guides/how-internet-connects-the-world';
const globalConnectivityPillarFile = path.join(root, 'src/pages/guides/how-internet-connects-the-world.astro');
const globalConnectivityArticles = [
  'submarine-cable-history',
  'how-submarine-cables-work',
  'submarine-cable-failure-repair',
  'submarine-cables-ai-infrastructure',
  'satellite-vs-submarine-cable'
];

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
    const slug = slugFromArticle(rel);
    const hasBacklink = pillar.includes(route) || pillar.includes(`id: '${slug}'`) || pillar.includes(`id: "${slug}"`);
    if(!hasBacklink) errors.push(`pillar missing backlink registration for changed semiconductor article ${route}`);
  }
}


// Global Connectivity Cluster Gate
const touchesGlobalConnectivity = changed.some((rel) =>
  rel === 'src/pages/guides/how-internet-connects-the-world.astro' ||
  globalConnectivityArticles.some((slug) => rel === `src/data/articles/${slug}.md`)
);

if (touchesGlobalConnectivity) {
  if (!fs.existsSync(globalConnectivityPillarFile)) {
    errors.push(`missing global connectivity pillar file: ${globalConnectivityPillarFile}`);
  } else {
    const pillar = read(globalConnectivityPillarFile);

    globalConnectivityArticles.forEach((slug, index) => {
      const file = path.join(articleDir, `${slug}.md`);
      const route = `/articles/${slug}`;

      if (!fs.existsSync(file)) {
        errors.push(`global connectivity article missing: ${file}`);
        return;
      }

      const src = read(file);
      const internal = [...new Set(links(src))];

      if (!pillar.includes(route) && !pillar.includes(`'${slug}'`) && !pillar.includes(`"${slug}"`)) {
        errors.push(`global connectivity pillar missing registration for ${route}`);
      }

      if (!internal.includes(globalConnectivityPillarRoute)) {
        errors.push(`${file}: must link back to ${globalConnectivityPillarRoute}`);
      }

      const siblingLinks = internal.filter((link) =>
        globalConnectivityArticles.some((other) => link === `/articles/${other}`) && link !== route
      );
      if (siblingLinks.length < 1) {
        errors.push(`${file}: needs at least 1 sibling cluster link`);
      }

      const seriesMatch = src.match(/\bseries:\s*["']글로벌 인터넷 인프라["']/);
      const orderMatch = src.match(/\bseriesOrder:\s*(\d+)/);
      if (!seriesMatch) errors.push(`${file}: series must be "글로벌 인터넷 인프라"`);
      if (!orderMatch || Number(orderMatch[1]) !== index + 1) {
        errors.push(`${file}: seriesOrder must be ${index + 1}`);
      }
    });

    if (!pillar.includes('/guides/ai-infrastructure')) {
      errors.push('global connectivity pillar must link to /guides/ai-infrastructure');
    }
  }
}

if(errors.length){
  console.error('Internal Link Gate V1 failed:\n- '+errors.join('\n- '));
  process.exit(1);
}
console.log(`Internal Link Gate V1 passed. Checked ${changedArticles.length} changed article(s); global connectivity cluster ${touchesGlobalConnectivity ? 'validated' : 'not touched'}.`);

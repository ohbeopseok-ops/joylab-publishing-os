import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const graph=JSON.parse(fs.readFileSync(path.join(root,'config','research-graph-investing-v3.json'),'utf8'));
const expectedSeries=new Map([
  ['ETF 초보자 완전정복',10],
  ['매크로 초보자 완전정복',10],
  ['주식 분석 초보자 완전정복',10]
]);
const errors=[];
const ids=new Set();
for(const node of graph.nodes??[]){
  if(!node.id) errors.push('node missing id');
  if(ids.has(node.id)) errors.push('duplicate node '+node.id);
  ids.add(node.id);
}
for(const edge of graph.edges??[]){
  if(!ids.has(edge.source)) errors.push('orphan source '+edge.source);
  if(!ids.has(edge.target)) errors.push('orphan target '+edge.target);
}
if((graph.nodes??[]).length!==53) errors.push('expected 53 nodes');
if((graph.edges??[]).length!==121) errors.push('expected 121 edges');

const articleDir=path.join(root,'src','data','articles');
const files=fs.readdirSync(articleDir).filter(f=>f.endsWith('.md'));
const seriesCounts=new Map([...expectedSeries.keys()].map(k=>[k,0]));
const slugs=new Set();
for(const file of files){
  const text=fs.readFileSync(path.join(articleDir,file),'utf8');
  const fm=text.match(/^---\n([\s\S]*?)\n---/)?.[1]??'';
  const series=fm.match(/^series:\s*["']?(.+?)["']?\s*$/m)?.[1]?.replace(/^["']|["']$/g,'');
  if(seriesCounts.has(series)) seriesCounts.set(series,(seriesCounts.get(series)??0)+1);
  const canonical=fm.match(/^canonical:\s*["']?(.+?)["']?\s*$/m)?.[1]?.replace(/^["']|["']$/g,'');
  if(canonical?.startsWith('https://aijoylab.kr/articles/')) slugs.add(canonical.replace('https://aijoylab.kr',''));
}
for(const [series,count] of expectedSeries){
  if(seriesCounts.get(series)!==count) errors.push(`${series}: expected ${count}, got ${seriesCounts.get(series)}`);
}
const migratedNodes=(graph.nodes??[]).filter(n=>
  typeof n.slug==='string' &&
  slugs.has(n.slug)
);
if(migratedNodes.length!==30) errors.push('expected 30 migrated article nodes, got '+migratedNodes.length);
const mappedSlugs=new Set(migratedNodes.map(n=>n.slug));
for(const slug of slugs){
  if(!mappedSlugs.has(slug)) errors.push('migrated article missing from graph: '+slug);
}
console.log(`Investing Knowledge V3: nodes=${graph.nodes.length} edges=${graph.edges.length} ETF=${seriesCounts.get('ETF 초보자 완전정복')} Macro=${seriesCounts.get('매크로 초보자 완전정복')} Stocks=${seriesCounts.get('주식 분석 초보자 완전정복')}`);
if(errors.length){
  for(const e of errors) console.error('ERROR:',e);
  process.exit(1);
}
console.log('INVESTING KNOWLEDGE V3: PASS');

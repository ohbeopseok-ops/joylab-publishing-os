import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const reportPath=process.env.FIRST_CONTENT_REPORT || path.join(root,'qa-artifacts','first-content-entry-budget-v1','report.json');
const outDir=process.env.FIRST_CONTENT_RANKING_OUT || path.join(root,'qa-artifacts','first-content-ranking-v1');
if(!fs.existsSync(reportPath)) throw new Error('First Content Entry report missing: '+reportPath);
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const target=Number(report?.budgets?.firstBodyH2TopPx || 3200);
const priorityPath=path.join(root,'src/data/first-content-priority-v1.json');
const priority=fs.existsSync(priorityPath)?JSON.parse(fs.readFileSync(priorityPath,'utf8')):{top5:[]};
const ranked=(report.results||[])
  .filter((r)=>Number.isFinite(Number(r.firstBodyH2Top)) && Number(r.firstBodyH2Top)>target)
  .map((r)=>({slug:r.slug,firstBodyH2TopPx:Number(r.firstBodyH2Top),excessPx:Number(r.firstBodyH2Top)-target,briefTopPx:Number(r.briefTop||0)}))
  .sort((a,b)=>b.firstBodyH2TopPx-a.firstBodyH2TopPx);
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'ranking.json'),JSON.stringify({
  generatedAt:new Date().toISOString(),
  targetPx:target,
  count:ranked.length,
  top5:ranked.slice(0,5),
  ranked
},null,2)+'\n');
const lines=[
  '# First Content Entry Ranking V1','',
  'Target: first body H2 ≤ '+target+'px','',
  '| Rank | Article | First H2 | Excess | Research Brief |',
  '| ---: | --- | ---: | ---: | ---: |',
  ...ranked.map((r,i)=>'| '+(i+1)+' | '+r.slug+' | '+r.firstBodyH2TopPx+'px | +'+r.excessPx+'px | '+r.briefTopPx+'px |')
];
fs.writeFileSync(path.join(outDir,'ranking.md'),lines.join('\n')+'\n');
const currentBySlug=new Map((report.results||[]).map((r)=>[r.slug,Number(r.firstBodyH2Top||0)]));
const priorityFailures=(priority.top5||[]).filter((item)=>(currentBySlug.get(item.slug)||Infinity)>target).map((item)=>({slug:item.slug,currentPx:currentBySlug.get(item.slug)||null,targetPx:target}));
fs.writeFileSync(path.join(outDir,'priority-check.json'),JSON.stringify({targetPx:target,priority:priority.top5||[],failures:priorityFailures},null,2)+'\n');
console.log('First Content Entry Ranking V1: '+ranked.length+' articles above '+target+'px. TOP5='+ranked.slice(0,5).map(r=>r.slug).join(','));
if(priorityFailures.length){console.error('Priority TOP5 layout target failed: '+priorityFailures.map(x=>x.slug+'='+x.currentPx).join(','));process.exit(1);}

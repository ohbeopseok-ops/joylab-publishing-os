import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const priorityPath=process.env.WAVE3_PRIORITY||path.join(root,'src/data/first-content-priority-v1.json');
const firstPath=process.env.WAVE3_FIRST||path.join(root,'qa-artifacts','first-content-entry-budget-v1','report.json');
const lighthouseDir=process.env.WAVE3_LIGHTHOUSE_DIR||path.join(root,'qa-artifacts','mobile-experience-contract-v1');
const rulesPath=process.env.WAVE3_RULES||path.join(root,'src/data/mobile-experience-contract-v1.json');
const outDir=process.env.WAVE3_OUT||path.join(root,'qa-artifacts','wave3-release-gate-v1');

const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const p of [priorityPath,firstPath,rulesPath]) if(!fs.existsSync(p)) throw new Error('Wave 3 Gate missing input: '+p);
const priority=read(priorityPath);
const first=read(firstPath);
const rules=read(rulesPath);
const wave3=(priority.wave3||[]).map((r)=>r.slug);
if(wave3.length!==5) throw new Error('Wave 3 Gate expects exactly 5 priority articles; got '+wave3.length);

const firstBySlug=new Map((first.results||[]).map((r)=>[r.slug,r]));
const viewports=(rules.viewports||[]).map((v)=>v.name);
const rows=[];
const failures=[];

for(const slug of wave3){
  const h2=firstBySlug.get(slug);
  const h2Px=Number(h2?.firstBodyH2Top??Infinity);
  const h2Pass=Number.isFinite(h2Px)&&h2Px<=Number(rules.firstContentEntry?.firstBodyH2TopPx||3200);
  const lighthouse=[];
  for(const vp of viewports){
    const file='lighthouse-wave3-'+slug+'-'+vp+'.json';
    const filePath=path.join(lighthouseDir,file);
    if(!fs.existsSync(filePath)){
      lighthouse.push({viewport:vp,file,missing:true,passed:false});
      failures.push(slug+' '+vp+': missing Lighthouse report');
      continue;
    }
    const report=read(filePath);
    const lcpMs=Math.round(report.audits?.['largest-contentful-paint']?.numericValue??0);
    const cls=Number((report.audits?.['cumulative-layout-shift']?.numericValue??0).toFixed(4));
    const lcpPass=lcpMs>0&&lcpMs<=Number(rules.budgets?.lcpMs||2500);
    const clsPass=cls<=Number(rules.budgets?.cls||0.1);
    const passed=lcpPass&&clsPass;
    lighthouse.push({viewport:vp,file,lcpMs,cls,lcpPass,clsPass,passed});
    if(!passed) failures.push(slug+' '+vp+': LCP='+lcpMs+'ms CLS='+cls);
  }
  if(!h2Pass) failures.push(slug+': First H2='+h2Px+'px > '+Number(rules.firstContentEntry?.firstBodyH2TopPx||3200)+'px');
  rows.push({slug,firstBodyH2TopPx:h2Px,h2Pass,lighthouse,passed:h2Pass&&lighthouse.length===viewports.length&&lighthouse.every((r)=>r.passed)});
}
const passed=failures.length===0;
const payload={generatedAt:new Date().toISOString(),gate:'Wave 3 Release Gate V1',targetFirstH2Px:Number(rules.firstContentEntry?.firstBodyH2TopPx||3200),lcpBudgetMs:Number(rules.budgets?.lcpMs||2500),clsBudget:Number(rules.budgets?.cls||0.1),articles:wave3.length,passed,failures,rows};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'gate.json'),JSON.stringify(payload,null,2)+'\n');
const lines=['# Wave 3 Release Gate V1','',
  'Result: **'+(passed?'PASS':'BLOCKED')+'**  ',
  'Contract: **First H2 ≤ '+payload.targetFirstH2Px+'px · LCP ≤ '+payload.lcpBudgetMs+'ms · CLS ≤ '+payload.clsBudget+'**','',
  '| Article | First H2 | H2 | Lighthouse |','| --- | ---: | --- | --- |',
  ...rows.map((r)=>`| ${r.slug} | ${Number.isFinite(r.firstBodyH2TopPx)?r.firstBodyH2TopPx:'missing'} | ${r.h2Pass?'PASS':'FAIL'} | ${r.lighthouse.map((x)=>x.viewport+':' + (x.passed?'PASS':'FAIL')).join(' · ')} |`)];
if(failures.length) lines.push('','## Failures','',...failures.map((f)=>'- '+f));
fs.writeFileSync(path.join(outDir,'gate.md'),lines.join('\n')+'\n');
console.log('Wave 3 Release Gate V1: '+(passed?'PASS':'BLOCKED')+' '+rows.filter((r)=>r.passed).length+'/'+rows.length);
if(!passed) process.exit(1);

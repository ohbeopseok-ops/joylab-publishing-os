import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const paths={
  visual:process.env.QC_VISUAL||path.join(root,'qa-artifacts','visual-asset-contract-v4','report.json'),
  first:process.env.QC_FIRST||path.join(root,'qa-artifacts','first-content-ranking-v1','ranking.json'),
  priority:process.env.QC_PRIORITY||path.join(root,'qa-artifacts','first-content-ranking-v1','priority-check.json'),
  rum:process.env.QC_RUM||path.join(root,'qa-artifacts','real-user-experience-gate-v1','rum.json'),
  lab:process.env.QC_LAB||path.join(root,'qa-artifacts','mobile-experience-contract-v1','lighthouse-summary.json'),
  debt:process.env.QC_DEBT||path.join(root,'qa-artifacts','experience-debt-ranking-v1','ranking.json'),
  business:process.env.QC_BUSINESS||path.join(root,'qa-artifacts','business-impact-debt-v1','ranking.json'),
  effort:process.env.QC_EFFORT||path.join(root,'qa-artifacts','business-impact-effort-v2','ranking.json')
};
const read=(p)=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;
const visual=read(paths.visual);
const first=read(paths.first);
const priority=read(paths.priority);
const rum=read(paths.rum);
const lab=read(paths.lab);
const debt=read(paths.debt);
const business=read(paths.business);\nconst effort=read(paths.effort);

const status={
  visual:visual?(visual.failures?.length?'FAIL':visual.warnings?.length?'WARN':'PASS'):'MISSING',
  first:priority?(priority.failures?.length?'FAIL':'PASS'):'MISSING',
  rum:rum?.decision||'MISSING',
  lab:lab?(lab.failures?.length?'FAIL':'PASS'):'MISSING',
  debt:debt?'PASS':'MISSING',
  business:business?'PASS':'MISSING',
  effort:effort?'PASS':'MISSING'
};
const requiredMissing=Object.entries(status).filter(([,value])=>value==='MISSING').map(([key])=>key);
const overall=Object.values(status).includes('FAIL')||requiredMissing.length?'FAIL':
  Object.values(status).includes('COLLECT')?'COLLECT':
  Object.values(status).includes('WARN')?'WARN':'PASS';

const payload={
  generatedAt:new Date().toISOString(),
  overall,
  status,
  requiredMissing,
  visual:visual?{articles:visual.pages,assets:visual.assets,hero:visual.byRole?.hero,supporting:visual.byRole?.supporting,og:visual.byRole?.og,warnings:visual.warnings?.length||0,failures:visual.failures?.length||0}:null,
  firstContent:first?{aboveTarget:first.count,targetPx:first.targetPx,top5:first.top5}:null,
  priority:priority?{targetPx:priority.targetPx,failures:priority.failures}:null,
  rum:rum?{decision:rum.decision,windowDays:rum.windowDays,minSamples:rum.minSamples,metrics:rum.metrics,exceeded:rum.exceeded,insufficient:rum.insufficient}:null,
  lab:lab?{failures:lab.failures,results:lab.results?.map((r)=>({file:r.file,lcpMs:r.lcpMs,cls:r.cls,performanceScore:r.performanceScore,passed:r.passed}))}:null,
  experienceDebt:debt?{paths:debt.paths,actionable:debt.actionable,top10:debt.top10}:null,
  businessImpact:business?{rows:business.rows,formula:business.formula,top10:business.top10}:null,
  effortAdjusted:effort?{rows:effort.rows,formula:effort.formula,actionable:effort.actionable,top10:effort.top10}:null
};
const outDir=process.env.QC_OUT||path.join(root,'qa-artifacts','quality-control-center-v1');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'dashboard.json'),JSON.stringify(payload,null,2)+'\n');

const esc=(v)=>String(v??'').replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const badge=(s)=>'<span class="badge '+String(s).toLowerCase()+'">'+esc(s)+'</span>';
const metric=(name,val,sub='')=>'<div class="card"><span>'+esc(name)+'</span><b>'+esc(val)+'</b><small>'+esc(sub)+'</small></div>';
const topRows=(first?.top5||[]).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.slug)+'</td><td>'+r.firstBodyH2TopPx+'px</td><td>+'+r.excessPx+'px</td></tr>').join('');
const debtRows=(debt?.top10||[]).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.priority)+'</td><td>'+esc(r.path)+'</td><td>'+esc((r.worstMetric||'-').toUpperCase())+'</td><td>'+esc(r.score)+'</td></tr>').join('');
const businessRows=(business?.top10||[]).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.tier)+'</td><td>'+esc(r.path)+'</td><td>'+esc(r.combinedScore)+'</td><td>'+esc(r.seoClicks)+'</td><td>'+esc(r.pageViews)+'</td><td>'+esc(Number(r.estimatedEarningsKrw||0).toFixed(0))+'</td></tr>').join('');
const effortRows=(effort?.top10||[]).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.executionTier)+'</td><td>'+esc(r.path)+'</td><td>'+esc(r.executionValue)+'</td><td>'+esc(r.effortScore)+'</td><td>'+esc(r.worstMetric||'-')+'</td></tr>').join('');\nconst rumRows=['lcp','cls','inp'].map((m)=>{
  const v=rum?.metrics?.[m];
  const samples=Number(v?.samples??0);
  const milestone=samples>=20?'READY':samples>=10?'10/20':samples>=5?'5/10':samples+'/5';
  const pct=Math.min(100,Math.round(samples/20*100));
  return '<tr><td>'+m.toUpperCase()+'</td><td>'+(v?.p75??'-')+'</td><td>'+samples+'</td><td><b>'+milestone+'</b><br><span style="font-size:11px;color:#74839a">'+pct+'%</span></td><td>'+(v?.threshold??'-')+'</td></tr>';
}).join('');
const html='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JoyLab Quality Control Center V1</title><style>'+
'body{margin:0;background:#f4f7fb;color:#10233f;font-family:Inter,Pretendard,"Noto Sans KR",system-ui,sans-serif}.wrap{max-width:1280px;margin:auto;padding:24px}.hero{padding:26px;background:#071938;color:#fff;border-radius:18px}.hero h1{margin:0 0 8px}.hero p{margin:0;color:#c9d7eb}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.card,.panel{background:#fff;border:1px solid #dfe6f0;border-radius:14px;padding:16px}.card span,.card small{display:block;color:#74839a}.card b{display:block;font-size:24px;margin:4px 0}.panels{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel h2{margin-top:0}.badge{display:inline-block;padding:4px 8px;border-radius:999px;font-weight:800}.pass{background:#eaf8ef;color:#08783d}.warn,.collect{background:#fff5d8;color:#8a5a00}.fail{background:#ffe9e6;color:#b42318}.missing{background:#edf1f6;color:#59677a}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:9px;border-bottom:1px solid #edf1f6;text-align:left}@media(max-width:800px){.grid{grid-template-columns:1fr 1fr}.panels{grid-template-columns:1fr}.wrap{padding:14px}}</style></head><body><main class="wrap">'+
'<section class="hero"><h1>JoyLab Quality Control Center V1</h1><p>Visual Quality + Mobile Experience + Production RUM</p><p style="margin-top:12px">Overall '+badge(overall)+'</p></section>'+
'<section class="grid">'+metric('Visual',status.visual,(visual?.pages??'-')+' articles')+metric('First Content',status.first,(first?.count??'-')+' above target')+metric('Production RUM',status.rum,(rum?.windowDays??'-')+'d p75')+metric('Effort-adjusted',status.effort,(effort?.actionable??'-')+' actionable')+'</section>'+
'<section class="panels"><div class="panel"><h2>Visual Asset Contract V4</h2><p>'+badge(status.visual)+'</p><p>Assets '+esc(visual?.assets??'-')+' · Hero '+esc(visual?.byRole?.hero??'-')+' · Supporting '+esc(visual?.byRole?.supporting??'-')+' · OG '+esc(visual?.byRole?.og??'-')+'</p></div>'+
'<div class="panel"><h2>First Content Entry</h2><p>'+badge(status.first)+'</p><table><thead><tr><th>#</th><th>Article</th><th>First H2</th><th>Excess</th></tr></thead><tbody>'+topRows+'</tbody></table></div>'+
'<div class="panel"><h2>Production RUM p75</h2><p>'+badge(status.rum)+'</p><table><thead><tr><th>Metric</th><th>p75</th><th>Samples</th><th>5/10/20</th><th>Budget</th></tr></thead><tbody>'+rumRows+'</tbody></table></div>'+
'<div class="panel"><h2>Mobile Lab</h2><p>'+badge(status.lab)+'</p><p>Lighthouse LCP/CLS + font rendering contract.</p></div>'+'<div class="panel"><h2>Experience Debt TOP10</h2><p>'+badge(status.debt)+'</p><table><thead><tr><th>#</th><th>Priority</th><th>Path</th><th>Worst</th><th>Score</th></tr></thead><tbody>'+debtRows+'</tbody></table></div>'+ '<div class="panel"><h2>Business Impact Debt TOP10</h2><p>'+badge(status.business)+'</p><table><thead><tr><th>#</th><th>Tier</th><th>Path</th><th>Score</th><th>SEO</th><th>PV</th><th>₩</th></tr></thead><tbody>'+businessRows+'</tbody></table></div>'+ '<div class="panel"><h2>Debt × Impact × Effort TOP10</h2><p>'+badge(status.effort)+'</p><table><thead><tr><th>#</th><th>Tier</th><th>Path</th><th>Value</th><th>Effort</th><th>Worst</th></tr></thead><tbody>'+effortRows+'</tbody></table></div></section></main></body></html>';
fs.writeFileSync(path.join(outDir,'index.html'),html);
console.log('JoyLab Quality Control Center V1: '+overall+' '+JSON.stringify(status));
if(overall==='FAIL') process.exit(1);

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const articleDir=path.join(root,'src/data/articles');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/investment-taxonomy-v1.json'),'utf8'));
const outPath=path.join(root,'src/data/investment-taxonomy-registry-v1.json');

function frontmatter(src){
  const m=src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if(!m) return {};
  const out={}; let key=null;
  for(const line of m[1].split(/\r?\n/)){
    const kv=line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if(kv){
      key=kv[1];
      const raw=kv[2].trim();
      if(/^\[.*\]$/.test(raw)){
        out[key]=[...raw.matchAll(/[\"']([^\"']+)[\"']/g)].map(x=>x[1]);
      }else{ out[key]=raw.replace(/^[\"']|[\"']$/g,''); }
      continue;
    }
    const item=line.match(/^\s*-\s*(.*)$/);
    if(item && key){
      if(!Array.isArray(out[key])) out[key]=[];
      out[key].push(item[1].trim().replace(/^[\"']|[\"']$/g,''));
    }
  }
  return out;
}

function compile(group){ return Object.fromEntries(Object.entries(group).map(([id,parts])=>[id,parts.map(x=>new RegExp(x,'i'))])); }
const industryRules=compile(cfg.industryRules);
const thesisRules=compile(cfg.thesisRules);
const companyRules=compile(cfg.companyRules);
function infer(group,slug){ return Object.entries(group).filter(([,rules])=>rules.some(r=>r.test(slug))).map(([id])=>id); }
function arr(value){ return Array.isArray(value)?value:[]; }

const records=fs.readdirSync(articleDir).filter((name)=>name.endsWith('.md')).sort().map((name)=>{
  const slug=name.replace(/\.md$/,'');
  const meta=frontmatter(fs.readFileSync(path.join(articleDir,name),'utf8'));
  return {
    slug,
    route:'/articles/'+slug,
    industries:arr(meta.investmentIndustries).length?arr(meta.investmentIndustries):infer(industryRules,slug),
    theses:arr(meta.investmentTheses).length?arr(meta.investmentTheses):infer(thesisRules,slug),
    companies:arr(meta.investmentCompanies).length?arr(meta.investmentCompanies):infer(companyRules,slug),
    valueChains:arr(meta.investmentValueChains),
    kpis:arr(meta.investmentKpis),
    researchType:meta.investmentResearchType||null
  };
});

const next=JSON.stringify({version:1,generatedFrom:'src/data/articles + config/investment-taxonomy-v1.json',articleCount:records.length,records},null,2)+'\n';
if(process.argv.includes('--check')){
  const current=fs.existsSync(outPath)?fs.readFileSync(outPath,'utf8'):'';
  if(current!==next){ console.error('Investment Taxonomy Registry V1 is stale. Run: npm run taxonomy:registry'); process.exit(1); }
  console.log('Investment Taxonomy Registry V1 current: '+records.length+' articles');
}else{
  fs.writeFileSync(outPath,next);
  console.log('Investment Taxonomy Registry V1 generated: '+records.length+' articles');
}

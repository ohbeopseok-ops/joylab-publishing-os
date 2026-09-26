import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/investment-taxonomy-v1.json'), 'utf8'));
const articleDir = path.join(root, 'src/data/articles');

function read(file){ return fs.readFileSync(file,'utf8'); }
function slug(file){ return path.basename(file).replace(/\.md$/,''); }
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
        out[key]=[...raw.matchAll(/["']([^"']+)["']/g)].map(x=>x[1]);
      }else{
        out[key]=raw.replace(/^["']|["']$/g,'');
      }
      continue;
    }
    const item=line.match(/^\s*-\s*(.*)$/);
    if(item && key){
      if(!Array.isArray(out[key])) out[key]=[];
      out[key].push(item[1].trim().replace(/^["']|["']$/g,''));
    }
  }
  return out;
}
function compileRules(group){
  return Object.fromEntries(Object.entries(group).map(([id, parts])=>[id, parts.map(x=>new RegExp(x,'i'))]));
}
const industryRules=compileRules(cfg.industryRules);
const thesisRules=compileRules(cfg.thesisRules);
const companyRules=compileRules(cfg.companyRules);

function infer(meta,file){
  const hay=[slug(file),meta.title||'',meta.description||'',meta.series||'',...(Array.isArray(meta.tags)?meta.tags:[])].join(' ');
  const explicitIndustries=Array.isArray(meta.investmentIndustries)?meta.investmentIndustries:[];
  const explicitTheses=Array.isArray(meta.investmentTheses)?meta.investmentTheses:[];
  const explicitCompanies=Array.isArray(meta.investmentCompanies)?meta.investmentCompanies:[];
  const industries=explicitIndustries.length?explicitIndustries:Object.entries(industryRules).filter(([,rs])=>rs.some(r=>r.test(hay))).map(([id])=>id);
  const theses=explicitTheses.length?explicitTheses:Object.entries(thesisRules).filter(([,rs])=>rs.some(r=>r.test(hay))).map(([id])=>id);
  const companies=explicitCompanies.length?explicitCompanies:Object.entries(companyRules).filter(([,rs])=>rs.some(r=>r.test(hay))).map(([id])=>id);
  return {industries:[...new Set(industries)],theses:[...new Set(theses)],companies:[...new Set(companies)]};
}
function changedFiles(){
  const base=process.env.INVESTMENT_TAXONOMY_BASE_SHA;
  try{
    const range=base && !/^0+$/.test(base)?`${base}...HEAD`:'HEAD^...HEAD';
    return execSync(`git diff --name-only ${range}`,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  }catch{return [];}
}

const files=fs.readdirSync(articleDir).filter(x=>x.endsWith('.md')).map(x=>path.join(articleDir,x));
const coverage=Object.fromEntries(cfg.industries.map(x=>[x.id,0]));
const thesisCoverage=Object.fromEntries(cfg.theses.map(x=>[x.id,0]));
const records=[];
for(const file of files){
  const meta=frontmatter(read(file));
  const inferred=infer(meta,file);
  for(const id of inferred.industries) if(id in coverage) coverage[id]++;
  for(const id of inferred.theses) if(id in thesisCoverage) thesisCoverage[id]++;
  records.push({slug:slug(file),category:meta.category||'',...inferred});
}

const errors=[];
const validIndustry=new Set(cfg.industries.map(x=>x.id));
const validThesis=new Set(cfg.theses.map(x=>x.id));
for(const rel of changedFiles().filter(x=>x.startsWith('src/data/articles/')&&x.endsWith('.md')&&fs.existsSync(x))){
  const file=path.join(root,rel);
  const meta=frontmatter(read(file));
  const inferred=infer(meta,file);
  for(const id of Array.isArray(meta.investmentIndustries)?meta.investmentIndustries:[]) if(!validIndustry.has(id)) errors.push(`${rel}: unknown investmentIndustries id ${id}`);
  for(const id of Array.isArray(meta.investmentTheses)?meta.investmentTheses:[]) if(!validThesis.has(id)) errors.push(`${rel}: unknown investmentTheses id ${id}`);
  if(meta.category==='투자·경제' && inferred.industries.length===0 && inferred.theses.length===0){
    errors.push(`${rel}: investment article has no Industry or Thesis classification; add explicit investmentIndustries / investmentTheses`);
  }
}

const health=Object.fromEntries(Object.entries(coverage).map(([id,count])=>[
  id,
  count>=cfg.healthThresholds.greenMin?'GREEN':count>=cfg.healthThresholds.yellowMin?'YELLOW':'RED'
]));

console.log(JSON.stringify({
  version:cfg.version,
  articleCount:records.length,
  coverage,
  health,
  thesisCoverage
},null,2));

if(errors.length){
  console.error('Investment Taxonomy V1 failed:\n- '+errors.join('\n- '));
  process.exit(1);
}

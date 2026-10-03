import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dir=path.join(root,'src/data/articles');
const files=fs.readdirSync(dir).filter((name)=>name.endsWith('.md'));
const errors=[];

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

for(const name of files){
  const full=path.join(dir,name);
  const src=fs.readFileSync(full,'utf8');
  const meta=frontmatter(src);
  const theses=Array.isArray(meta.investmentTheses)?meta.investmentTheses:[];
  if(!theses.includes('mega-project-capex')) continue;

  const prefix='src/data/articles/'+name;
  const kpis=Array.isArray(meta.investmentKpis)?meta.investmentKpis:[];
  const chains=Array.isArray(meta.investmentValueChains)?meta.investmentValueChains:[];

  if(!meta.investmentResearchType) errors.push(prefix+': investmentResearchType required');
  if(chains.length===0) errors.push(prefix+': investmentValueChains required');
  if(kpis.length<4) errors.push(prefix+': investmentKpis must include at least 4 Evidence Gates');

  const checks=[
    ['Policy Gate',/Policy Gate|정책 Gate|법정 Gate/i],
    ['Evidence Gate',/Evidence Gate|증거 Gate/i],
    ['Procurement',/Procurement|발주/i],
    ['Revenue',/Revenue|매출/i],
    ['Margin',/Margin|마진/i]
  ];
  for(const [label,re] of checks){
    if(!re.test(src)) errors.push(prefix+': missing '+label+' transmission evidence');
  }

  if(/확정 수혜주/.test(src) && !/확정 수혜주[^\n]{0,30}(아니|아닙|금지|분류하지|이르)/.test(src)){
    errors.push(prefix+': prohibited unqualified "확정 수혜주" claim');
  }
}

if(errors.length){
  console.error('Mega Project Investment Gate V1 failed:\n- '+errors.join('\n- '));
  process.exit(1);
}

console.log('Mega Project Investment Gate V1 PASS');

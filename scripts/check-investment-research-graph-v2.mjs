import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const graph=JSON.parse(fs.readFileSync(path.join(root,'config/investment-research-graph-v2.json'),'utf8'));

const errors=[];
const companyIds=new Set(graph.companies.map((x)=>x.id));
const kpiIds=new Set(graph.kpis.map((x)=>x.id));
const valueChainIds=new Set(graph.valueChains.map((x)=>x.id));
const allIds=new Set();

for(const group of [graph.companies,graph.kpis,graph.valueChains]){
  for(const node of group){
    if(allIds.has(node.id)) errors.push('duplicate node id: '+node.id);
    allIds.add(node.id);
  }
}

for(const edge of graph.edges){
  if(!companyIds.has(edge.from)) errors.push('edge.from must be company: '+edge.from);
  if(edge.type==='company-to-kpi' && !kpiIds.has(edge.to)) errors.push('missing KPI target: '+edge.to);
  if(edge.type==='company-to-value-chain' && !valueChainIds.has(edge.to)) errors.push('missing value-chain target: '+edge.to);
  if(!['company-to-kpi','company-to-value-chain'].includes(edge.type)) errors.push('unknown edge type: '+edge.type);
}

for(const company of graph.companies){
  const edges=graph.edges.filter((edge)=>edge.from===company.id);
  if(!edges.some((edge)=>edge.type==='company-to-kpi')) errors.push('company has no KPI edge: '+company.id);
  if(!edges.some((edge)=>edge.type==='company-to-value-chain')) errors.push('company has no value-chain edge: '+company.id);
}

if(errors.length){
  console.error('Investment Research Graph V2 failed:\n- '+errors.join('\n- '));
  process.exit(1);
}

console.log(JSON.stringify({
  version:graph.version,
  companies:graph.companies.length,
  kpis:graph.kpis.length,
  valueChains:graph.valueChains.length,
  edges:graph.edges.length
},null,2));

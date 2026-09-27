import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const registryPath=path.join(root,'config/research-graph-platform-v1.json');
const templatePath=path.join(root,'config/research-graph-template-v1.json');
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const errors=[];

const fail=(m)=>errors.push(m);
if(registry.contract!=='JoyLab.ResearchGraphPlatform') fail('invalid platform contract');
if(!/^\d+\.\d+\.\d+$/.test(registry.version??'')) fail('platform version must be semver');
if(!fs.existsSync(path.join(root,registry.mapComponent))) fail('map component missing: '+registry.mapComponent);
if(!fs.existsSync(templatePath)) fail('graph template missing');

const ids=new Set();
for(const vertical of registry.verticals??[]){
  if(!vertical.id||!vertical.label||!vertical.status||!vertical.pillar) fail('vertical required fields missing: '+JSON.stringify(vertical));
  if(ids.has(vertical.id)) fail('duplicate vertical id: '+vertical.id);
  ids.add(vertical.id);
  if(!['active','template_ready'].includes(vertical.status)) fail('invalid vertical status: '+vertical.id);
  if(vertical.domain!=='investing') fail('vertical domain must be investing: '+vertical.id);
  if(vertical.status==='active'){
    if(!vertical.graph) fail('active vertical graph missing: '+vertical.id);
    else{
      const graphPath=path.join(root,vertical.graph);
      if(!fs.existsSync(graphPath)) fail('active graph file missing: '+vertical.graph);
      else{
        const graph=JSON.parse(fs.readFileSync(graphPath,'utf8'));
        if(graph.contract!=='JoyLab.ResearchGraph') fail('invalid graph contract: '+vertical.id);
        if(graph.pillar?.url!==vertical.pillar) fail('pillar URL mismatch: '+vertical.id);
        if(!Array.isArray(graph.nodes)||!Array.isArray(graph.edges)||!Array.isArray(graph.articles)) fail('graph collections missing: '+vertical.id);
      }
    }
  }
}

for(const expected of ['ai-power','semiconductor','financials','shipbuilding']){
  if(!ids.has(expected)) fail('required vertical missing: '+expected);
}

if(errors.length){
  for(const e of errors) console.error('❌ '+e);
  console.error('\nResearch Graph Platform V1 FAILED: '+errors.length+' error(s)');
  process.exit(1);
}
console.log('✅ Research Graph Platform V1 PASS · '+registry.verticals.length+' verticals · '+registry.version);

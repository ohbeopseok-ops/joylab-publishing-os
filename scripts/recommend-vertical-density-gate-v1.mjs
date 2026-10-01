import fs from 'node:fs/promises';
import path from 'node:path';
import contract from '../config/monetization-layout-contract-v2.json' with { type: 'json' };

const inputDirs=(process.env.VERTICAL_DENSITY_INPUT_DIRS || 'qa-artifacts/monetization-layout-production-v2')
  .split(',')
  .map((value)=>value.trim())
  .filter(Boolean);
const outPath=process.env.VERTICAL_DENSITY_RECOMMENDATION_OUT || 'qa-artifacts/monetization-layout-production-v2/vertical-density-recommendation.json';
const policy=contract.verticalDensityKpi.recommendation;

async function walk(dir){
  const files=[];
  try{
    const entries=await fs.readdir(dir,{withFileTypes:true});
    for(const entry of entries){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()) files.push(...await walk(full));
      else if(entry.isFile() && entry.name==='measurements.json') files.push(full);
    }
  }catch{}
  return files;
}

const measurementFiles=(await Promise.all(inputDirs.map(walk))).flat();
const samples=[];
const deployments=new Set();

for(const file of measurementFiles){
  try{
    const json=JSON.parse(await fs.readFile(file,'utf8'));
    const deploymentKey=json.deploymentKey || json.commitSha || json.measuredAt || file;
    deployments.add(String(deploymentKey));
    for(const row of json.measurements || []){
      if(Number.isFinite(row.pageHeightDeltaPct)){
        samples.push({
          deploymentKey:String(deploymentKey),
          surface:row.surface,
          target:row.target,
          viewport:row.viewport,
          deltaPct:Number(row.pageHeightDeltaPct)
        });
      }
    }
  }catch{}
}

const percentile=(values,p)=>{
  if(!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  const rank=(sorted.length-1)*p;
  const lo=Math.floor(rank), hi=Math.ceil(rank);
  if(lo===hi) return sorted[lo];
  const weight=rank-lo;
  return sorted[lo]*(1-weight)+sorted[hi]*weight;
};
const roundUp=(value,step)=>Math.ceil(value/step)*step;

function summarize(groupSamples,minMeasurements,minDeployments){
  const values=groupSamples.map(s=>s.deltaPct).sort((a,b)=>a-b);
  const deploymentCount=new Set(groupSamples.map(s=>s.deploymentKey)).size;
  const p95=percentile(values,0.95);
  let candidateHardGatePct=null;
  if(values.length>=minMeasurements && deploymentCount>=minDeployments && Number.isFinite(p95)){
    candidateHardGatePct=roundUp(p95*policy.safetyMultiplier,policy.roundUpStepPct);
    candidateHardGatePct=Math.max(policy.floorPct,Math.min(policy.ceilingPct,candidateHardGatePct));
  }
  return {
    status:candidateHardGatePct==null?'COLLECT':'CANDIDATE_READY',
    evidence:{measurements:values.length,deployments:deploymentCount,minimumMeasurements:minMeasurements,minimumDeployments:minDeployments},
    statistics:{minPct:values.length?values[0]:null,medianPct:percentile(values,0.5),p95Pct:p95,maxPct:values.length?values.at(-1):null},
    candidateHardGatePct
  };
}

const overall=summarize(samples,policy.minimumMeasurements,policy.minimumDeployments);
const bySurface={};
for(const surface of [...new Set(samples.map(s=>s.surface))].sort()){
  bySurface[surface]=summarize(
    samples.filter(s=>s.surface===surface),
    policy.minimumMeasurementsPerSurface,
    policy.minimumDeploymentsPerSurface
  );
}
const status=overall.status==='CANDIDATE_READY'||Object.values(bySurface).some(v=>v.status==='CANDIDATE_READY')
  ? 'CANDIDATE_READY'
  : 'COLLECT';

const result={
  schemaVersion:2,
  name:'JoyLab Vertical Density Hard Gate Recommender V2',
  status,
  evidenceFiles:measurementFiles.length,
  overall,
  bySurface,
  recommendationPolicy:{
    formula:'ceil_step(clamp(p95 * safetyMultiplier, floor, ceiling))',
    percentile:policy.percentile,
    safetyMultiplier:policy.safetyMultiplier,
    roundUpStepPct:policy.roundUpStepPct,
    floorPct:policy.floorPct,
    ceilingPct:policy.ceilingPct,
    promotionMode:policy.mode
  },
  samples
};

await fs.mkdir(path.dirname(outPath),{recursive:true});
await fs.writeFile(outPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));

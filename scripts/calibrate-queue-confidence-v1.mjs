import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const driftPath=process.env.CALIBRATION_DRIFT||path.join(root,'qa-artifacts','ranking-drift-v1','drift.json');
const outDir=process.env.CALIBRATION_OUT||path.join(root,'qa-artifacts','queue-confidence-calibration-v1');
if(!fs.existsSync(driftPath)) throw new Error('Queue Confidence Calibration requires drift.json.');
const drift=JSON.parse(fs.readFileSync(driftPath,'utf8'));

const spearman=Number.isFinite(Number(drift.spearman))?Number(drift.spearman):null;
const overlapRate=Number.isFinite(Number(drift.overlapRate))?Number(drift.overlapRate):0;
const maxShift=Number.isFinite(Number(drift.maxAbsoluteRankShift))?Number(drift.maxAbsoluteRankShift):null;
const rankConsistency=spearman===null?0:(spearman+1)/2;
const maxDriftScore=maxShift===null?0:Math.max(0,1-Math.min(maxShift,10)/10);
const structural=Math.round(100*(0.4*rankConsistency+0.35*overlapRate+0.25*maxDriftScore));

const policies={
  current:{factors:{5:0.25,10:0.50,20:1.00},provisionalThreshold:45,rumLedThreshold:75},
  balanced:{factors:{5:0.55,10:0.75,20:1.00},provisionalThreshold:55,rumLedThreshold:70}
};
const score=(factor)=>Math.round(structural*factor);
const classify=(milestone,value,policy)=>{
  if(milestone<10) return 'BOOTSTRAP_LOCK';
  if(milestone<20) return value>=policy.provisionalThreshold?'PROVISIONAL':'BOOTSTRAP_LOCK';
  return value>=policy.rumLedThreshold?'RUM_LED':value>=policy.provisionalThreshold?'PROVISIONAL':'BOOTSTRAP_LOCK';
};
const scenarios=[5,10,20].map((milestone)=>({
  milestone,
  currentScore:score(policies.current.factors[milestone]),
  currentMode:classify(milestone,score(policies.current.factors[milestone]),policies.current),
  balancedScore:score(policies.balanced.factors[milestone]),
  balancedMode:classify(milestone,score(policies.balanced.factors[milestone]),policies.balanced)
}));

const currentRawRequiredAt10=Math.ceil(policies.current.provisionalThreshold/policies.current.factors[10]);
const balancedRawRequiredAt10=Math.ceil(policies.balanced.provisionalThreshold/policies.balanced.factors[10]);
const currentRawRequiredAt20=policies.current.rumLedThreshold;
const balancedRawRequiredAt20=policies.balanced.rumLedThreshold;

let recommendation='KEEP_CURRENT';
const reasons=[];
if(currentRawRequiredAt10>=90){
  recommendation='ADOPT_BALANCED';
  reasons.push('현재 10-sample PROVISIONAL 진입에는 structural score '+currentRawRequiredAt10+'+가 필요해 탐색 단계치고 과도하게 보수적임.');
}
if(structural>=balancedRawRequiredAt10 && scenarios.find((x)=>x.milestone===10)?.currentMode==='BOOTSTRAP_LOCK'){
  recommendation='ADOPT_BALANCED';
  reasons.push('현재 실데이터 구조는 balanced 정책에서는 PROVISIONAL이지만 current 정책에서는 LOCK됨.');
}
if(structural<55){
  recommendation='KEEP_CURRENT';
  reasons.push('현재 structural score가 낮아 표본 가중 완화보다 순위 안정성 개선이 우선임.');
}

const payload={
  generatedAt:new Date().toISOString(),
  sourceMilestone:drift.milestone,
  sourceState:drift.state,
  observed:{spearman,overlapRate,maxAbsoluteRankShift:maxShift,structuralScore:structural,eligiblePageCount:drift.eligiblePageCount},
  thresholds:{
    current:{rawRequiredAt10:currentRawRequiredAt10,rawRequiredAt20:currentRawRequiredAt20},
    balanced:{rawRequiredAt10:balancedRawRequiredAt10,rawRequiredAt20:balancedRawRequiredAt20}
  },
  scenarios,
  recommendation,
  reasons,
  note:'V1은 동일한 실제 관측 rank structure에 5/10/20 evidence maturity를 적용하는 sensitivity calibration이다. 시점별 p75 자체 변화는 milestone snapshot 누적 후 V2에서 검증한다.'
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'calibration.json'),JSON.stringify(payload,null,2)+'\n');
const lines=['# Queue Confidence Calibration V1','',
  'Observed structural score: **'+structural+'/100**  ',
  'Spearman: **'+(spearman??'—')+'** · TOP10 overlap: **'+Math.round(overlapRate*10)+'/10** · Max drift: **'+(maxShift??'—')+'**  ',
  'Recommendation: **'+recommendation+'**','',
  '| Samples | Current | Mode | Balanced | Mode |','| ---: | ---: | --- | ---: | --- |',
  ...scenarios.map((s)=>`| ${s.milestone} | ${s.currentScore} | ${s.currentMode} | ${s.balancedScore} | ${s.balancedMode} |`),
  '','## Threshold pressure','',
  '- Current 10-sample PROVISIONAL requires raw structural score: **'+currentRawRequiredAt10+'**',
  '- Balanced 10-sample PROVISIONAL requires raw structural score: **'+balancedRawRequiredAt10+'**',
  '- Current 20-sample RUM_LED requires raw structural score: **'+currentRawRequiredAt20+'**',
  '- Balanced 20-sample RUM_LED requires raw structural score: **'+balancedRawRequiredAt20+'**',
  '','## Reasons','',...(reasons.length?reasons:['No calibration change indicated.']).map((r)=>'- '+r),
  '','> '+payload.note];
fs.writeFileSync(path.join(outDir,'calibration.md'),lines.join('\n')+'\n');
console.log('Queue Confidence Calibration V1: structural='+structural+' recommendation='+recommendation);

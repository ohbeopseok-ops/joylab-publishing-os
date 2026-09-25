import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config','adsense-monetization-gate-v1.json'),'utf8'));
const snapshotPath=process.argv[2] || process.env.ADSENSE_MONETIZATION_SNAPSHOT || 'ops/adsense/monetization-snapshot.json';

function pctDrop(current, baseline){
  if(current==null||baseline==null||baseline===0) return null;
  return ((baseline-current)/baseline)*100;
}
function pctIncrease(current, baseline){
  if(current==null||baseline==null||baseline===0) return null;
  return ((current-baseline)/baseline)*100;
}
function finite(x){return typeof x==='number'&&Number.isFinite(x);}

if(!fs.existsSync(path.join(root,snapshotPath))){
  console.log(JSON.stringify({gate:cfg.name,decision:'COLLECT',reason:'snapshot_missing',snapshotPath},null,2));
  process.exit(0);
}

const s=JSON.parse(fs.readFileSync(path.join(root,snapshotPath),'utf8'));
const reasons=[];
const metrics={};

for(const [key,enabled] of Object.entries(cfg.hardStops)){
  if(!enabled) continue;
  let active=false;
  if(key==='policyWarning') active=Boolean(s.policy?.warning);
  if(key==='consentFailure') active=Boolean(s.policy?.consentFailure);
  if(key==='adOverlap') active=Boolean(s.layout?.adOverlap);
  if(key==='horizontalOverflow') active=Boolean(s.layout?.horizontalOverflow);
  if(key==='navigationObstruction') active=Boolean(s.layout?.navigationObstruction);
  if(active) reasons.push({severity:'HARD_STOP',id:key});
}

const cls= s.ux?.clsP75;
const baselineCls=s.ux?.baselineClsP75;
if(finite(cls)){
  metrics.clsP75=cls;
  if(cls>cfg.ux.clsAbsoluteMax) reasons.push({severity:'UX_STOP',id:'cls_absolute',value:cls,limit:cfg.ux.clsAbsoluteMax});
}
if(finite(cls)&&finite(baselineCls)){
  const delta=cls-baselineCls;
  metrics.clsDelta=delta;
  if(delta>cfg.ux.clsDeltaMax) reasons.push({severity:'UX_STOP',id:'cls_delta',value:delta,limit:cfg.ux.clsDeltaMax});
}

const readingDrop=pctDrop(s.ux?.readingDepthPct,s.ux?.baselineReadingDepthPct);
if(finite(readingDrop)){
  metrics.readingDepthDropPct=readingDrop;
  if(readingDrop>cfg.ux.readingDepthDropPctMax) reasons.push({severity:'UX_STOP',id:'reading_depth_drop',value:readingDrop,limit:cfg.ux.readingDepthDropPctMax});
}
const ctaDrop=pctDrop(s.ux?.ctaConversionPct,s.ux?.baselineCtaConversionPct);
if(finite(ctaDrop)){
  metrics.ctaConversionDropPct=ctaDrop;
  if(ctaDrop>cfg.ux.ctaConversionDropPctMax) reasons.push({severity:'UX_STOP',id:'cta_conversion_drop',value:ctaDrop,limit:cfg.ux.ctaConversionDropPctMax});
}
const exitIncrease=pctIncrease(s.ux?.exitRatePct,s.ux?.baselineExitRatePct);
if(finite(exitIncrease)){
  metrics.exitRateIncreasePct=exitIncrease;
  if(exitIncrease>cfg.ux.exitRateIncreasePctMax) reasons.push({severity:'UX_STOP',id:'exit_rate_increase',value:exitIncrease,limit:cfg.ux.exitRateIncreasePctMax});
}


const ctr=s.revenue?.ctrPct;
const baselineCtr=s.revenue?.baselineCtrPct;
if(finite(ctr)){
  metrics.ctrPct=ctr;
  if(ctr>cfg.safety.ctrAbsoluteMaxPct) reasons.push({severity:'SAFETY_STOP',id:'ctr_absolute',value:ctr,limit:cfg.safety.ctrAbsoluteMaxPct});
}
if(finite(ctr)&&finite(baselineCtr)&&baselineCtr>0){
  const mult=ctr/baselineCtr;
  metrics.ctrVsBaselineMultiplier=mult;
  if(mult>cfg.safety.ctrVsBaselineMultiplierMax) reasons.push({severity:'SAFETY_STOP',id:'ctr_spike',value:mult,limit:cfg.safety.ctrVsBaselineMultiplierMax});
}

const evidenceOk=(s.period?.days||0)>=cfg.minimumEvidence.days && (s.traffic?.adImpressions||0)>=cfg.minimumEvidence.adImpressions;
let decision='ADVANCE';
if(reasons.length) decision='ROLLBACK';
else if(!evidenceOk) decision='COLLECT';

const result={
  gate:cfg.name,
  stage:s.stage,
  decision,
  evidence:{
    days:s.period?.days||0,
    adImpressions:s.traffic?.adImpressions||0,
    minimumDays:cfg.minimumEvidence.days,
    minimumAdImpressions:cfg.minimumEvidence.adImpressions,
    sufficient:evidenceOk
  },
  revenue:{
    pageRpmKrw:s.revenue?.pageRpmKrw??null,
    estimatedEarningsKrw:s.revenue?.estimatedEarningsKrw??null,
    viewabilityPct:s.revenue?.viewabilityPct??null,
    fillRatePct:s.revenue?.fillRatePct??null
  },
  metrics,
  reasons
};

console.log(JSON.stringify(result,null,2));

if(decision==='ROLLBACK') process.exit(2);

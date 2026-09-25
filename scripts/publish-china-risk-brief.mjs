import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const HISTORY_PATH = 'src/data/china-semiconductor-risk-history.json';
const OUTPUT_PATH = 'src/data/china-semiconductor-risk-brief.json';
const PUBLIC_PATH = 'public/data/china-semiconductor-risk-brief.json';
const SELF_TEST = process.argv.includes('--self-test');

const readJson = (path) => JSON.parse(fs.readFileSync(path,'utf8'));
const history = readJson(HISTORY_PATH);

function evaluatePublishGate(delta) {
  if (!delta?.investmentBrief || !delta?.attribution) {
    return { publish:false, reasons:['NO_QUARTERLY_DELTA'] };
  }
  const primary = delta.attribution.primaryDriver;
  const reasons = [];
  if (delta.attribution.bandChanged) reasons.push('RISK_BAND_CHANGED');
  if (Math.abs(delta.total ?? 0) >= 5) reasons.push('TOTAL_DELTA_GTE_5');
  if (Math.abs(delta.earnings ?? 0) >= 15) reasons.push('EARNINGS_DELTA_GTE_15');
  if (Math.abs(primary?.contribution ?? 0) >= 3) reasons.push('PRIMARY_DRIVER_GTE_3P');
  if (Math.abs(delta.coveredWeight ?? 0) >= 10) reasons.push('COVERAGE_DELTA_GTE_10P');
  return { publish:reasons.length > 0, reasons:reasons.length ? reasons : ['BELOW_MATERIALITY_THRESHOLD'] };
}

function buildBrief(history) {
  const delta = history.latestDelta;
  const gate = evaluatePublishGate(delta);
  if (!gate.publish) return { gate, brief:null };

  const brief = delta.investmentBrief;
  const payload = {
    version:'1.0',
    type:'JOYLAB_CHINA_SEMICONDUCTOR_RISK_BRIEF',
    status:'PUBLISHED',
    quarter:delta.toQuarter,
    previousQuarter:delta.fromQuarter,
    generatedAt:history.updatedAt,
    risk:{
      totalDelta:delta.total,
      structuralDelta:delta.structural,
      earningsDelta:delta.earnings,
      coverageDelta:delta.coveredWeight
    },
    attribution:{
      primaryDriver:delta.attribution.primaryDriver,
      secondaryDriver:delta.attribution.secondaryDriver,
      mitigatingDriver:delta.attribution.mitigatingDriver,
      bandChanged:delta.attribution.bandChanged
    },
    lines:brief.lines,
    fields:{
      currentRisk:brief.currentRisk,
      quarterChange:brief.quarterChange,
      primaryCause:brief.primaryCause,
      nextNumber:brief.nextNumber
    },
    publishGate:gate,
    destinations:{
      dashboard:true,
      blogSummary:true,
      kakao:true,
      premarketBrief:true
    },
    disclaimer:'투자 판단 신호가 아니라 다음 분기 재점검을 위한 모니터링 브리핑입니다.'
  };
  payload.fingerprint = crypto.createHash('sha256').update(JSON.stringify({
    quarter:payload.quarter,
    lines:payload.lines,
    reasons:payload.publishGate.reasons
  })).digest('hex').slice(0,16);
  return { gate, brief:payload };
}

function writeJson(path,value) {
  fs.mkdirSync(path.split('/').slice(0,-1).join('/'),{recursive:true});
  fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n','utf8');
}

function selfTest() {
  const sample = {
    updatedAt:'2026-12-31T00:00:00Z',
    latestDelta:{
      fromQuarter:'2026Q3',toQuarter:'2026Q4',
      total:9,structural:3,earnings:18,coveredWeight:0,
      attribution:{
        bandChanged:false,
        primaryDriver:{id:'dramAsp',name:'DRAM ASP 압력',contribution:6.4},
        secondaryDriver:{id:'cxmtCapa',name:'CXMT CAPA·생산성',contribution:2.1},
        mitigatingDriver:{id:'nandAsp',name:'NAND ASP 압력',contribution:-1.3}
      },
      investmentBrief:{
        currentRisk:'현재 Risk: 47점(YELLOW)',
        quarterChange:'전분기 변화: 2026Q3 → 2026Q4, Total +9점',
        primaryCause:'가장 큰 원인: DRAM ASP 압력이 Total Risk에 +6.4p 기여했습니다.',
        nextNumber:'다음 확인 숫자: 삼성전자·SK하이닉스 분기 DRAM ASP와 HBM 매출 비중',
        lines:[
          '현재 Risk: 47점(YELLOW)',
          '전분기 변화: 2026Q3 → 2026Q4, Total +9점',
          '가장 큰 원인: DRAM ASP 압력이 Total Risk에 +6.4p 기여했습니다.',
          '다음 확인 숫자: 삼성전자·SK하이닉스 분기 DRAM ASP와 HBM 매출 비중'
        ]
      }
    }
  };
  const built = buildBrief(sample);
  assert.equal(built.gate.publish,true);
  assert.ok(built.gate.reasons.includes('TOTAL_DELTA_GTE_5'));
  assert.ok(built.gate.reasons.includes('EARNINGS_DELTA_GTE_15'));
  assert.equal(built.brief.lines.length,4);
  assert.match(built.brief.fields.nextNumber,/삼성전자·SK하이닉스/);

  const quiet = structuredClone(sample);
  quiet.latestDelta.total=1;
  quiet.latestDelta.earnings=2;
  quiet.latestDelta.attribution.primaryDriver.contribution=0.8;
  const quietBuilt=buildBrief(quiet);
  assert.equal(quietBuilt.gate.publish,false);
  assert.deepEqual(quietBuilt.gate.reasons,['BELOW_MATERIALITY_THRESHOLD']);
  console.log('China semiconductor Risk Brief JSON self-test PASS');
}

if (SELF_TEST) {
  selfTest();
  process.exit(0);
}

const { gate, brief } = buildBrief(history);
if (!gate.publish) {
  console.log(`Risk Brief not published: ${gate.reasons.join(', ')}`);
  process.exit(0);
}

const existing = fs.existsSync(OUTPUT_PATH) ? readJson(OUTPUT_PATH) : null;
if (existing?.fingerprint === brief.fingerprint) {
  console.log(`Risk Brief unchanged: ${brief.quarter} ${brief.fingerprint}`);
  process.exit(0);
}

writeJson(OUTPUT_PATH,brief);
writeJson(PUBLIC_PATH,brief);
console.log(`Risk Brief published: ${brief.quarter} ${brief.fingerprint} · ${gate.reasons.join(', ')}`);

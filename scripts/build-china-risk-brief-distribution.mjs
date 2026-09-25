import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const INPUT='src/data/china-semiconductor-risk-brief.json';
const OUTPUT='src/data/china-risk-brief-distribution.json';
const PUBLIC='public/data/china-risk-brief-distribution.json';
const KAKAO='distribution/china-risk-kakao-handoff.json';
const PUBLIC_KAKAO='public/data/china-risk-kakao.json';
const PUBLIC_PREMARKET='public/data/china-risk-premarket-0700.json';
const PUBLIC_BLOG='public/data/china-risk-blog-summary.json';
const PUBLIC_EVENT='public/data/china-risk-notification-event.json';
const SELF_TEST=process.argv.includes('--self-test');

const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};

function compact(line,prefix){
  return String(line||'').replace(prefix,'').trim();
}

export function buildDistribution(brief){
  if(brief.status!=='PUBLISHED' || !Array.isArray(brief.lines) || brief.lines.length!==4){
    return {status:'WAITING',sourceFingerprint:brief.fingerprint??null,channels:{}};
  }
  const current=compact(brief.fields.currentRisk,'현재 Risk:');
  const delta=compact(brief.fields.quarterChange,'전분기 변화:');
  const cause=compact(brief.fields.primaryCause,'가장 큰 원인:');
  const next=compact(brief.fields.nextNumber,'다음 확인 숫자:');

  const kakaoLines=[
    `[중국 반도체 Risk] ${current}`,
    `전분기: ${delta}`,
    `원인: ${cause}`,
    `다음 체크: ${next}`
  ];

  const payload={
    version:'1.0',
    status:'READY',
    generatedAt:new Date().toISOString(),
    quarter:brief.quarter,
    sourceFingerprint:brief.fingerprint,
    channels:{
      kakao:{
        mode:'HANDOFF',
        autoSend:false,
        lines:kakaoLines,
        text:kakaoLines.join('\n')
      },
      premarket0700:{
        title:`07:00 China Semiconductor Risk · ${brief.quarter}`,
        currentRisk:brief.fields.currentRisk,
        quarterChange:brief.fields.quarterChange,
        primaryCause:brief.fields.primaryCause,
        nextNumber:brief.fields.nextNumber,
        priority:brief.publishGate?.reasons?.includes('RISK_BAND_CHANGED')?'HIGH':'NORMAL'
      },
      blogSummary:{
        eyebrow:'JOYLAB CHINA SEMICONDUCTOR RISK UPDATE',
        title:`${brief.quarter} 분기 Risk Brief`,
        lines:brief.lines,
        sourceUrl:'/articles/china-semiconductor-risk-indicators',
        disclaimer:brief.disclaimer
      }
    }
  };
  payload.fingerprint=crypto.createHash('sha256').update(JSON.stringify({source:payload.sourceFingerprint,channels:payload.channels})).digest('hex').slice(0,16);
  return payload;
}

function selfTest(){
  const sample={status:'PUBLISHED',quarter:'2026Q4',fingerprint:'abc',fields:{
    currentRisk:'현재 Risk: 47점(YELLOW)',
    quarterChange:'전분기 변화: 2026Q3 → 2026Q4, Total +9점',
    primaryCause:'가장 큰 원인: DRAM ASP 압력이 +6.4p 기여했습니다.',
    nextNumber:'다음 확인 숫자: 삼성전자·SK하이닉스 DRAM ASP'
  },lines:['a','b','c','d'],publishGate:{reasons:['TOTAL_DELTA_GTE_5']},disclaimer:'monitor only'};
  const out=buildDistribution(sample);
  assert.equal(out.status,'READY');
  assert.equal(out.channels.kakao.lines.length,4);
  assert.equal(out.channels.kakao.autoSend,false);
  assert.match(out.channels.premarket0700.title,/07:00/);
  assert.equal(out.channels.blogSummary.lines.length,4);
  console.log('Risk Brief Distribution Adapter V1 self-test PASS');
}

if(SELF_TEST){selfTest();process.exit(0);}
const brief=read(INPUT);
const out=buildDistribution(brief);
write(OUTPUT,out);write(PUBLIC,out);
if(out.status==='READY'){
  write(PUBLIC_KAKAO,{version:'1.0',status:'READY',quarter:out.quarter,sourceFingerprint:out.sourceFingerprint,...out.channels.kakao});
  write(PUBLIC_PREMARKET,{version:'1.0',status:'READY',quarter:out.quarter,sourceFingerprint:out.sourceFingerprint,...out.channels.premarket0700});
  write(PUBLIC_BLOG,{version:'1.0',status:'READY',quarter:out.quarter,sourceFingerprint:out.sourceFingerprint,...out.channels.blogSummary});
  write(PUBLIC_EVENT,{
    version:'1.0',event:'CHINA_RISK_BRIEF_PUBLISHED',createdAt:out.generatedAt,
    sourceFingerprint:out.sourceFingerprint,distributionFingerprint:out.fingerprint,
    consumers:['kakao-handoff','premarket-0700','blog-summary','earnings-impact']
  });
  write(KAKAO,{
    version:'1.0',event:'CHINA_RISK_BRIEF_READY',createdAt:out.generatedAt,
    sourceFingerprint:out.sourceFingerprint,distributionFingerprint:out.fingerprint,
    channel:'kakao',mode:'MANUAL_OR_EXTERNAL_CONNECTOR_HANDOFF',autoSend:false,
    lines:out.channels.kakao.lines,text:out.channels.kakao.text
  });
}
console.log(`Risk Brief Distribution Adapter V1: ${out.status}`);

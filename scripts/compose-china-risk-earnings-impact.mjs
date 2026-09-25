import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const RISK='src/data/china-semiconductor-risk-brief.json';
const EARNINGS='src/data/memory-earnings-snapshot.json';
const OUTPUT='src/data/china-risk-earnings-impact-brief.json';
const PUBLIC='public/data/china-risk-earnings-impact-brief.json';
const SELF_TEST=process.argv.includes('--self-test');

const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};

const DRIVER_MAP={
  dramAsp:{
    label:'DRAM ASP',
    transmission:'DIRECT_EARNINGS',
    samsung:'DS 영업이익·메모리 매출 믹스·DRAM ASP',
    sk:'영업이익률·DRAM ASP·HBM 매출 비중'
  },
  nandAsp:{
    label:'NAND ASP',
    transmission:'DIRECT_EARNINGS',
    samsung:'NAND ASP·Enterprise SSD 비중·DS 영업이익',
    sk:'NAND ASP·Solidigm Enterprise SSD 비중·영업이익률'
  },
  hbm:{
    label:'중국 HBM 자립',
    transmission:'STRUCTURAL_TO_EARNINGS',
    samsung:'HBM4/HBM4E 고객 인증·출하량·HBM 매출 비중',
    sk:'HBM4 출하 램프·HBM 매출 비중·장기계약'
  },
  cxmtShare:{
    label:'CXMT DRAM 점유율',
    transmission:'STRUCTURAL_TO_EARNINGS',
    samsung:'중국향 DRAM 매출 비중·범용 DRAM ASP·Bit Growth',
    sk:'중국향 DRAM 매출 비중·범용 DRAM ASP·Bit Growth'
  },
  cxmtCapa:{
    label:'CXMT CAPA',
    transmission:'STRUCTURAL_TO_EARNINGS',
    samsung:'DRAM Bit Growth·재고·범용 DRAM ASP',
    sk:'DRAM Bit Growth·재고·범용 DRAM ASP'
  },
  ymtcShare:{
    label:'YMTC NAND 점유율',
    transmission:'STRUCTURAL_TO_EARNINGS',
    samsung:'NAND ASP·중국향 NAND 매출·Enterprise SSD 비중',
    sk:'Solidigm ASP·eSSD 비중·중국 외 고객 성장'
  },
  ymtcEssd:{
    label:'YMTC eSSD 침투',
    transmission:'STRUCTURAL_TO_EARNINGS',
    samsung:'Enterprise SSD 매출 비중·CSP 고객',
    sk:'Solidigm Enterprise SSD 매출 비중·CSP 고객'
  },
  equipment:{label:'중국 장비 국산화',transmission:'LEADING_INDICATOR',samsung:'중국 경쟁사 수율·CAPA와 DRAM/NAND ASP',sk:'중국 경쟁사 수율·CAPA와 DRAM/NAND ASP'},
  lithography:{label:'중국 노광·계측 자립',transmission:'LEADING_INDICATOR',samsung:'중국 첨단공정 수율과 메모리 ASP',sk:'중국 첨단공정 수율과 메모리 ASP'},
  overseas:{label:'중국 메모리 해외 고객 확대',transmission:'STRUCTURAL_TO_EARNINGS',samsung:'중국 외 고객 점유율·DRAM/NAND ASP',sk:'중국 외 고객 점유율·DRAM/NAND ASP'}
};

export function buildImpact(risk,earnings){
  if(risk.status!=='PUBLISHED') return {version:'1.0',status:'WAITING_FOR_RISK_BRIEF'};
  const id=risk.attribution?.primaryDriver?.id;
  const map=DRIVER_MAP[id]??{
    label:risk.attribution?.primaryDriver?.name??'주요 리스크',
    transmission:'WATCH',
    samsung:'DS 영업이익·DRAM/NAND ASP·HBM 매출 비중',
    sk:'영업이익률·DRAM/NAND ASP·HBM 매출 비중'
  };
  const s=earnings.companies.samsung;
  const h=earnings.companies.skHynix;

  const lines=[
    `Risk Driver: ${map.label} · 전달경로 ${map.transmission}`,
    `삼성전자 기준선: ${earnings.quarter} DS 매출 ${s.dsRevenueT}조원 · 영업이익 ${s.dsOperatingProfitT}조원 · HBM4 판매 확대 ${s.hbm4SalesScaled?'확인':'미확인'}`,
    `SK하이닉스 기준선: ${earnings.quarter} 매출 ${h.revenueT}조원 · 영업이익 ${h.operatingProfitT}조원 · 영업이익률 ${h.operatingMarginPct}% · HBM4 양산출하 ${h.hbm4MassShipments?'확인':'미확인'}`,
    `다음 Earnings Check: 삼성전자 ${map.samsung} / SK하이닉스 ${map.sk}`
  ];

  const out={
    version:'1.0',
    status:'READY',
    generatedAt:new Date().toISOString(),
    riskQuarter:risk.quarter,
    earningsQuarter:earnings.quarter,
    primaryDriverId:id??null,
    primaryDriver:map.label,
    transmission:map.transmission,
    currentEarningsContext:{
      samsung:earnings.derived.samsung,
      skHynix:earnings.derived.skHynix
    },
    lines,
    companyChecks:{
      samsung:map.samsung,
      skHynix:map.sk
    },
    sources:{
      samsung:s.source,
      skHynix:h.source
    },
    disclaimer:'현재 실적 기준선과 Risk Driver의 전달경로를 연결한 모니터링 자료이며 매수·매도 판단 신호가 아닙니다.'
  };
  out.fingerprint=crypto.createHash('sha256').update(JSON.stringify({risk:risk.fingerprint,earnings:earnings.quarter,driver:id,checks:out.companyChecks})).digest('hex').slice(0,16);
  return out;
}

function selfTest(){
  const risk={status:'PUBLISHED',quarter:'2026Q4',fingerprint:'x',attribution:{primaryDriver:{id:'dramAsp',name:'DRAM ASP 압력'}}};
  const earnings={quarter:'2026Q2',companies:{samsung:{dsRevenueT:127.5,dsOperatingProfitT:89.2,hbm4SalesScaled:true,source:'s'},skHynix:{revenueT:79.3187,operatingProfitT:60.5426,operatingMarginPct:76,hbm4MassShipments:true,source:'h'}},derived:{samsung:{},skHynix:{}}};
  const out=buildImpact(risk,earnings);
  assert.equal(out.status,'READY');
  assert.equal(out.transmission,'DIRECT_EARNINGS');
  assert.equal(out.lines.length,4);
  assert.match(out.companyChecks.samsung,/DRAM ASP/);
  console.log('Earnings Impact Brief self-test PASS');
}
if(SELF_TEST){selfTest();process.exit(0);}
const out=buildImpact(read(RISK),read(EARNINGS));
write(OUTPUT,out);write(PUBLIC,out);
console.log(`Earnings Impact Brief: ${out.status}`);

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'public/images/research/curated');
fs.mkdirSync(outDir, { recursive: true });

const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const write = (name, body) => fs.writeFileSync(path.join(outDir, name), body, 'utf8');

const heroSpecs = {
  'ai-data-center-cooling-bottleneck': ['AI POWER · COOLING','AI 데이터센터의 마지막 병목','냉각','POWER → HEAT → COOLING','Rack Density','Thermal Limit'],
  'ai-power-gas-turbine-return': ['AI POWER · GENERATION','가스터빈이 다시 중요해진 이유','발전','AI LOAD → FAST POWER','Gas Turbine','Time-to-Power'],
  'ai-power-grid-transformer-distribution': ['AI POWER · GRID','전기는 만들어도 못 옮기면 끝이다','송전·변압','GENERATION → GRID → DC','Transformer','Grid Queue'],
  'ai-power-next-bottleneck': ['AI POWER · BOTTLENECK','GPU 다음 병목은 발전소다','전력','GPU → POWER BOTTLENECK','Power Demand','Physical Constraint'],
  'ai-power-value-chain-compare': ['AI POWER · VALUE CHAIN','같은 전력주가 아니다','밸류체인','GEN → GRID → TRANSFORM → DC','Margin','Bottleneck'],
  'bess-ups-bbu-data-center': ['AI POWER · RESILIENCE','AI 데이터센터는 끊기면 안 된다','백업전원','GRID → UPS/BESS → RACK','Reliability','Power Quality'],
  'doosan-enerbility-ai-power': ['AI POWER · GENERATION','두산에너빌리티','발전 CAPEX','AI DEMAND → POWER CAPEX','Turbine','Nuclear'],
  'hd-hyundai-electric-ai-power': ['AI POWER · EQUIPMENT','HD현대일렉트릭','전력기기','GRID CAPEX → TRANSFORMER','Lead Time','Margin'],
  'hyosung-heavy-industries-ai-power': ['AI POWER · HV GRID','효성중공업','초고압','HV GRID → GIS → TRANSFORMER','High Voltage','Grid Bottleneck'],
  'korea-ai-power-companies-compare': ['AI POWER · KOREA MAP','한국 AI 전력 4사 비교','기업 지도','GEN → HV → EQUIPMENT → DIST','Position','Cycle'],
  'ls-electric-ai-power': ['AI POWER · LAST MILE','LS ELECTRIC','배전·자동화','GRID → DISTRIBUTION → DC','Automation','Last Mile'],
  'samsung-electronics-outlook': ['SEMICONDUCTOR · SAMSUNG','삼성전자 투자 판단의 4축','HBM 실행력','HBM → EPS → FLOW → PRICE','EPS Revision','Foreign Flow'],
  'sk-hynix-outlook': ['SEMICONDUCTOR · SK HYNIX','SK하이닉스의 핵심은 HBM 레버리지','HBM','GPU DEMAND → HBM → PROFIT','HBM Mix','Cycle Leverage'],
  'what-is-hbm': ['SEMICONDUCTOR · HBM','HBM은 왜 AI의 핵심 메모리인가','대역폭','GPU ↔ HBM ↔ ADV. PACKAGING','Bandwidth','Yield'],
  'semiconductor-cycle': ['SEMICONDUCTOR · CYCLE','메모리 사이클은 가격보다 먼저 움직인다','사이클','INVENTORY → PRICE → EPS','Inventory','Revision']
};

function heroSvg(spec){
  const [eyebrow,title,focus,flow,left,right]=spec;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#06142d"/><stop offset="1" stop-color="#0b1f4d"/></linearGradient><radialGradient id="glow"><stop stop-color="#1677ff" stop-opacity=".65"/><stop offset="1" stop-color="#1677ff" stop-opacity="0"/></radialGradient></defs>
  <rect width="1600" height="900" fill="url(#bg)"/><circle cx="1290" cy="205" r="290" fill="url(#glow)" opacity=".45"/>
  <g font-family="Arial,'Noto Sans KR',sans-serif"><text x="110" y="130" fill="#7fb0ff" font-size="28" font-weight="700" letter-spacing="4">${esc(eyebrow)}</text>
  <text x="110" y="230" fill="#fff" font-size="62" font-weight="800">${esc(title)}</text>
  <rect x="110" y="300" width="390" height="84" rx="42" fill="#1677ff"/><text x="305" y="355" text-anchor="middle" fill="#fff" font-size="34" font-weight="800">${esc(focus)}</text>
  <text x="110" y="455" fill="#b7c8e7" font-size="30" font-weight="700">${esc(flow)}</text>
  <g transform="translate(110 555)"><rect width="360" height="150" rx="24" fill="#10295f" stroke="#2d80ff"/><text x="30" y="55" fill="#8fb7ff" font-size="22">KEY SIGNAL 01</text><text x="30" y="105" fill="#fff" font-size="34" font-weight="800">${esc(left)}</text></g>
  <g transform="translate(500 555)"><rect width="360" height="150" rx="24" fill="#10295f" stroke="#2d80ff"/><text x="30" y="55" fill="#8fb7ff" font-size="22">KEY SIGNAL 02</text><text x="30" y="105" fill="#fff" font-size="34" font-weight="800">${esc(right)}</text></g>
  <g transform="translate(1040 350)" opacity=".95"><path d="M0 270 C100 80 170 360 260 150 S430 40 500 190" fill="none" stroke="#5aa2ff" stroke-width="12"/><line x1="0" y1="360" x2="500" y2="360" stroke="#34558c" stroke-width="3"/><line x1="0" y1="20" x2="0" y2="360" stroke="#34558c" stroke-width="3"/><circle cx="500" cy="190" r="16" fill="#fff"/><circle cx="500" cy="190" r="34" fill="#1677ff" opacity=".3"/></g>
  <text x="110" y="820" fill="#7289b1" font-size="22">JOYLAB RESEARCH · 생각을 분석하고, 분석을 실행으로.</text></g></svg>`;
}

for (const [id,spec] of Object.entries(heroSpecs)) write(`${id}-hero.svg`, heroSvg(spec));

write('ai-power-bottleneck-map.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#08172f"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="110" y="130" fill="#74a7ff" font-size="28" font-weight="700" letter-spacing="4">JOYLAB · BOTTLENECK MAP</text><text x="110" y="215" fill="#fff" font-size="58" font-weight="800">AI 전력의 병목은 한 곳에 머물지 않는다</text><g transform="translate(130 360)"><path d="M0 250 C170 60 320 340 500 130 S820 350 990 110 S1200 80 1320 180" fill="none" stroke="#1677ff" stroke-width="18"/><g fill="#fff" font-size="25" font-weight="700"><text x="0" y="330">발전</text><text x="290" y="330">송전</text><text x="560" y="330">변압</text><text x="820" y="330">배전</text><text x="1060" y="330">냉각</text></g><g fill="#6ee7b7"><circle cx="500" cy="130" r="18"/><circle cx="990" cy="110" r="18"/></g></g><text x="110" y="760" fill="#fff" font-size="31" font-weight="700">투자 판단: 현재 병목 + 다음 병목 + 해소 속도</text><text x="110" y="820" fill="#7f93b6" font-size="23">병목이 해소되면 초과이익도 이동한다.</text></g></svg>`);

write('semiconductor-ai-memory-stack.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#07152f"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="110" y="130" fill="#74a7ff" font-size="28" font-weight="700" letter-spacing="4">JOYLAB · AI MEMORY STACK</text><text x="110" y="215" fill="#fff" font-size="58" font-weight="800">AI 수요가 메모리 이익으로 전환되는 경로</text><g transform="translate(120 360)"><g><rect width="270" height="180" rx="26" fill="#10295f" stroke="#1677ff"/><text x="135" y="78" text-anchor="middle" fill="#fff" font-size="34" font-weight="800">GPU Demand</text><text x="135" y="125" text-anchor="middle" fill="#9bbdff" font-size="23">Accelerator CAPEX</text></g><g transform="translate(310)"><rect width="270" height="180" rx="26" fill="#10295f" stroke="#1677ff"/><text x="135" y="78" text-anchor="middle" fill="#fff" font-size="34" font-weight="800">HBM</text><text x="135" y="125" text-anchor="middle" fill="#9bbdff" font-size="23">Mix · ASP · Yield</text></g><g transform="translate(620)"><rect width="270" height="180" rx="26" fill="#10295f" stroke="#1677ff"/><text x="135" y="78" text-anchor="middle" fill="#fff" font-size="34" font-weight="800">Packaging</text><text x="135" y="125" text-anchor="middle" fill="#9bbdff" font-size="23">Advanced Package</text></g><g transform="translate(930)"><rect width="270" height="180" rx="26" fill="#15346f" stroke="#5aa2ff"/><text x="135" y="78" text-anchor="middle" fill="#fff" font-size="34" font-weight="800">EPS Revision</text><text x="135" y="125" text-anchor="middle" fill="#9bbdff" font-size="23">Earnings Power</text></g><path d="M270 90H310M580 90H620M890 90H930" stroke="#5aa2ff" stroke-width="10"/></g><text x="110" y="700" fill="#fff" font-size="31" font-weight="700">핵심: 기술 발표가 아니라 인증·수율·물량이 이익으로 연결되는지 확인한다.</text></g></svg>`);

write('semiconductor-company-compare.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#08172f"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="110" y="130" fill="#74a7ff" font-size="28" font-weight="700" letter-spacing="4">JOYLAB · MEMORY COMPANY MAP</text><text x="110" y="215" fill="#fff" font-size="58" font-weight="800">삼성전자 vs SK하이닉스, 무엇이 다른가</text><g transform="translate(160 330)"><rect width="560" height="330" rx="34" fill="#10295f" stroke="#2d80ff"/><text x="45" y="75" fill="#fff" font-size="42" font-weight="800">삼성전자</text><text x="45" y="140" fill="#9bbdff" font-size="26">다각화 · DRAM/NAND · HBM 실행력</text><text x="45" y="205" fill="#fff" font-size="29" font-weight="700">관찰: HBM 인증 → Mix → EPS Revision</text><text x="45" y="270" fill="#6ee7b7" font-size="28" font-weight="800">BALANCED LEVERAGE</text></g><g transform="translate(880 330)"><rect width="560" height="330" rx="34" fill="#15346f" stroke="#5aa2ff" stroke-width="2"/><text x="45" y="75" fill="#fff" font-size="42" font-weight="800">SK하이닉스</text><text x="45" y="140" fill="#9bbdff" font-size="26">HBM 집중 · AI 메모리 · 사이클 민감도</text><text x="45" y="205" fill="#fff" font-size="29" font-weight="700">관찰: HBM 출하 → ASP → Margin</text><text x="45" y="270" fill="#6ee7b7" font-size="28" font-weight="800">AI MEMORY LEVERAGE</text></g></g></svg>`);

write('semiconductor-cycle-signal.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#07152f"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="110" y="130" fill="#74a7ff" font-size="28" font-weight="700" letter-spacing="4">JOYLAB · SEMICONDUCTOR CYCLE</text><text x="110" y="215" fill="#fff" font-size="58" font-weight="800">가격보다 먼저 보는 5개의 선행 신호</text><g transform="translate(105 350)" font-size="25" font-weight="700"><g fill="#10295f" stroke="#1677ff"><rect width="250" height="170" rx="26"/><rect x="280" width="250" height="170" rx="26"/><rect x="560" width="250" height="170" rx="26"/><rect x="840" width="250" height="170" rx="26"/><rect x="1120" width="250" height="170" rx="26"/></g><g fill="#fff" text-anchor="middle"><text x="125" y="75">재고</text><text x="405" y="75">가격</text><text x="685" y="75">가동률</text><text x="965" y="75">CAPEX</text><text x="1245" y="75">EPS Revision</text></g><g fill="#8fb7ff" text-anchor="middle" font-size="20"><text x="125" y="120">Inventory</text><text x="405" y="120">ASP</text><text x="685" y="120">Utilization</text><text x="965" y="120">Supply</text><text x="1245" y="120">Earnings</text></g><path d="M250 85H280M530 85H560M810 85H840M1090 85H1120" stroke="#5aa2ff" stroke-width="9"/></g><text x="110" y="700" fill="#fff" font-size="31" font-weight="700">사이클의 전환점은 모든 지표가 동시에 좋아질 때가 아니라, 선행지표의 방향이 먼저 바뀔 때다.</text></g></svg>`);

console.log(`Generated ${Object.keys(heroSpecs).length + 4} curated research visuals.`);

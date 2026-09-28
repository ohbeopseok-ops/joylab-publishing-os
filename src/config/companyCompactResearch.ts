import samsungCompactGraph from '../../config/research-graph-samsung-compact-v1.json';
import skHynixCompactGraph from '../../config/research-graph-sk-hynix-compact-v1.json';
import kbFinancialCompactGraph from '../../config/research-graph-kb-financial-compact-v1.json';
import hdHyundaiHeavyCompactGraph from '../../config/research-graph-hd-hyundai-heavy-compact-v1.json';
import hanwhaOceanCompactGraph from '../../config/research-graph-hanwha-ocean-compact-v1.json';
import samsungHeavyCompactGraph from '../../config/research-graph-samsung-heavy-compact-v1.json';
import hdKsoeCompactGraph from '../../config/research-graph-hd-ksoe-compact-v1.json';
import doosanEnerbilityCompactGraph from '../../config/research-graph-doosan-enerbility-compact-v1.json';
import hyosungHeavyCompactGraph from '../../config/research-graph-hyosung-heavy-compact-v1.json';
import hdHyundaiElectricCompactGraph from '../../config/research-graph-hd-hyundai-electric-compact-v1.json';
import lsElectricCompactGraph from '../../config/research-graph-ls-electric-compact-v1.json';

export const companyCompactResearch = {
  'samsung-electronics-outlook': {
    graph: samsungCompactGraph,
    eyebrow: 'SAMSUNG ELECTRONICS · COMPACT THESIS',
    title: 'AI Memory Demand → Memory Mix → Margin / EPS Revision → Valuation',
    description: '삼성전자 투자 논리를 네 단계로 압축합니다. Memory Mix를 선택하면 HBM·DRAM·NAND 세부 신호를 펼쳐볼 수 있습니다.',
    hubHref: '/guides/semiconductor-investing',
    hubLabel: '전체 Semiconductor Graph →',
    primaryFlow: ['ai-memory-demand','memory-mix','eps-revision','forward-per']
  },
  'sk-hynix-outlook': {
    graph: skHynixCompactGraph,
    eyebrow: 'SK HYNIX · COMPACT THESIS',
    title: 'AI Memory Demand → HBM Execution → Margin / FCF → Valuation',
    description: 'SK하이닉스 투자 논리를 네 단계로 압축합니다. HBM Execution을 선택하면 HBM4·장기계약·CAPEX 세부 신호를 펼쳐볼 수 있습니다.',
    hubHref: '/guides/semiconductor-investing',
    hubLabel: '전체 Semiconductor Graph →',
    primaryFlow: ['ai-memory-demand','hbm-execution','margin-fcf','valuation']
  },
  'kb-financial-shareholder-return': {
    graph: kbFinancialCompactGraph,
    eyebrow: 'KB FINANCIAL · COMPACT THESIS',
    title: 'Profitability / ROE → CET1 / Capital Buffer → Shareholder Return → PBR Re-rating',
    description: 'KB금융의 주주환원 논리를 네 단계로 압축합니다. 각 노드를 선택하면 ROE·CET1·배당·자사주 소각 같은 핵심 신호를 확인할 수 있습니다.',
    hubHref: '/guides/financials-value-up',
    hubLabel: '전체 Financials Graph →',
    primaryFlow: ['profitability','capital-buffer','shareholder-return','pbr-rerating']
  },
  'hd-hyundai-heavy-industries-shipbuilding': {
    graph: hdHyundaiHeavyCompactGraph,
    eyebrow: 'HD HYUNDAI HEAVY INDUSTRIES · COMPACT THESIS',
    title: 'Order Quality → Ship / Defense / Engine Mix → Margin / Productivity → Valuation',
    description: 'HD현대중공업의 수주 질이 고부가 선종·함정·엔진 믹스와 생산성을 거쳐 마진으로 전환되는지 봅니다.',
    hubHref: '/guides/shipbuilding',
    hubLabel: '전체 Shipbuilding Graph →',
    primaryFlow: ['order-quality','portfolio-mix','margin','valuation']
  },
  'hanwha-ocean-shipbuilding': {
    graph: hanwhaOceanCompactGraph,
    eyebrow: 'HANWHA OCEAN · COMPACT THESIS',
    title: 'Orderbook Quality → LNG / Special Ship Mix → Margin → Valuation',
    description: '한화오션의 LNG선·특수선·해양 수주가 반복 가능한 상선 마진과 방산 옵션으로 이어지는지 봅니다.',
    hubHref: '/guides/shipbuilding',
    hubLabel: '전체 Shipbuilding Graph →',
    primaryFlow: ['orderbook-quality','mix','margin','valuation']
  },
  'samsung-heavy-industries-shipbuilding': {
    graph: samsungHeavyCompactGraph,
    eyebrow: 'SAMSUNG HEAVY INDUSTRIES · COMPACT THESIS',
    title: 'LNG / FLNG Demand → Project Mix → Productivity / Margin → Valuation',
    description: '삼성중공업의 LNG·FLNG 고부가 수주와 스마트야드 생산성이 실제 마진으로 전환되는지 봅니다.',
    hubHref: '/guides/shipbuilding',
    hubLabel: '전체 Shipbuilding Graph →',
    primaryFlow: ['lng-flng-demand','project-mix','productivity-margin','valuation']
  },
  'hd-ksoe-shipbuilding': {
    graph: hdKsoeCompactGraph,
    eyebrow: 'HD KSOE · COMPACT THESIS',
    title: 'Group Orderbook → Subsidiary Earnings Mix → Group OPM / Capital Allocation → Holding Discount',
    description: 'HD한국조선해양을 자회사 수주와 이익 믹스, 자본배분, 지주 할인까지 한 흐름으로 봅니다.',
    hubHref: '/guides/shipbuilding',
    hubLabel: '전체 Shipbuilding Graph →',
    primaryFlow: ['group-orderbook','subsidiary-earnings','group-opm','holding-discount']
  },
  'doosan-enerbility-ai-power': {
    graph: doosanEnerbilityCompactGraph,
    eyebrow: 'DOOSAN ENERBILITY · COMPACT THESIS',
    title: 'AI Power Demand → Generation Mix → Service / Margin → Valuation',
    description: '두산에너빌리티의 AI 전력 수요가 가스터빈·원전·서비스 매출과 마진으로 전환되는지 봅니다.',
    hubHref: '/guides/ai-power-infrastructure',
    hubLabel: '전체 AI Power Graph →',
    primaryFlow: ['ai-power-demand','generation-mix','service-margin','valuation']
  },
  'hyosung-heavy-industries-ai-power': {
    graph: hyosungHeavyCompactGraph,
    eyebrow: 'HYOSUNG HEAVY INDUSTRIES · COMPACT THESIS',
    title: 'Grid Bottleneck → US Orderbook → Capacity / Margin → Valuation',
    description: '효성중공업의 북미 전력망 병목이 초고압 변압기 수주잔고와 증설, 고마진 매출로 이어지는지 봅니다.',
    hubHref: '/guides/ai-power-infrastructure',
    hubLabel: '전체 AI Power Graph →',
    primaryFlow: ['grid-bottleneck','orderbook','capacity-margin','valuation']
  },
  'hd-hyundai-electric-ai-power': {
    graph: hdHyundaiElectricCompactGraph,
    eyebrow: 'HD HYUNDAI ELECTRIC · COMPACT THESIS',
    title: 'North America Grid Demand → Transformer / Distribution Mix → Margin → Valuation',
    description: 'HD현대일렉트릭의 북미 초고압 변압기와 데이터센터 배전 수요가 높은 마진으로 지속되는지 봅니다.',
    hubHref: '/guides/ai-power-infrastructure',
    hubLabel: '전체 AI Power Graph →',
    primaryFlow: ['north-america-demand','product-mix','margin','valuation']
  },
  'ls-electric-ai-power': {
    graph: lsElectricCompactGraph,
    eyebrow: 'LS ELECTRIC · COMPACT THESIS',
    title: 'Data Center Power Demand → Distribution / Transformer Mix → Power Margin → Valuation',
    description: 'LS ELECTRIC의 데이터센터 내부 배전과 변압기 증설이 반복 수주와 전력사업 마진으로 이어지는지 봅니다.',
    hubHref: '/guides/ai-power-infrastructure',
    hubLabel: '전체 AI Power Graph →',
    primaryFlow: ['data-center-power','power-mix','margin','valuation']
  }
} as const;

export function getCompanyCompactResearch(articleId: string) {
  return companyCompactResearch[articleId as keyof typeof companyCompactResearch] ?? null;
}

import graph from '../../config/investment-research-graph-v2.json';

export type InvestmentGraphEdge = (typeof graph.edges)[number];

export function getCompanyGraph(companyId: string) {
  const company = graph.companies.find((item) => item.id === companyId);
  const edges = graph.edges.filter((edge) => edge.from === companyId);
  const kpiIds = edges.filter((edge) => edge.type === 'company-to-kpi').map((edge) => edge.to);
  const valueChainIds = edges.filter((edge) => edge.type === 'company-to-value-chain').map((edge) => edge.to);
  return {
    company,
    kpis: graph.kpis.filter((item) => kpiIds.includes(item.id)),
    valueChains: graph.valueChains.filter((item) => valueChainIds.includes(item.id)),
    edges
  };
}

export function getCompaniesByKpi(kpiId: string) {
  const ids = graph.edges
    .filter((edge) => edge.type === 'company-to-kpi' && edge.to === kpiId)
    .map((edge) => edge.from);
  return graph.companies.filter((item) => ids.includes(item.id));
}

export function getCompaniesByValueChain(valueChainId: string) {
  const ids = graph.edges
    .filter((edge) => edge.type === 'company-to-value-chain' && edge.to === valueChainId)
    .map((edge) => edge.from);
  return graph.companies.filter((item) => ids.includes(item.id));
}

export { graph };

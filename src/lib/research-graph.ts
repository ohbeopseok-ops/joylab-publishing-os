export const RESEARCH_NODE_TYPES = [
  'pillar','macro','sector','demand','value_chain','bottleneck','company','kpi','earnings','valuation','article'
] as const;

export const RESEARCH_EDGE_TYPES = [
  'affects','drives','requires','supplies','constrains','measured_by','drives_earnings','valued_by','covered_by','previous','next','belongs_to'
] as const;

export type ResearchNodeType = typeof RESEARCH_NODE_TYPES[number];
export type ResearchEdgeType = typeof RESEARCH_EDGE_TYPES[number];
export type ResearchStage = 'macro'|'sector'|'value_chain'|'bottleneck'|'company'|'earnings'|'valuation';

export interface ResearchPillar {
  id: string;
  title: string;
  url: string;
  domain: 'investing';
  status: 'draft'|'published'|'archived';
}

export interface ResearchNode {
  id: string;
  type: ResearchNodeType;
  label: string;
  ticker?: string;
  market?: string;
  articleUrl?: string;
  stage?: string;
  description?: string;
}

export interface ResearchEdge {
  from: string;
  to: string;
  type: ResearchEdgeType;
  weight?: number;
  label?: string;
}

export interface ResearchArticle {
  id: string;
  title: string;
  url: string;
  order?: number;
  pillar: string;
  topics: string[];
  stage: ResearchStage;
  previous?: string|null;
  next?: string|null;
  status: 'draft'|'published'|'archived';
}

export interface ResearchGraph {
  contract: 'JoyLab.ResearchGraph';
  version: string;
  pillar: ResearchPillar;
  nodes: ResearchNode[];
  edges: ResearchEdge[];
  articles: ResearchArticle[];
}

export function getNodeMap(graph: ResearchGraph) {
  return new Map(graph.nodes.map((node) => [node.id, node] as const));
}

export function getRelatedArticles(graph: ResearchGraph, articleId: string, limit = 3) {
  const current = graph.articles.find((article) => article.id === articleId);
  if (!current) return [];
  const topics = new Set(current.topics);
  return graph.articles
    .filter((article) => article.id !== articleId && article.status === 'published')
    .map((article) => ({
      ...article,
      score: article.topics.filter((topic) => topics.has(topic)).length
    }))
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score || (a.order ?? 999) - (b.order ?? 999))
    .slice(0, limit);
}

export const RESEARCH_GRAPH_CONTRACT = 'JoyLab.ResearchGraph' as const;

export const researchNodeTypes = [
  'pillar',
  'macro',
  'sector',
  'demand',
  'value_chain',
  'bottleneck',
  'company',
  'kpi',
  'earnings',
  'valuation',
  'article'
] as const;

export const researchEdgeTypes = [
  'affects',
  'drives',
  'requires',
  'supplies',
  'constrains',
  'measured_by',
  'drives_earnings',
  'valued_by',
  'covered_by',
  'previous',
  'next',
  'belongs_to'
] as const;

export const researchArticleStages = [
  'macro',
  'sector',
  'value_chain',
  'bottleneck',
  'company',
  'earnings',
  'valuation'
] as const;

export type ResearchNodeType = (typeof researchNodeTypes)[number];
export type ResearchEdgeType = (typeof researchEdgeTypes)[number];
export type ResearchArticleStage = (typeof researchArticleStages)[number];
export type ResearchStatus = 'draft' | 'published' | 'archived';

export interface ResearchPillar {
  id: string;
  title: string;
  url: string;
  domain: 'investing';
  status: ResearchStatus;
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
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ResearchEdge {
  from: string;
  to: string;
  type: ResearchEdgeType;
  label?: string;
  weight?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ResearchArticle {
  id: string;
  title: string;
  url: string;
  order?: number;
  pillar: string;
  topics: string[];
  stage: ResearchArticleStage;
  previous?: string | null;
  next?: string | null;
  status: ResearchStatus;
  publishedAt?: string;
  updatedAt?: string;
}

export interface ResearchGraph {
  contract: typeof RESEARCH_GRAPH_CONTRACT;
  version: string;
  pillar: ResearchPillar;
  nodes: ResearchNode[];
  edges: ResearchEdge[];
  articles: ResearchArticle[];
}

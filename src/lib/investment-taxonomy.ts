import { z } from 'astro/zod';

export const investmentIndustryIds = [
  'semiconductor',
  'ai-infrastructure',
  'shipbuilding-defense',
  'mobility-robotics',
  'financials-value-up',
  'energy-nuclear'
] as const;

export const investmentThesisIds = [
  'ai-capex',
  'memory-supercycle',
  'power-supercycle',
  'physical-ai',
  'defense-geopolitics',
  'korea-value-up',
  'macro-liquidity'
] as const;

export const investmentResearchTypes = [
  'pillar',
  'company',
  'compare',
  'scenario',
  'macro',
  'explainer'
] as const;

export const investmentTaxonomySchema = z.object({
  investmentIndustries: z.array(z.enum(investmentIndustryIds)).default([]),
  investmentTheses: z.array(z.enum(investmentThesisIds)).default([]),
  investmentCompanies: z.array(z.string().min(1)).default([]),
  investmentValueChains: z.array(z.string().min(1)).default([]),
  investmentResearchType: z.enum(investmentResearchTypes).optional()
});

export type InvestmentIndustryId = (typeof investmentIndustryIds)[number];
export type InvestmentThesisId = (typeof investmentThesisIds)[number];
export type InvestmentResearchType = (typeof investmentResearchTypes)[number];
export type InvestmentTaxonomy = z.infer<typeof investmentTaxonomySchema>;

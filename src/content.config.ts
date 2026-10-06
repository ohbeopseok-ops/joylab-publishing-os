import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { investmentIndustryIds, investmentThesisIds, investmentResearchTypes } from './lib/investment-taxonomy';


const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cardTitle: z.string().optional(),
    cardDescription: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    featuredAt: z.coerce.date().optional(),
    dateCorrectionReason: z.string().min(3).optional(),
    identityChangeReason: z.string().min(3).optional(),
    author: z.string().default('JoyLab'),
    authorBio: z.string().optional(),
    researchMethod: z.string().optional(),
    sourceList: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).max(30).optional(),
    riskFactors: z.array(z.string().min(1)).max(12).optional(),
    counterScenarios: z.array(z.string().min(1)).max(12).optional(),
    featured: z.boolean().default(false),
    homeFeatured: z.boolean().default(false),
    homePriority: z.number().int().min(1).max(999).optional(),
    excludeFromLatest: z.boolean().default(false),
    draft: z.boolean().default(false),
    seoTitle: z.string().optional(),
    canonical: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().int().min(1).max(999).optional(),
    investmentIndustries: z.array(z.enum(investmentIndustryIds)).default([]),
    investmentTheses: z.array(z.enum(investmentThesisIds)).default([]),
    investmentCompanies: z.array(z.string().min(1)).default([]),
    investmentValueChains: z.array(z.string().min(1)).default([]),
    investmentKpis: z.array(z.string().min(1)).default([]),
    investmentResearchType: z.enum(investmentResearchTypes).optional(),
    readingTime: z.string().optional(),

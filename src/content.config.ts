import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
    author: z.string().default('JoyLab'),
    featured: z.boolean().default(false),
    homeFeatured: z.boolean().default(false),
    homePriority: z.number().int().min(1).max(999).optional(),
    excludeFromLatest: z.boolean().default(false),
    draft: z.boolean().default(false),
    seoTitle: z.string().optional(),
    canonical: z.string().optional(),
    series: z.string().optional(),
    readingTime: z.string().optional(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    ogImage: z.string().optional()
  }).superRefine((data, ctx) => {
    if (data.homePriority !== undefined && !data.homeFeatured) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['homePriority'],
        message: 'homePriority requires homeFeatured: true'
      });
    }
  })
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/books' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    author: z.string().default('오법석'),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    coverImage: z.string().optional(),
    ogImage: z.string().optional(),
    heroQuote: z.string().optional(),
    landingHeading: z.string(),
    readerProfiles: z.array(z.string()).min(1),
    category: z.string().default('성장·리더십'),
    tags: z.array(z.string()).default([]),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    format: z.enum(['web', 'epub', 'pdf']).default('web'),
    access: z.enum(['preview', 'full']).default('preview'),
    previewChapterCount: z.number().int().min(0).default(1),
    canonical: z.string().optional(),
    readerPath: z.string().optional(),
    readerCta: z.string().optional(),
    mindmapPath: z.string().optional(),
    relatedResearchSlugs: z.array(z.string()).max(6).optional(),
    overline: z.string().optional(),
    topics: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    tocItems: z.array(z.string()).optional(),
    closingQuote: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

const bookChapters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/book-chapters' }),
  schema: z.object({
    bookSlug: z.string(),
    order: z.number().int().min(0),
    part: z.string().optional(),
    title: z.string(),
    label: z.string().optional(),
    preview: z.boolean().default(false)
  })
});

export const collections = { articles, books, bookChapters };

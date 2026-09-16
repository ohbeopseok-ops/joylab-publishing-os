import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const videoSchema = z.object({
  status: z.enum(['planned', 'review', 'published']),
  title: z.string(),
  description: z.string(),
  sourcePack: z.string().optional(),
  language: z.string().default('ko-KR'),
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
  thumbnailUrl: z.string().optional(),
  uploadDate: z.coerce.date().optional(),
  duration: z.string().regex(/^PT/).optional()
});

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
    ogImage: z.string().optional(),
    video: videoSchema.optional()
  }).superRefine((data, ctx) => {
    if (data.homePriority !== undefined && !data.homeFeatured) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['homePriority'],
        message: 'homePriority requires homeFeatured: true'
      });
    }

    if (data.video?.status === 'published') {
      for (const field of ['youtubeId', 'thumbnailUrl', 'uploadDate', 'duration']) {
        if (!data.video[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['video', field],
            message: `video.${field} is required when video.status is published`
          });
        }
      }
    }
  })
});

export const collections = { articles };

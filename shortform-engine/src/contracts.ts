import {z} from 'zod';

const sceneSchema = z.object({
  id: z.string(),
  start: z.number().nonnegative(),
  end: z.number().positive(),
  type: z.enum([
    'kinetic-title',
    'comparison',
    'node-network',
    'workflow',
    'brand-end'
  ]),
  narration: z.string(),
  headline: z.string(),
  subtext: z.string().optional(),
  assetQuery: z.string().nullable().optional()
}).refine((scene) => scene.end > scene.start, {
  message: 'scene.end must be greater than scene.start'
});

export const shortformSchema = z.object({
  contractVersion: z.literal('1.0'),
  projectId: z.string(),
  source: z.object({
    type: z.literal('article'),
    title: z.string(),
    url: z.string().nullable(),
    language: z.string()
  }),
  variant: z.object({
    id: z.string(),
    angle: z.enum(['hook', 'explain', 'insight']),
    targetDuration: z.number().positive()
  }),
  brand: z.object({
    name: z.literal('JOYLAB'),
    theme: z.literal('deep-navy-electric-blue'),
    tagline: z.string()
  }),
  output: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
    format: z.literal('mp4')
  }),
  narration: z.object({
    provider: z.string(),
    language: z.string(),
    rate: z.number().positive()
  }),
  captions: z.object({
    enabled: z.boolean(),
    mode: z.enum(['phrase', 'word']),
    safeZone: z.boolean(),
    highlightKeywords: z.boolean()
  }),
  scenes: z.array(sceneSchema).min(1),
  cta: z.object({
    text: z.string(),
    duration: z.number().nonnegative()
  }),
  provenance: z.object({
    sources: z.array(z.string()),
    assets: z.array(z.string())
  })
}).superRefine((value, ctx) => {
  const maxEnd = Math.max(...value.scenes.map((scene) => scene.end));
  if (maxEnd > value.variant.targetDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scenes'],
      message: 'scene timeline exceeds targetDuration'
    });
  }
});

export type ShortformProject = z.infer<typeof shortformSchema>;
export type ShortformScene = ShortformProject['scenes'][number];

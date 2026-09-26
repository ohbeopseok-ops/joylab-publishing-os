import { z } from 'astro/zod';

const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  score: z.number().optional()
});

const assessmentQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['singleChoice', 'text']),
  required: z.boolean().default(true),
  options: z.array(optionSchema).optional(),
  placeholder: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.kind === 'singleChoice' && (!data.options || data.options.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options'],
      message: 'singleChoice question requires at least two options'
    });
  }
});

const baseBlockSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  chapterId: z.string().regex(/^chapter-[0-9]{2}$/),
  title: z.string().min(1),
  prompt: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().default(false),
  saveResponse: z.boolean().default(true),
  version: z.literal(1)
});

export const selfAssessmentBlockSchema = baseBlockSchema.extend({
  type: z.literal('self_assessment'),
  questions: z.array(assessmentQuestionSchema).min(1),
  resultBands: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    min: z.number(),
    max: z.number(),
    message: z.string().min(1)
  })).min(1)
});

export const riskScoreBlockSchema = baseBlockSchema.extend({
  type: z.literal('risk_score'),
  scale: z.object({
    min: z.number().int(),
    max: z.number().int(),
    step: z.number().positive().default(1)
  }),
  items: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    weight: z.number().positive().default(1)
  })).min(1),
  thresholds: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    min: z.number(),
    max: z.number(),
    message: z.string().min(1)
  })).min(1)
});

export const personaCanvasBlockSchema = baseBlockSchema.extend({
  type: z.literal('persona_canvas'),
  fields: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    placeholder: z.string().optional(),
    required: z.boolean().default(true),
    maxLength: z.number().int().positive().max(1000).default(300)
  })).min(3)
});

export const interactiveBlockSchema = z.discriminatedUnion('type', [
  selfAssessmentBlockSchema,
  riskScoreBlockSchema,
  personaCanvasBlockSchema
]);

export const interactiveBookContractSchema = z.object({
  contract: z.literal('JoyLab Interactive Block Contract V1'),
  bookSlug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  storageKey: z.string().regex(/^joylab-[a-z0-9-]+-workbook-v[0-9]+$/),
  privacy: z.object({
    storage: z.literal('localStorage'),
    sendResponsesToServer: z.literal(false),
    piiWarning: z.string().min(1)
  }),
  blocks: z.array(interactiveBlockSchema).min(1)
}).superRefine((data, ctx) => {
  const ids = data.blocks.map((block) => block.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['blocks'],
      message: 'interactive block ids must be unique'
    });
  }
});

export type InteractiveBlock = z.infer<typeof interactiveBlockSchema>;
export type InteractiveBookContract = z.infer<typeof interactiveBookContractSchema>;

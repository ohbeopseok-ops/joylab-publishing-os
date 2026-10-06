import { z } from 'astro/zod';

export const contentTypes = ['investment-analysis', 'concept-explainer', 'comparison', 'industry-trend', 'practical-playbook'];
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
const text = z.string().trim().min(1);
export const articleTrustSchema = z.object({
  author: text,
  authorPerspective: text,
  humanReviewed: z.boolean().default(false),
  reviewedBy: text.nullable().optional(),
  reviewedAt: date.nullable().optional(),
  reviewScope: z.array(text).default([]),
  researchedAt: date.optional(),
  methodology: z.array(text).min(1),
  primarySources: z.array(z.object({
    id: text, title: text, publisher: text,
    url: z.string().url().refine(value => /^https?:\/\//.test(value), 'HTTP(S) source required'),
    publishedAt: date.nullable().optional(), accessedAt: date,
    supports: z.array(text).min(1)
  })).default([]),
  fieldEvidence: z.array(z.object({ sectionId: text, description: text })).default([]),
  originalValue: z.array(z.object({
    kind: z.enum(['analysis', 'calculation', 'comparison', 'framework', 'scenario', 'checklist', 'decision-tree', 'field-case', 'data-reconstruction', 'template']),
    sectionId: text, description: text
  })).min(1),
  counterEvidenceSections: z.array(text).default([]),
  counterEvidenceNotApplicableReason: text.optional(),
  conclusionSection: text,
  updateLog: z.array(z.object({ date, change: text })).default([])
}).superRefine((data, ctx) => {
  if (data.humanReviewed && (!data.reviewedBy || !data.reviewedAt || !data.reviewScope.length)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['humanReviewed'], message: 'Human review requires reviewer, date and scope' });
  }
});

export const visualTitles = {
  'investment-analysis': '수치와 분석 자료',
  'concept-explainer': '개념 이해 자료',
  comparison: '비교 자료',
  'industry-trend': '산업 구조 자료',
  'practical-playbook': '실행 참고 자료'
};

// Validate declared evidence locations; semantic/source accuracy still needs editorial review.
export function validateArticleArchitecture(data, body, sectionIds) {
  const errors = [];
  if (!contentTypes.includes(data.contentType)) errors.push('contentType: one of the five architectures is required');
  if (!data.contentQuestion?.trim()) errors.push('contentQuestion: reader question is required');
  const result = articleTrustSchema.safeParse(data.trust);
  if (!result.success) return [...errors, ...result.error.issues.map(issue => `trust.${issue.path.join('.')}: ${issue.message}`)];
  const trust = result.data;
  if (trust.author !== data.author) errors.push('trust.author must match the visible/SEO author');
  const investment = data.contentType === 'investment-analysis';
  if ((data.timeSensitive || investment) && !trust.researchedAt) errors.push('research date required');
  if ((data.timeSensitive || investment) && !trust.updateLog.length) errors.push('update log required');
  if (!trust.primarySources.length && !(data.contentType === 'practical-playbook' && trust.fieldEvidence.length)) errors.push('primary sources required (field-only playbooks must declare actual field evidence)');
  if (!trust.counterEvidenceSections.length && !(data.contentType === 'concept-explainer' && trust.counterEvidenceNotApplicableReason)) errors.push('counter evidence/applicability section required');
  const references = [trust.conclusionSection, ...trust.counterEvidenceSections,
    ...trust.originalValue.map(item => item.sectionId), ...trust.fieldEvidence.map(item => item.sectionId),
    ...trust.primarySources.flatMap(item => item.supports)];
  for (const id of new Set(references)) if (!sectionIds.has(id)) errors.push(`missing evidence section: ${id}`);
  for (const source of trust.primarySources) if (!body.includes(source.url)) errors.push(`source not connected in body: ${source.id}`);
  if (new Set(trust.primarySources.map(item => item.id)).size !== trust.primarySources.length) errors.push('duplicate source IDs');
  return errors;
}

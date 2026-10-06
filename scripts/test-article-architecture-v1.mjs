import assert from 'node:assert/strict';
import { validateArticleArchitecture, articleTrustSchema } from '../src/lib/article-architecture.mjs';

const sections = new Set(['calculation', 'limitations', 'conclusion']);
const body = 'https://example.com/report';
const data = { author: 'JoyLab', contentType: 'investment-analysis', contentQuestion: 'What changes value?', timeSensitive: true,
  trust: { author: 'JoyLab', authorPerspective: 'Cash flow', humanReviewed: false, researchedAt: '2026-10-06',
    methodology: ['Compare official reports'], primarySources: [{ id: 'report', title: 'Report', publisher: 'Issuer', url: body, accessedAt: '2026-10-06', supports: ['calculation'] }],
    originalValue: [{ kind: 'calculation', sectionId: 'calculation', description: 'Recalculate cash flow' }],
    counterEvidenceSections: ['limitations'], conclusionSection: 'conclusion', updateLog: [{ date: '2026-10-06', change: 'Initial analysis' }] } };
assert.deepEqual(validateArticleArchitecture(data, body, sections), []);
assert(!articleTrustSchema.safeParse({ ...data.trust, humanReviewed: true }).success, 'Unverified human review must fail');
assert(!articleTrustSchema.safeParse({ ...data.trust, researchedAt: '2026-02-30' }).success, 'Impossible dates must fail');
assert(validateArticleArchitecture(data, '', sections).some(error => error.includes('source not connected')));
assert(validateArticleArchitecture(data, body, new Set(['conclusion'])).some(error => error.includes('missing evidence section')));
assert(validateArticleArchitecture({ ...data, trust: { ...data.trust, primarySources: [] } }, body, sections).length);
assert(validateArticleArchitecture({ ...data, trust: { ...data.trust, counterEvidenceSections: [] } }, body, sections).length);
assert(validateArticleArchitecture({ ...data, trust: { ...data.trust, author: 'Someone else' } }, body, sections).length);
console.log('Article architecture failure-path tests PASS');

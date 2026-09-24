import { headings, tables } from './lib.mjs';

export function scoreDiscover(article) {
  const { data, body } = article;
  let score = 0;
  const notes = [];

  if (data.updatedAt || data.publishedAt) score += 5;
  const title = String(data.title || '');
  if (/[?｜]|vs|VS|왜|핵심|총정리|질문|분석/.test(title)) score += 4; else if (title.length >= 25) score += 3;
  if (!/충격|대박|무조건|100%|필독|지금 당장/.test(title)) score += 3; else notes.push('clickbait risk');
  if (data.heroImage || data.ogImage) score += 4; else notes.push('hero/og image');
  if (/JoyLab|해석|Insight|관점|판단|시나리오/.test(body)) score += 4; else notes.push('original analysis');
  if (headings(body).length >= 5 && body.split(/\r?\n/).filter((x) => x.length > 180).length < 15) score += 2;
  if (data.author) score += 2;
  if (tables(body) >= 2 || /Key Takeaways|Research Brief|FAQ/.test(body)) score += 1;

  return { score: Math.min(25, score), notes };
}

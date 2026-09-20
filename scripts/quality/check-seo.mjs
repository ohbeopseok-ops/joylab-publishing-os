import { headings, internalLinks } from './lib.mjs';

export function scoreSeo(article) {
  const { data, body } = article;
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const keyword = tags[0] || String(data.title || '').split(/[｜?|]/)[0].trim();
  const first = body.replace(/[#>*_\[\]()]/g, ' ').replace(/\s+/g, ' ').slice(0, 600);
  let score = 0;
  const notes = [];

  if (keyword && String(data.title || '').toLowerCase().includes(keyword.toLowerCase())) score += 4; else notes.push('primary keyword/title alignment');
  if (headings(body).length >= 5) score += 6; else if (headings(body).length >= 3) score += 4; else notes.push('search-intent coverage');
  if (data.seoTitle && String(data.seoTitle).length >= 20) score += 3; else notes.push('seoTitle');
  if (headings(body).length >= 6) score += 3; else if (headings(body).length >= 3) score += 2;
  if (first.length >= 180 && /입니다|이다|뜻|핵심|정리|비교|질문/.test(first)) score += 4; else notes.push('direct answer in opening');
  if (tags.length >= 5) score += 3; else if (tags.length >= 3) score += 2;
  if (internalLinks(body).length >= 2) score += 2; else notes.push('internal links');

  return { score: Math.min(25, score), notes };
}

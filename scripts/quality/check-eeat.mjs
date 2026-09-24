import { externalLinks, headings, count } from './lib.mjs';

export function scoreEeat(article) {
  const { data, body } = article;
  const links = externalLinks(body);
  let score = 0;
  const notes = [];

  if (body.length >= 7000 && headings(body).length >= 6) score += 5; else if (body.length >= 4000) score += 3;
  if (body.length >= 9000 || /Framework|프레임워크|체크포인트|Valuation|Risk|WATCH/.test(body)) score += 5; else if (body.length >= 6000) score += 3;
  if (data.author) score += 3; else notes.push('author');
  if (links.length >= 5) score += 4; else if (links.length >= 2) score += 3; else if (links.length >= 1) score += 1; else notes.push('external sources');
  if (/사실|해석|FACT|INTERPRETATION|Data note|주의할 점|확정되지|가능성|기준일/.test(body)) score += 3; else notes.push('fact/opinion separation');
  if (data.updatedAt) score += 2; else if (data.publishedAt) score += 1;
  if (data.author === 'JoyLab') score += 2;
  if (/변경될 수|확정되지|가능성|위험|리스크|주의/.test(body)) score += 1; else notes.push('uncertainty disclosure');

  return { score: Math.min(25, score), notes };
}

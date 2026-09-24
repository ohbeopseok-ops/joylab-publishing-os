import { blockquotes, bullets, externalLinks, headings, tables, count } from './lib.mjs';

export function scoreGeo(article) {
  const body = article.body;
  let score = 0;
  const notes = [];

  if (blockquotes(body) >= 1) score += 4; else notes.push('standalone quotable answer');
  if (/\b뜻\b|이란|정의|한 문장|핵심은|요약/.test(body)) score += 3; else notes.push('clear definition');
  const sources = externalLinks(body).length;
  if (sources >= 5) score += 4; else if (sources >= 2) score += 3; else if (sources >= 1) score += 1; else notes.push('explicit sources');
  const evidenceSignals = count(body, /\b20\d{2}\b|\d+(?:\.\d+)?%|\d+(?:\.\d+)?조|\d+(?:\.\d+)?억/g);
  if (evidenceSignals >= 8) score += 3; else if (evidenceSignals >= 3) score += 2; else if (evidenceSignals >= 1) score += 1;
  if (/FACT|Fact|INTERPRETATION|Interpretation|해석|사실|시나리오|SCENARIO/.test(body)) score += 3; else notes.push('fact/interpretation separation');
  if (tables(body) >= 4 || bullets(body) >= 12) score += 4; else if (tables(body) >= 2 || bullets(body) >= 6) score += 3; else if (headings(body).length >= 5) score += 2;
  if ((article.data.tags?.length ?? 0) >= 4) score += 2;
  if (/FAQ|Key Takeaways|Research Brief|결론|Conclusion/.test(body)) score += 2; else notes.push('extractable summary structure');

  return { score: Math.min(25, score), notes };
}

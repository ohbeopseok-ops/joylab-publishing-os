import { getCollection } from 'astro:content';

export const prerender = true;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET({ site }: { site: URL }) {
  const origin = site?.origin ?? 'https://aijoylab.kr';
  const articles = (await getCollection('articles'))
    .filter((article) => !article.data.draft)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  const items = articles.map((article) => {
    const slug = article.id.replace(/\.mdx?$/, '');
    const link = `${origin}/articles/${slug}`;
    const title = escapeXml(article.data.title);
    const description = escapeXml(article.data.description);
    const pubDate = article.data.publishedAt.toUTCString();

    return `    <item>\n      <title>${title}</title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <description>${description}</description>\n      <pubDate>${pubDate}</pubDate>\n    </item>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>JoyLab</title>\n    <link>${origin}</link>\n    <description>생각 → 분석 → 실행 → 성장. 투자·경제, AI·생산성, 성장·리더십을 연결하는 독립 콘텐츠 플랫폼.</description>\n${items}\n  </channel>\n</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
}

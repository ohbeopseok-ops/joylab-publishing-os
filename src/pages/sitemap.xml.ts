import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET({ site }: { site: URL }) {
  const origin = site?.origin ?? 'https://aijoylab.kr';
  const articles = await getCollection('articles');

  const urls = [
    `${origin}/`,
    `${origin}/about`,
    `${origin}/contact`,
    `${origin}/privacy`,
    `${origin}/guides/investing`,
    `${origin}/guides/semiconductor-investing`,
    `${origin}/guides/ai-power`,
    `${origin}/guides/shipbuilding`,
    ...articles.map((article) => `${origin}/articles/${article.id.replace(/\.mdx?$/, '')}`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

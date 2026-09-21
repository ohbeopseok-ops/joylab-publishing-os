import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET({ site }: { site: URL }) {
  const origin = site?.origin ?? 'https://aijoylab.kr';
  const articles = await getCollection('articles');
  const books = (await getCollection('books')).filter((book) => !book.data.draft);

  const urls = [
    `${origin}/`,
    `${origin}/about`,
    `${origin}/contact`,
    `${origin}/privacy`,
    `${origin}/guides/investing`,
    `${origin}/guides/ai-productivity`,
    `${origin}/guides/growth-leadership`,
    `${origin}/guides/growth-leadership/literature`,
    `${origin}/guides/growth-leadership/literature/old-man-and-the-sea`,
    `${origin}/guides/growth-leadership/playbook/performance-coaching`,
    `${origin}/guides/semiconductor-investing`,
    `${origin}/guides/ai-power`,
    `${origin}/guides/shipbuilding`,
    `${origin}/guides/us-rates`,
    `${origin}/books/`,
    ...books.map((book) => `${origin}/books/${book.id}`),
    ...articles.map((article) => `${origin}/articles/${article.id.replace(/\.mdx?$/, '')}`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

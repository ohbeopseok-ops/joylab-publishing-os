import { getCollection } from 'astro:content';

export const prerender = true;

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeLastmod(value: unknown) {
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) return undefined;
  const now = new Date();
  if (value.getTime() > now.getTime()) return undefined;
  return value.toISOString().slice(0, 10);
}

export async function GET({ site }: { site: URL }) {
  const origin = site?.origin ?? 'https://aijoylab.kr';
  const articles = (await getCollection('articles'))
    .filter((article) => !article.data.draft);
  const books = (await getCollection('books'))
    .filter((book) => !book.data.draft);

  const staticPaths = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/advertising-disclosure',
    '/articles',
    '/guides/investing',
    '/guides/ai-productivity',
    '/guides/codex',
    '/guides/ai-economics',
    '/guides/ai-infrastructure',
    '/guides/ai-security',
    '/guides/growth-leadership',
    '/guides/growth-leadership/literature',
    '/guides/growth-leadership/literature/old-man-and-the-sea',
    '/guides/growth-leadership/literature/little-prince',
    '/guides/growth-leadership/literature/demian',
    '/guides/growth-leadership/literature/metamorphosis',
    '/guides/growth-leadership/playbook/performance-coaching',
    '/guides/semiconductor-investing',
    '/guides/ai-power',
    '/guides/shipbuilding',
    '/guides/us-rates',
    '/guides/living-research',
    '/books'
  ];

  const canonicalLoc = (pathname: string) => new URL(pathname, origin).toString();

  const entries = [
    ...staticPaths.map((pathname) => ({ loc: canonicalLoc(pathname) })),
    ...books.map((book) => ({
      loc: canonicalLoc(`/books/${book.id}`),
      lastmod: safeLastmod((book.data as any).updatedAt ?? book.data.publishedAt)
    })),
    ...articles.map((article) => ({
      loc: canonicalLoc(`/articles/${article.id.replace(/\.mdx?$/, '')}`),
      lastmod: safeLastmod((article.data as any).updatedAt ?? article.data.publishedAt)
    }))
  ];

  const unique = Array.from(new Map(entries.map((entry) => [entry.loc, entry])).values());

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url><loc>${xmlEscape(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join('\n')}\n</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

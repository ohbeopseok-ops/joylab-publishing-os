export const prerender = true;

export function GET({ site }: { site: URL }) {
  const origin = site?.origin ?? 'https://joylab-publishing-os.ohbeopseok.workers.dev';
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

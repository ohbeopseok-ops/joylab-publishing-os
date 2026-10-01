import manifest from '../../../../../data/studio/releases/series-02-v1.0.0-manifest.json';

export const prerender = true;

export function GET() {
  return new Response(JSON.stringify(manifest, null, 2) + '\n', {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}

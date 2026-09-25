export const prerender = true;

export function GET() {
  return new Response('google.com, pub-6938956176929357, DIRECT, f08c47fec0942fa0\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

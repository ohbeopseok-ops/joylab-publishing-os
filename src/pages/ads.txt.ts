import { SITE_IDENTITY } from '../config/siteIdentity';

export const prerender = true;

export function GET() {
  return new Response(`${SITE_IDENTITY.adsense.adsTxtRecord}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

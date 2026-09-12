const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === 'www.aijoylab.kr') {
      url.protocol = 'https:';
      url.hostname = 'aijoylab.kr';
      return withSecurityHeaders(
        new Response(null, {
          status: 301,
          headers: { Location: url.toString() }
        })
      );
    }

    const response = await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  }
};

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
};

const analyticsContracts = {
  contact_view: {
    targets: new Set(['contact']),
    placements: new Set(['page'])
  },
  social_click: {
    targets: new Set(['naver', 'threads', 'instagram', 'linkedin']),
    placements: new Set(['footer', 'contact'])
  },
  article_contact_click: {
    targets: new Set(['generic', 'investing', 'ai-productivity', 'growth-leadership']),
    placements: new Set(['article'])
  },
  footer_contact_click: {
    targets: new Set(['contact']),
    placements: new Set(['footer'])
  },
  contact_mail_click: {
    targets: new Set(['mail']),
    placements: new Set(['contact'])
  },
  contact_copy_click: {
    targets: new Set(['copy']),
    placements: new Set(['contact'])
  },
  smoke_test: {
    targets: new Set(['deploy']),
    placements: new Set(['production_smoke'])
  }
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

function analyticsResponse(status) {
  return withSecurityHeaders(
    new Response(null, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  );
}

function normalizePath(value) {
  const path = String(value ?? '').trim();
  if (!path.startsWith('/') || path.length > 180) return '/';
  return /^\/[A-Za-z0-9/_-]*$/.test(path) ? path : '/';
}

async function collectAnalyticsEvent(request, env) {
  if (request.method !== 'POST') return analyticsResponse(405);

  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return analyticsResponse(403);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 2048) return analyticsResponse(413);

  const raw = await request.text();
  if (!raw || raw.length > 2048) return analyticsResponse(400);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return analyticsResponse(400);
  }

  const event = String(payload?.event ?? '').trim();
  const target = String(payload?.target ?? '').trim();
  const placement = String(payload?.placement ?? '').trim();
  const contract = analyticsContracts[event];

  if (!contract || !contract.targets.has(target) || !contract.placements.has(placement)) {
    return analyticsResponse(400);
  }

  if (!env.JOYLAB_ANALYTICS?.writeDataPoint) return analyticsResponse(503);

  try {
    env.JOYLAB_ANALYTICS.writeDataPoint({
      indexes: [event],
      blobs: [event, target, placement, normalizePath(payload?.path)],
      doubles: [1]
    });
  } catch {
    return analyticsResponse(503);
  }

  return analyticsResponse(204);
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

    if (url.pathname === '/__analytics/event') {
      return collectAnalyticsEvent(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  }
};

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
};

const analyticsContracts = {
  contact_view: { targets: new Set(['contact']), placements: new Set(['page']) },
  social_click: { targets: new Set(['naver', 'threads', 'instagram', 'linkedin', 'x', 'youtube']), placements: new Set(['footer', 'contact', 'about']) },
  article_contact_click: { targets: new Set(['generic', 'investing', 'ai-productivity', 'growth-leadership']), placements: new Set(['article']) },
  footer_contact_click: { targets: new Set(['contact']), placements: new Set(['footer']) },
  contact_mail_click: { targets: new Set(['mail']), placements: new Set(['contact']) },
  contact_copy_click: { targets: new Set(['copy']), placements: new Set(['contact']) },
  smoke_test: { targets: new Set(['deploy']), placements: new Set(['production_smoke']) },
  article_view: { targetPattern: /^[A-Za-z0-9_-]{1,100}$/, placements: new Set(['article_page']) },
  article_dwell_60: { targetPattern: /^[A-Za-z0-9_-]{1,100}$/, placements: new Set(['article_page']) },
  article_internal_link_click: { targetPattern: /^\/articles\/[A-Za-z0-9_-]{1,100}\/?$/, placements: new Set(['article_body', 'related_research', 'guide_cta']) },
  home_section_impression: { targets: new Set(['editorial', 'major', 'latest', 'guide']), placements: new Set(['home']) },
  home_section_click: { targetPattern: /^(?:[A-Za-z0-9_-]{1,100}|\/guides\/[A-Za-z0-9_-]{1,100}\/?$)$/, placements: new Set(['editorial', 'major', 'latest', 'guide']) },
  book_preview_start: { targetPattern: /^[A-Za-z0-9가-힣_-]{1,120}$/, placements: new Set(['book_hero', 'book_footer']) },
  book_reader_progress_25: { targetPattern: /^[A-Za-z0-9가-힣_-]{1,120}$/, placements: new Set(['web_reader']) },
  book_reader_progress_50: { targetPattern: /^[A-Za-z0-9가-힣_-]{1,120}$/, placements: new Set(['web_reader']) },
  book_reader_progress_75: { targetPattern: /^[A-Za-z0-9가-힣_-]{1,120}$/, placements: new Set(['web_reader']) },
  book_reader_complete: { targetPattern: /^[A-Za-z0-9가-힣_-]{1,120}$/, placements: new Set(['web_reader']) },
  search_query: { targetPattern: /^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ·._\\- ]{2,60}$/, placements: new Set(['search_page']) },
  search_result_click: { targetPattern: /^\\/(?:articles|guides)\\/[A-Za-z0-9_-]{1,120}\\/?$/, placements: new Set(['search_page']) }
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function analyticsResponse(status) {
  return withSecurityHeaders(new Response(null, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
  }));
}

function normalizePath(value) {
  const path = String(value ?? '').trim();
  if (!path.startsWith('/') || path.length > 180) return '/';
  return /^\/[A-Za-z0-9/_-]*$/.test(path) ? path : '/';
}

function matchesContract(contract, target, placement) {
  if (!contract || !contract.placements?.has(placement)) return false;
  if (contract.targets) return contract.targets.has(target);
  if (contract.targetPattern) return contract.targetPattern.test(target);
  return false;
}

async function collectAnalyticsEvent(request, env) {
  if (request.method !== 'POST') return analyticsResponse(405);

  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return analyticsResponse(403);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 2048) return analyticsResponse(413);

  const raw = await request.text();
  if (!raw || raw.length > 2048) return analyticsResponse(400);

  let payload;
  try { payload = JSON.parse(raw); } catch { return analyticsResponse(400); }

  const event = String(payload?.event ?? '').trim();
  const target = String(payload?.target ?? '').trim();
  const placement = String(payload?.placement ?? '').trim();
  const contract = analyticsContracts[event];

  if (!matchesContract(contract, target, placement)) return analyticsResponse(400);
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
      return withSecurityHeaders(new Response(null, { status: 301, headers: { Location: url.toString() } }));
    }

    if (url.pathname === '/__analytics/event') return collectAnalyticsEvent(request, env);

    const response = await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  }
};

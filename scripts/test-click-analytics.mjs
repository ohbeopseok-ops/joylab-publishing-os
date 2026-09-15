import worker from '../worker/index.js';

const writes = [];
const env = {
  JOYLAB_ANALYTICS: {
    writeDataPoint(point) {
      writes.push(point);
    }
  },
  ASSETS: {
    fetch() {
      throw new Error('ASSETS should not be called for analytics endpoint');
    }
  }
};

async function post(payload) {
  const request = new Request('https://aijoylab.kr/__analytics/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      'Sec-Fetch-Site': 'same-origin'
    },
    body: JSON.stringify(payload)
  });
  return worker.fetch(request, env);
}

const social = await post({ event: 'social_click', target: 'instagram', placement: 'contact', path: '/contact' });
if (social.status !== 204) throw new Error(`Expected 204, got ${social.status}`);

const aboutSocial = await post({ event: 'social_click', target: 'threads', placement: 'about', path: '/about' });
if (aboutSocial.status !== 204) throw new Error(`About social_click expected 204, got ${aboutSocial.status}`);

const articleView = await post({ event: 'article_view', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (articleView.status !== 204) throw new Error(`article_view expected 204, got ${articleView.status}`);

const dwell = await post({ event: 'article_dwell_60', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (dwell.status !== 204) throw new Error(`article_dwell_60 expected 204, got ${dwell.status}`);

const internal = await post({ event: 'article_internal_link_click', target: '/articles/semiconductor-cycle', placement: 'article_body', path: '/articles/foreign-investor-flow' });
if (internal.status !== 204) throw new Error(`article_internal_link_click expected 204, got ${internal.status}`);

const homeImpression = await post({ event: 'home_section_impression', target: 'major', placement: 'home', path: '/' });
if (homeImpression.status !== 204) throw new Error(`home_section_impression expected 204, got ${homeImpression.status}`);

const homeClick = await post({ event: 'home_section_click', target: 'anthropic-ipo-ai-safety-2026', placement: 'major', path: '/' });
if (homeClick.status !== 204) throw new Error(`home_section_click expected 204, got ${homeClick.status}`);

const guideClick = await post({ event: 'home_section_click', target: '/guides/ai-productivity', placement: 'guide', path: '/' });
if (guideClick.status !== 204) throw new Error(`guide home_section_click expected 204, got ${guideClick.status}`);

if (writes.length !== 8) throw new Error(`Expected eight analytics writes, got ${writes.length}`);
if (writes[1].blobs.join('|') !== 'social_click|threads|about|/about') {
  throw new Error(`Unexpected About social payload: ${JSON.stringify(writes[1])}`);
}
if (writes[2].blobs.join('|') !== 'article_view|foreign-investor-flow|article_page|/articles/foreign-investor-flow') {
  throw new Error(`Unexpected article view payload: ${JSON.stringify(writes[2])}`);
}
if (writes[5].blobs.join('|') !== 'home_section_impression|major|home|/') {
  throw new Error(`Unexpected home impression payload: ${JSON.stringify(writes[5])}`);
}
if (writes[6].blobs.join('|') !== 'home_section_click|anthropic-ipo-ai-safety-2026|major|/') {
  throw new Error(`Unexpected home click payload: ${JSON.stringify(writes[6])}`);
}

const invalid = await post({ event: 'article_internal_link_click', target: 'https://evil.example/', placement: 'article_body', path: '/articles/foreign-investor-flow' });
if (invalid.status !== 400) throw new Error(`Expected 400, got ${invalid.status}`);

const invalidHomePlacement = await post({ event: 'home_section_click', target: 'anthropic-ipo-ai-safety-2026', placement: 'footer', path: '/' });
if (invalidHomePlacement.status !== 400) throw new Error(`Expected invalid homepage placement 400, got ${invalidHomePlacement.status}`);

const invalidHomeTarget = await post({ event: 'home_section_impression', target: 'unknown', placement: 'home', path: '/' });
if (invalidHomeTarget.status !== 400) throw new Error(`Expected invalid homepage target 400, got ${invalidHomeTarget.status}`);

const invalidHomeSuffix = await post({ event: 'home_section_click', target: 'anthropic-ipo-ai-safety-2026|malformed', placement: 'major', path: '/' });
if (invalidHomeSuffix.status !== 400) throw new Error(`Expected suffixed homepage target 400, got ${invalidHomeSuffix.status}`);

const invalidExternalHomeTarget = await post({ event: 'home_section_click', target: 'https://evil.example/', placement: 'major', path: '/' });
if (invalidExternalHomeTarget.status !== 400) throw new Error(`Expected external homepage target 400, got ${invalidExternalHomeTarget.status}`);

const invalidRssSocial = await post({ event: 'social_click', target: 'rss', placement: 'about', path: '/about' });
if (invalidRssSocial.status !== 400) throw new Error(`Expected RSS social target 400, got ${invalidRssSocial.status}`);

if (writes.length !== 8) throw new Error('Invalid events must not be written');

console.log('Click Analytics V3 worker contract passed.');

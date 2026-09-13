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

const articleView = await post({ event: 'article_view', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (articleView.status !== 204) throw new Error(`article_view expected 204, got ${articleView.status}`);

const dwell = await post({ event: 'article_dwell_60', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (dwell.status !== 204) throw new Error(`article_dwell_60 expected 204, got ${dwell.status}`);

const internal = await post({ event: 'article_internal_link_click', target: '/articles/semiconductor-cycle', placement: 'article_body', path: '/articles/foreign-investor-flow' });
if (internal.status !== 204) throw new Error(`article_internal_link_click expected 204, got ${internal.status}`);

if (writes.length !== 4) throw new Error(`Expected four analytics writes, got ${writes.length}`);
if (writes[1].blobs.join('|') !== 'article_view|foreign-investor-flow|article_page|/articles/foreign-investor-flow') {
  throw new Error(`Unexpected article view payload: ${JSON.stringify(writes[1])}`);
}

const invalid = await post({ event: 'article_internal_link_click', target: 'https://evil.example/', placement: 'article_body', path: '/articles/foreign-investor-flow' });
if (invalid.status !== 400) throw new Error(`Expected 400, got ${invalid.status}`);
if (writes.length !== 4) throw new Error('Invalid event must not be written');

console.log('Click Analytics V2 worker contract passed.');

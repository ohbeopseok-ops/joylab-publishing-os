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

const valid = new Request('https://aijoylab.kr/__analytics/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=UTF-8',
    'Sec-Fetch-Site': 'same-origin'
  },
  body: JSON.stringify({
    event: 'social_click',
    target: 'instagram',
    placement: 'contact',
    path: '/contact'
  })
});

const validResponse = await worker.fetch(valid, env);
if (validResponse.status !== 204) throw new Error(`Expected 204, got ${validResponse.status}`);
if (writes.length !== 1) throw new Error(`Expected one analytics write, got ${writes.length}`);
if (writes[0].blobs.join('|') !== 'social_click|instagram|contact|/contact') {
  throw new Error(`Unexpected analytics payload: ${JSON.stringify(writes[0])}`);
}

const invalid = new Request('https://aijoylab.kr/__analytics/event', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  body: JSON.stringify({
    event: 'social_click',
    target: 'unknown-channel',
    placement: 'contact',
    path: '/contact'
  })
});

const invalidResponse = await worker.fetch(invalid, env);
if (invalidResponse.status !== 400) throw new Error(`Expected 400, got ${invalidResponse.status}`);
if (writes.length !== 1) throw new Error('Invalid event must not be written');

console.log('Click Analytics V1 worker contract passed.');

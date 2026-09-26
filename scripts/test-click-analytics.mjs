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

const xSocial = await post({ event: 'social_click', target: 'x', placement: 'footer', path: '/' });
if (xSocial.status !== 204) throw new Error(`X social_click expected 204, got ${xSocial.status}`);

const youtubeSocial = await post({ event: 'social_click', target: 'youtube', placement: 'about', path: '/about' });
if (youtubeSocial.status !== 204) throw new Error(`YouTube social_click expected 204, got ${youtubeSocial.status}`);

const articleView = await post({ event: 'article_view', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (articleView.status !== 204) throw new Error(`article_view expected 204, got ${articleView.status}`);

const dwell = await post({ event: 'article_dwell_60', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (dwell.status !== 204) throw new Error(`article_dwell_60 expected 204, got ${dwell.status}`);

const read50 = await post({ event: 'article_read_50', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (read50.status !== 204) throw new Error(`article_read_50 expected 204, got ${read50.status}`);

const read90 = await post({ event: 'article_read_90', target: 'foreign-investor-flow', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (read90.status !== 204) throw new Error(`article_read_90 expected 204, got ${read90.status}`);

const earlyExit = await post({ event: 'article_exit', target: 'foreign-investor-flow', placement: 'early_exit', path: '/articles/foreign-investor-flow' });
if (earlyExit.status !== 204) throw new Error(`article_exit expected 204, got ${earlyExit.status}`);

const cls = await post({ event: 'article_cls', target: '0.043', placement: 'article_page', path: '/articles/foreign-investor-flow' });
if (cls.status !== 204) throw new Error(`article_cls expected 204, got ${cls.status}`);

const internal = await post({ event: 'article_internal_link_click', target: '/articles/semiconductor-cycle', placement: 'article_body', path: '/articles/foreign-investor-flow' });
if (internal.status !== 204) throw new Error(`article_internal_link_click expected 204, got ${internal.status}`);

const homeImpression = await post({ event: 'home_section_impression', target: 'major', placement: 'home', path: '/' });
if (homeImpression.status !== 204) throw new Error(`home_section_impression expected 204, got ${homeImpression.status}`);

const homeClick = await post({ event: 'home_section_click', target: 'anthropic-ipo-ai-safety-2026', placement: 'major', path: '/' });
if (homeClick.status !== 204) throw new Error(`home_section_click expected 204, got ${homeClick.status}`);

const guideClick = await post({ event: 'home_section_click', target: '/guides/ai-productivity', placement: 'guide', path: '/' });
if (guideClick.status !== 204) throw new Error(`guide home_section_click expected 204, got ${guideClick.status}`);

const bookPreview = await post({ event: 'book_preview_start', target: 'weight-of-silence', placement: 'book_hero_v2', path: '/books/weight-of-silence' });
if (bookPreview.status !== 204) throw new Error(`book_preview_start V2 expected 204, got ${bookPreview.status}`);

const mindmapHero = await post({ event: 'book_mindmap_open', target: 'weight-of-silence', placement: 'book_hero_v2', path: '/books/weight-of-silence' });
if (mindmapHero.status !== 204) throw new Error(`book_mindmap_open hero expected 204, got ${mindmapHero.status}`);

const mindmapTab = await post({ event: 'book_mindmap_open', target: 'weight-of-silence', placement: 'book_tabs', path: '/books/weight-of-silence' });
if (mindmapTab.status !== 204) throw new Error(`book_mindmap_open tab expected 204, got ${mindmapTab.status}`);

const relatedResearch = await post({ event: 'book_related_research_click', target: 'why-we-cannot-stand-silence', placement: 'weight-of-silence', path: '/books/weight-of-silence' });
if (relatedResearch.status !== 204) throw new Error(`book_related_research_click expected 204, got ${relatedResearch.status}`);

const bookLanding = await post({ event: 'book_landing_view', target: 'problem-to-service', placement: 'book_landing', path: '/books/problem-to-service' });
if (bookLanding.status !== 204) throw new Error(`book_landing_view expected 204, got ${bookLanding.status}`);

const bookReader = await post({ event: 'book_reader_view', target: 'problem-to-service', placement: 'book_reader', path: '/books/problem-to-service/read' });
if (bookReader.status !== 204) throw new Error(`book_reader_view expected 204, got ${bookReader.status}`);

for (const depth of [25, 50, 75, 100]) {
  const response = await post({ event: `book_read_${depth}`, target: 'problem-to-service', placement: 'book_reader', path: '/books/problem-to-service/read' });
  if (response.status !== 204) throw new Error(`book_read_${depth} expected 204, got ${response.status}`);
}

const bookPurchase = await post({ event: 'book_purchase_cta_click', target: 'problem-to-service', placement: 'book_closing_v2', path: '/books/problem-to-service' });
if (bookPurchase.status !== 204) throw new Error(`book_purchase_cta_click expected 204, got ${bookPurchase.status}`);

for (const [event, target] of [
  ['book_chapter_complete', 'problem-to-service:1'],
  ['book_chapter_bookmark', 'problem-to-service:1'],
  ['book_interaction_check', 'problem-to-service:problem-observation-five'],
  ['book_interaction_choice', 'problem-to-service:feature-or-problem'],
  ['book_interaction_action', 'work-to-system:fragment-practice']
]) {
  const response = await post({ event, target, placement: 'interactive_book', path: '/books/problem-to-service/read' });
  if (response.status !== 204) throw new Error(`${event} expected 204, got ${response.status}`);
}

if (writes.length !== 30) throw new Error(`Expected thirty analytics writes, got ${writes.length}`);
if (writes[1].blobs.join('|') !== 'social_click|threads|about|/about') throw new Error(`Unexpected About social payload: ${JSON.stringify(writes[1])}`);
if (writes[2].blobs.join('|') !== 'social_click|x|footer|/') throw new Error(`Unexpected X social payload: ${JSON.stringify(writes[2])}`);
if (writes[3].blobs.join('|') !== 'social_click|youtube|about|/about') throw new Error(`Unexpected YouTube social payload: ${JSON.stringify(writes[3])}`);
if (writes[4].blobs.join('|') !== 'article_view|foreign-investor-flow|article_page|/articles/foreign-investor-flow') throw new Error(`Unexpected article view payload: ${JSON.stringify(writes[4])}`);
if (writes[11].blobs.join('|') !== 'home_section_impression|major|home|/') throw new Error(`Unexpected home impression payload: ${JSON.stringify(writes[11])}`);
if (writes[12].blobs.join('|') !== 'home_section_click|anthropic-ipo-ai-safety-2026|major|/') throw new Error(`Unexpected home click payload: ${JSON.stringify(writes[12])}`);

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

if (writes.length !== 30) throw new Error('Invalid events must not be written');

console.log('Click Analytics V3 worker contract passed.');

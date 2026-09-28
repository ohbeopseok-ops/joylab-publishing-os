import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });

for (const viewport of [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 }
]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const response = await page.goto(baseURL + '/articles/samsung-vs-sk-hynix-ai-memory', { waitUntil: 'networkidle' });
  if (!response || response.status() >= 400) throw new Error(viewport.name + ': article failed to load');

  const result = await page.evaluate(() => {
    const main = document.querySelector('.research-main');
    const mobileCta = main?.querySelector('.mobile-after-article-cta');
    const ad = main?.querySelector('[data-ad-placement="article-end"]');
    const mobileRelated = main?.querySelector('.mobile-after-article-related');
    const railCta = document.querySelector('.research-rail > .research-guide-cta');
    const railRelated = document.querySelector('.research-rail > .research-rail__card.related-card');
    const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    const follows = (a, b) => !!a && !!b && Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      mobileCtaVisible: visible(mobileCta),
      adVisible: visible(ad),
      mobileRelatedVisible: visible(mobileRelated),
      railCtaVisible: visible(railCta),
      railRelatedVisible: visible(railRelated),
      orderAdCta: follows(ad, mobileCta),
      orderCtaRelated: follows(mobileCta, mobileRelated),
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (viewport.width <= 640) {
    if (!result.mobileCtaVisible || !result.adVisible || !result.mobileRelatedVisible) throw new Error(viewport.name + ': mobile sequence element missing');
    if (!result.orderAdCta || !result.orderCtaRelated) throw new Error(viewport.name + ': expected ad → CTA → related order');
    if (result.railCtaVisible || result.railRelatedVisible) throw new Error(viewport.name + ': duplicate rail CTA/related visible');
  } else {
    if (result.mobileCtaVisible || result.mobileRelatedVisible) throw new Error(viewport.name + ': mobile duplicates visible on desktop');
    if (!result.railCtaVisible || !result.railRelatedVisible) throw new Error(viewport.name + ': desktop rail content hidden');
  }
  if (result.pageOverflow > 1) throw new Error(viewport.name + ': horizontal page overflow ' + result.pageOverflow);
  console.log('PASS', viewport.name, JSON.stringify(result));
  await page.close();
}

await browser.close();
console.log('Mobile article monetization order PASS · AdSense-safe ad → CTA → related');

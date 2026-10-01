import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import contract from '../config/monetization-layout-contract-v2.json' with { type: 'json' };

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const minCards = contract.archiveActivationGate.minOrganicCardsBeforeAd;

const [placementSource, archiveSource] = await Promise.all([
  fs.readFile('src/config/adPlacement.ts', 'utf8'),
  fs.readFile(contract.archiveActivationGate.sourcePath, 'utf8')
]);

const minMatch = placementSource.match(/archiveInFeed:\s*\{[^}]*minCardsBefore:\s*(\d+)/s);
if (!minMatch) throw new Error('archive-in-feed minCardsBefore not found in adPlacement.ts');
if (Number(minMatch[1]) !== minCards) {
  throw new Error(`archive-in-feed minCardsBefore ${minMatch[1]} does not match contract ${minCards}`);
}

const slotMatch = placementSource.match(/archiveInFeed:\s*\{[^}]*slotId:\s*'([^']*)'/s);
if (!slotMatch) throw new Error('archive-in-feed slotId not found in adPlacement.ts');
const slotConfigured = Boolean(slotMatch[1].trim());

for (const required of [
  'const archiveMinCards = AD_PLACEMENT.slots.archiveInFeed.minCardsBefore',
  'articles.slice(0, archiveMinCards)',
  'data-archive-in-feed-after={archiveMinCards}',
  '<AdSlot placement="archive-in-feed" />',
  'articles.slice(archiveMinCards)'
]) {
  if (!archiveSource.includes(required)) {
    throw new Error(`archive activation source contract missing: ${required}`);
  }
}

const firstSliceIndex = archiveSource.indexOf('articles.slice(0, archiveMinCards)');
const adIndex = archiveSource.indexOf('<AdSlot placement="archive-in-feed" />');
const secondSliceIndex = archiveSource.indexOf('articles.slice(archiveMinCards)');
if (!(firstSliceIndex < adIndex && adIndex < secondSliceIndex)) {
  throw new Error('archive-in-feed source order must be first six cards → ad → remaining cards');
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const response = await page.goto(baseURL + '/articles', { waitUntil: 'networkidle' });
  if (!response || response.status() >= 400) throw new Error('archive page failed to load');

  const result = await page.evaluate(() => {
    const grid = document.querySelector('.home-archive .grid');
    const shell = grid?.querySelector('.archive-in-feed-ad-shell');
    if (!grid || !shell) return { missing: true };

    const children = [...grid.children];
    const shellIndex = children.indexOf(shell);
    const organicBefore = children
      .slice(0, shellIndex)
      .filter((el) => el.classList.contains('article-card'))
      .length;
    const renderedAd = shell.querySelector('[data-ad-placement="archive-in-feed"]');

    return {
      missing: false,
      organicBefore,
      declaredAfter: Number(shell.getAttribute('data-archive-in-feed-after')),
      renderedAd: Boolean(renderedAd),
      totalOrganicCards: grid.querySelectorAll('.article-card').length
    };
  });

  if (result.missing) throw new Error('archive in-feed shell missing at runtime');
  if (result.declaredAfter !== minCards) throw new Error(`archive shell declares ${result.declaredAfter}, expected ${minCards}`);
  if (result.organicBefore !== minCards) throw new Error(`archive ad has ${result.organicBefore} organic cards before it, expected exactly ${minCards}`);
  if (!slotConfigured && result.renderedAd) throw new Error('archive ad rendered even though slotId is empty');
  if (slotConfigured && !result.renderedAd) throw new Error('archive slotId is configured but archive ad did not render');
  if (result.totalOrganicCards < minCards) throw new Error('archive has fewer organic cards than activation threshold');

  console.log('Archive In-feed Activation Gate PASS', JSON.stringify({
    slotConfigured,
    minCards,
    ...result
  }));
  await page.close();
} finally {
  await browser.close();
}

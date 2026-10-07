import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [];

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}
function pass(name, detail='') { checks.push({name,status:'PASS',detail}); }
function fail(name, detail='') { checks.push({name,status:'FAIL',detail}); process.exitCode = 1; }

const identity = read('src/config/siteIdentity.ts');
const placement = read('src/config/adPlacement.ts');
const trust = JSON.parse(read('config/adsense-trust-rollout-status-v1.json'));

identity.includes("publisherId: 'pub-6938956176929357'") ? pass('Publisher ID') : fail('Publisher ID');
identity.includes("clientId: 'ca-pub-6938956176929357'") ? pass('Client ID') : fail('Client ID');
identity.includes("google.com, pub-6938956176929357, DIRECT, f08c47fec0942fa0") ? pass('ads.txt record binding') : fail('ads.txt record binding');

placement.includes('enabled: false') ? pass('Global ad placement disabled') : fail('Global ad placement disabled','Must remain false while CI/CMP/GOLD gates are incomplete');
placement.includes("articleEnd: { key: 'article-end', slotId: '1843494813'") ? pass('Real article-end slot registered') : fail('Real article-end slot registered');
placement.includes("articleMid30: { key: 'article-mid-30', slotId: ''") ? pass('mid30 dormant') : fail('mid30 dormant');
placement.includes("articleMid65: { key: 'article-mid-65', slotId: ''") ? pass('mid65 dormant') : fail('mid65 dormant');
placement.includes("archiveInFeed: { key: 'archive-in-feed', slotId: ''") ? pass('archive in-feed dormant') : fail('archive in-feed dormant');

trust.totalArticles === 123 && trust.contentReady === 123 ? pass('Trust rollout 123/123') : fail('Trust rollout 123/123');
trust.automatedReleaseState === 'CI-DEFERRED' ? pass('CI deferred state explicit') : fail('CI deferred state explicit');

for (const p of ['src/pages/privacy.astro','src/pages/advertising-disclosure.astro','src/pages/terms.astro','src/pages/contact.astro']) {
  fs.existsSync(path.join(root,p)) ? pass('Legal/contact route exists',p) : fail('Legal/contact route exists',p);
}

const adRoute = 'src/pages/ads.txt.ts';
fs.existsSync(path.join(root,adRoute)) ? pass('ads.txt route exists',adRoute) : fail('ads.txt route exists',adRoute);

console.log(JSON.stringify({version:'1.0',status:process.exitCode ? 'FAIL' : 'PASS',checks},null,2));

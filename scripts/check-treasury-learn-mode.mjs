import fs from 'node:fs';
import assert from 'node:assert/strict';

const glossary = JSON.parse(fs.readFileSync('src/data/treasury-learn-glossary-v0-1.json', 'utf8'));
const transmission = JSON.parse(fs.readFileSync('src/data/market-transmission.json', 'utf8'));
const component = fs.readFileSync('src/components/TreasuryLearnAssist.astro', 'utf8');
const today = fs.readFileSync('src/components/TreasuryTodayReading.astro', 'utf8');
const layout = fs.readFileSync('src/layouts/BaseLayout.astro', 'utf8');

assert.equal(glossary.version, '0.1');
assert.equal(glossary.terms.length, 12, 'Learn Mode glossary must keep exactly 12 core terms');
assert.equal(new Set(glossary.terms.map((x) => x.key)).size, 12, 'term keys must be unique');
for (const item of glossary.terms) {
  for (const field of ['term','easy','why','how','example','href']) assert.ok(item[field], `${item.key}.${field} is required`);
  assert.ok(Array.isArray(item.aliases) && item.aliases.length >= 1, `${item.key}.aliases is required`);
}
assert.equal(transmission.version, '0.4');
assert.ok(transmission.foreignFlow && transmission.epsRevision, 'V0.4 requires foreignFlow and epsRevision contracts');
for (const key of ['foreignFlow','epsRevision']) {
  assert.equal(typeof transmission[key].ready, 'boolean', `${key}.ready must be boolean`);
  assert.ok(transmission[key].provider, `${key}.provider is required`);
}
assert.match(component, /data-version="0\.2"/);
assert.match(component, /data-learn-toggle/);
assert.match(component, /data-learn-panel/);
assert.match(component, /joylab-treasury-learn-mode/);
assert.match(component, /관련 리서치 읽기/);
assert.match(component, /numberReads/);
assert.match(component, /초보자 해석/);
assert.match(component, /Auction Score/);
assert.match(component, /Treasury Risk/);
assert.match(component, /매수·매도 신호가 아닙니다/);
assert.match(today, /TODAY'S READING · V0\.4/);
assert.match(today, /핵심 압력/);
assert.match(today, /완충 신호/);
assert.match(today, /오늘 확인/);
assert.match(today, /FULL TRANSMISSION/);
assert.match(today, /FUNDAMENTAL CUSHION/);
assert.match(today, /DATA NOT CONNECTED/);
assert.match(today, /market-transmission\.json/);
assert.match(layout, /TreasuryLearnAssist/);
assert.match(layout, /showTreasuryLearnAssist/);
assert.match(layout, /TreasuryTodayReading/);
assert.match(layout, /showTreasuryTodayReading/);
console.log('Treasury Learn Mode V0.4 contract PASS: glossary + number translations + Today Reading + gated EPS/foreign-flow transmission inputs.');

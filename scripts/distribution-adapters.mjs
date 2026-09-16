import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CHANNELS = ['threads', 'x', 'linkedin', 'naver'];
const argValue = (args, flag, fallback) => { const i = args.indexOf(flag); return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback; };

export function createPublishHandoff(pack, channel, variantId) {
  if (!['APPROVED', 'PUBLISHED'].includes(pack.state) || !pack.approval?.approved) {
    throw new Error('Publish handoff blocked: pack must be APPROVED before publishing.');
  }
  if (!CHANNELS.includes(channel)) throw new Error(`Unsupported channel: ${channel}`);
  const channelPack = pack.channels[channel];
  const variant = channelPack?.variants?.find((item) => item.id === variantId);
  if (!variant) throw new Error(`Variant not found: ${channel}/${variantId}`);
  const identity = channelPack?.identity ?? pack.identity?.channels?.[channel] ?? null;
  return {
    mode: 'MANUAL_HANDOFF', autoPublish: false, channel, variantId,
    title: variant.title, body: variant.body, cta: variant.cta,
    hashtags: variant.hashtags, utmUrl: variant.utmUrl,
    identity,
    sourceArticle: pack.sourceUrl ?? null,
    createdAt: new Date().toISOString()
  };
}

function runCli() {
  if (process.argv.includes('--self-test')) {
    let blocked = false;
    try { createPublishHandoff({ state: 'REVIEW', approval: { approved: false }, channels: {} }, 'x', 'x_hook_a'); } catch { blocked = true; }
    if (!blocked) throw new Error('Adapter approval guard failed.');
    const variant = { id: 'x_hook_a', title: '', body: 'hello', cta: 'JoyLab Research', hashtags: [], utmUrl: 'https://aijoylab.kr/' };
    const identity = {
      accountUrl: 'https://x.com/ohbeopseok',
      authorEntity: 'https://aijoylab.kr/#founder',
      publisherEntity: 'https://aijoylab.kr/#organization',
      destinationEntity: 'https://aijoylab.kr/#website',
      cta: '숫자와 전체 근거 → JoyLab Research'
    };
    const approved = { state: 'APPROVED', sourceUrl: 'https://aijoylab.kr/articles/demo', approval: { approved: true }, channels: { x: { identity, variants: [variant] } } };
    const handoff = createPublishHandoff(approved, 'x', 'x_hook_a');
    approved.state = 'PUBLISHED';
    const second = createPublishHandoff(approved, 'x', 'x_hook_a');
    if (handoff.autoPublish !== false || second.mode !== 'MANUAL_HANDOFF') throw new Error('Adapter manual-only/multi-channel contract failed.');
    if (handoff.identity?.authorEntity !== 'https://aijoylab.kr/#founder' || handoff.identity?.destinationEntity !== 'https://aijoylab.kr/#website') throw new Error('Adapter entity handoff contract failed.');
    console.log('Distribution adapter self-test passed.');
    return;
  }
  const args = process.argv.slice(2);
  const manifest = argValue(args, '--manifest');
  const channel = argValue(args, '--channel');
  const variant = argValue(args, '--variant');
  const out = argValue(args, '--out', 'distribution/publish-handoff.json');
  if (!manifest || !channel || !variant) throw new Error('Usage: node scripts/distribution-adapters.mjs --manifest <path> --channel <channel> --variant <id> [--out <path>]');
  const pack = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const handoff = createPublishHandoff(pack, channel, variant);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(handoff, null, 2)}\n`);
  console.log(`Manual publish handoff created: ${out}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) runCli();

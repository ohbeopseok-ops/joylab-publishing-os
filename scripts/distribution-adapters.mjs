import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CHANNELS = ['threads', 'x', 'linkedin', 'naver'];

export function createPublishHandoff(pack, channel, variantId) {
  if (!['APPROVED', 'PUBLISHED'].includes(pack.state) || !pack.approval?.approved) {
    throw new Error('Publish handoff blocked: pack must be APPROVED before publishing.');
  }
  if (!CHANNELS.includes(channel)) throw new Error(`Unsupported channel: ${channel}`);
  const variant = pack.channels[channel]?.variants?.find((item) => item.id === variantId);
  if (!variant) throw new Error(`Variant not found: ${channel}/${variantId}`);
  return {
    mode: 'MANUAL_HANDOFF',
    autoPublish: false,
    channel,
    variantId,
    title: variant.title,
    body: variant.body,
    cta: variant.cta,
    hashtags: variant.hashtags,
    utmUrl: variant.utmUrl,
    createdAt: new Date().toISOString()
  };
}

function runCli() {
  if (process.argv.includes('--self-test')) {
    let blocked = false;
    try { createPublishHandoff({ state: 'REVIEW', approval: { approved: false }, channels: {} }, 'x', 'x_hook_a'); } catch { blocked = true; }
    if (!blocked) throw new Error('Adapter approval guard failed.');
    const variant = { id: 'x_hook_a', title: '', body: 'hello', cta: '', hashtags: [], utmUrl: 'https://aijoylab.kr/' };
    const approved = { state: 'APPROVED', approval: { approved: true }, channels: { x: { variants: [variant] } } };
    const handoff = createPublishHandoff(approved, 'x', 'x_hook_a');
    approved.state = 'PUBLISHED';
    const second = createPublishHandoff(approved, 'x', 'x_hook_a');
    if (handoff.autoPublish !== false || second.mode !== 'MANUAL_HANDOFF') throw new Error('Adapter manual-only/multi-channel contract failed.');
    console.log('Distribution adapter self-test passed.');
    return;
  }
  const args = process.argv.slice(2);
  const manifest = args[args.indexOf('--manifest') + 1];
  const channel = args[args.indexOf('--channel') + 1];
  const variant = args[args.indexOf('--variant') + 1];
  const out = args[args.indexOf('--out') + 1] || 'distribution/publish-handoff.json';
  if (!manifest || !channel || !variant) throw new Error('Usage: node scripts/distribution-adapters.mjs --manifest <path> --channel <channel> --variant <id> [--out <path>]');
  const pack = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const handoff = createPublishHandoff(pack, channel, variant);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(handoff, null, 2)}\n`);
  console.log(`Manual publish handoff created: ${out}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) runCli();

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const manifest = args[args.indexOf('--manifest') + 1];
const channel = args[args.indexOf('--channel') + 1];
const variantId = args[args.indexOf('--variant') + 1];
const publishedUrl = args[args.indexOf('--url') + 1];
const publishedAt = args[args.indexOf('--at') + 1] || new Date().toISOString();
const logFile = args[args.indexOf('--log') + 1] || 'distribution/publish-log.ndjson';

export function recordPublished(pack, { channel, variantId, publishedUrl, publishedAt }) {
  if (pack.state !== 'APPROVED' || !pack.approval?.approved) throw new Error('Publish log blocked: pack must be APPROVED.');
  const variant = pack.channels?.[channel]?.variants?.find((item) => item.id === variantId);
  if (!variant) throw new Error(`Variant not found: ${channel}/${variantId}`);
  new URL(publishedUrl);
  variant.publishedUrl = publishedUrl;
  variant.publishedAt = publishedAt;
  pack.channels[channel].status = 'PUBLISHED';
  pack.state = 'PUBLISHED';
  pack.updatedAt = publishedAt;
  const row = { articleSlug: pack.articleSlug, campaign: pack.campaign, channel, variantId, publishedUrl, publishedAt };
  pack.publishLog = [...(pack.publishLog || []), row];
  return row;
}

if (process.argv.includes('--self-test')) {
  const pack = { state:'APPROVED', articleSlug:'demo', campaign:'research_demo', approval:{approved:true}, channels:{x:{status:'APPROVED',variants:[{id:'x_data_a',publishedUrl:null,publishedAt:null}]}}, publishLog:[] };
  const row = recordPublished(pack,{channel:'x',variantId:'x_data_a',publishedUrl:'https://x.com/example/status/1',publishedAt:'2026-09-15T00:00:00.000Z'});
  if (pack.state !== 'PUBLISHED' || row.articleSlug !== 'demo' || !pack.channels.x.variants[0].publishedUrl) throw new Error('Publish log self-test failed.');
  console.log('Distribution publish log self-test passed.');
  process.exit(0);
}

if (!manifest || !channel || !variantId || !publishedUrl) throw new Error('Usage: node scripts/distribution-publish-log.mjs --manifest <pack.json> --channel <channel> --variant <id> --url <published-url> [--at <iso>]');
const pack = JSON.parse(fs.readFileSync(manifest,'utf8'));
const row = recordPublished(pack,{channel,variantId,publishedUrl,publishedAt});
fs.writeFileSync(manifest, `${JSON.stringify(pack,null,2)}\n`);
fs.mkdirSync(path.dirname(logFile),{recursive:true});
fs.appendFileSync(logFile, `${JSON.stringify(row)}\n`);
console.log(`Published recorded: ${channel}/${variantId}`);

import fs from 'node:fs';

const ORDER = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'MEASURED'];

export function assertTransition(from, to) {
  const fromIndex = ORDER.indexOf(from);
  const toIndex = ORDER.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) throw new Error(`Unknown state: ${from} -> ${to}`);
  if (toIndex !== fromIndex + 1) throw new Error(`Invalid transition: ${from} -> ${to}`);
}

export function transitionPack(pack, to, actor = 'unknown') {
  assertTransition(pack.state, to);
  const now = new Date().toISOString();
  if (to === 'APPROVED') {
    pack.approval = { approved: true, approvedBy: actor, approvedAt: now };
  }
  if (to === 'PUBLISHED' && !pack.approval?.approved) {
    throw new Error('Publishing is blocked until APPROVED.');
  }
  pack.state = to;
  pack.updatedAt = now;
  for (const channel of Object.values(pack.channels || {})) channel.status = to;
  return pack;
}

if (process.argv.includes('--self-test')) {
  const sample = { state: 'DRAFT', channels: { x: { status: 'DRAFT' } }, approval: { approved: false, approvedBy: null, approvedAt: null } };
  transitionPack(sample, 'REVIEW', 'qa');
  transitionPack(sample, 'APPROVED', 'qa');
  transitionPack(sample, 'PUBLISHED', 'qa');
  if (sample.state !== 'PUBLISHED' || !sample.approval.approved) throw new Error('State self-test failed.');
  let blocked = false;
  try { transitionPack({ state: 'DRAFT', channels: {}, approval: { approved: false } }, 'PUBLISHED', 'qa'); } catch { blocked = true; }
  if (!blocked) throw new Error('Approval guard self-test failed.');
  console.log('Distribution state self-test passed.');
  process.exit(0);
}

const args = process.argv.slice(2);
const file = args[args.indexOf('--manifest') + 1];
const to = args[args.indexOf('--to') + 1];
const actor = args[args.indexOf('--actor') + 1] || 'manual-reviewer';
if (!file || !to) throw new Error('Usage: node scripts/distribution-state.mjs --manifest <path> --to <STATE> [--actor <name>]');
const pack = JSON.parse(fs.readFileSync(file, 'utf8'));
transitionPack(pack, to, actor);
fs.writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`);
console.log(`${file}: ${pack.state}`);

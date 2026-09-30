import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contractPath = path.join(root, 'config/customer-center-ax-knowledge-contract-v1.json');
const errors = [];
const fail = (m) => errors.push(m);

if (!fs.existsSync(contractPath)) fail('contract file missing');

const contract = fs.existsSync(contractPath)
  ? JSON.parse(fs.readFileSync(contractPath, 'utf8'))
  : {};

if (contract.contract !== 'JoyLab.CustomerCenterAXKnowledgeContract') fail('invalid contract id');
if (!/^\d+\.\d+\.\d+$/.test(contract.version ?? '')) fail('version must be semver');
if (contract.agent?.id !== 'home-consult-senior') fail('unexpected agent id');

const promptPath = contract.agent?.systemPrompt;
if (!promptPath || !fs.existsSync(path.join(root, promptPath))) fail('system prompt missing');

const expectedOrder = ['sop', 'playbook', 'research', 'book'];
const layers = contract.authorityOrder ?? [];
if (layers.length !== expectedOrder.length) fail('authorityOrder must contain exactly 4 layers');

for (let i = 0; i < expectedOrder.length; i++) {
  const layer = layers[i];
  if (!layer) continue;
  if (layer.id !== expectedOrder[i]) fail(`authority rank ${i + 1} must be ${expectedOrder[i]}`);
  if (layer.rank !== i + 1) fail(`invalid rank for ${layer.id}`);
}

const byId = new Map(layers.map((x) => [x.id, x]));
const sop = byId.get('sop');

if (!sop) fail('sop layer missing');
else {
  if (sop.status === 'required_but_unconfigured') {
    if ((sop.sources ?? []).length !== 0) fail('unconfigured SOP must not declare sources');
  } else if (sop.status === 'configured') {
    if (!(sop.sources ?? []).length) fail('configured SOP requires at least one source');
  } else {
    fail('invalid SOP status');
  }
}

for (const layer of layers) {
  if (!['required_but_unconfigured', 'configured'].includes(layer.status)) {
    fail(`invalid status for ${layer.id}`);
  }

  for (const source of layer.sources ?? []) {
    if (!fs.existsSync(path.join(root, source))) fail(`missing source: ${layer.id} -> ${source}`);
  }

  if (layer.id !== 'sop' && layer.status !== 'configured') {
    fail(`${layer.id} must be configured`);
  }
}

const seq = contract.retrievalPolicy?.sequence ?? [];
if (JSON.stringify(seq) !== JSON.stringify(expectedOrder)) fail('retrieval sequence must match authority order');
if (contract.retrievalPolicy?.lowerLayerCanOverride !== false) fail('lower layers must not override');
if (contract.conflictPolicy?.mode !== 'highest_authority_wins') fail('conflict mode must be highest_authority_wins');
if (contract.conflictPolicy?.noSilentMerge !== true) fail('noSilentMerge must be true');

const blocking = contract.blockingRules ?? [];
const sopBlock = blocking.find((x) => x.id === 'sop-required-for-binding-answer');
if (!sopBlock) fail('SOP binding-answer block missing');
else {
  if (sopBlock.ifLayerUnavailable !== 'sop') fail('SOP block must target sop layer');
  if (sopBlock.action !== 'block_binding_answer') fail('SOP block action invalid');
  if (sopBlock.responseMarker !== '[SOP 확인 필요]') fail('SOP response marker invalid');
}

const requiredAnswerSections = ['근거 계층', '핵심 판단', '안내 초안', '확인 필요'];
const answerSections = contract.answerContract?.requiredSections ?? [];
for (const section of requiredAnswerSections) {
  if (!answerSections.includes(section)) fail(`answer section missing: ${section}`);
}
if (contract.answerContract?.neverPresentModelGuessAsPolicy !== true) {
  fail('model guesses must never be presented as policy');
}

if (promptPath && fs.existsSync(path.join(root, promptPath))) {
  const prompt = fs.readFileSync(path.join(root, promptPath), 'utf8');
  for (const token of ['SOP / 공식 전산', '승인된 Customer Center AX Playbook', '[SOP 확인 필요]', '[확인 필요]']) {
    if (!prompt.includes(token)) fail(`system prompt missing token: ${token}`);
  }
}

if (errors.length) {
  for (const e of errors) console.error('❌ ' + e);
  console.error('\nCustomer Center AX Knowledge Contract V1 FAILED: ' + errors.length + ' error(s)');
  process.exit(1);
}

console.log('✅ Customer Center AX Knowledge Contract V1 PASS');
console.log('Authority: SOP → Playbook → Research → Book');
console.log('SOP status: ' + sop.status);

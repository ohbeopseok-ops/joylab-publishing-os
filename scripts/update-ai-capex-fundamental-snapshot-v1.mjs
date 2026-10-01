import fs from 'node:fs';

const INPUT = 'src/data/ai-capex-leader-input-v1.json';
const OUTPUT = 'src/data/ai-capex-fundamental-snapshot-v1.json';
const SELF_TEST = process.argv.includes('--self-test');
const MAX_EPS_AGE_DAYS = 7;
const ALLOWED_IR_TYPES = new Set(['company-ir','company-filing','official-press-release']);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const finite = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const daysOld = (dateText) => {
  const t = Date.parse(dateText || '');
  return Number.isFinite(t) ? (Date.now() - t) / 86400000 : Infinity;
};

export function revisionScore(company = {}) {
  const eps = finite(company.epsFy1Revision30dPct) ? Number(company.epsFy1Revision30dPct) : null;
  const op = finite(company.opRevision30dPct) ? Number(company.opRevision30dPct) : null;
  const rev = finite(company.revenueRevision30dPct) ? Number(company.revenueRevision30dPct) : null;
  if (eps === null || op === null) return null;
  const signal = 0.5 * eps + 0.3 * op + 0.2 * (rev ?? 0);
  if (signal >= 10) return 25;
  if (signal >= 5) return 23;
  if (signal >= 2) return 21;
  if (signal >= 0) return 18;
  if (signal > -5) return 14;
  if (signal > -10) return 10;
  return 6;
}

function validIrEvidence(item = {}) {
  return Boolean(
    item.evidenceId &&
    item.publishedAt &&
    item.sourceUrl &&
    ALLOWED_IR_TYPES.has(item.sourceType) &&
    item.metric &&
    item.quoteHash
  );
}

async function fetchProvider(url, token, label) {
  if (!url) return null;
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(label + ' HTTP ' + response.status);
  return response.json();
}

function selfTest() {
  const strong = revisionScore({epsFy1Revision30dPct:12,opRevision30dPct:8,revenueRevision30dPct:5});
  const weak = revisionScore({epsFy1Revision30dPct:-20,opRevision30dPct:-15,revenueRevision30dPct:-10});
  if (strong !== 25 || weak !== 6) throw new Error('EPS revision score self-test failed');
  if (!validIrEvidence({evidenceId:'x',publishedAt:'2026-10-01',sourceUrl:'https://example.com',sourceType:'company-ir',metric:'backlog',quoteHash:'abc'})) throw new Error('IR evidence self-test failed');
  console.log('AI CAPEX Fundamental Adapter V1 self-test PASS');
}

if (SELF_TEST) {
  selfTest();
  process.exit(0);
}

const epsUrl = process.env.AI_CAPEX_EPS_CONSENSUS_URL || '';
const epsToken = process.env.AI_CAPEX_EPS_CONSENSUS_TOKEN || '';
const irUrl = process.env.AI_CAPEX_IR_EVIDENCE_URL || '';
const irToken = process.env.AI_CAPEX_IR_EVIDENCE_TOKEN || '';

const previousSnapshot = fs.existsSync(OUTPUT) ? readJson(OUTPUT) : { companies: [] };
const previousByTicker = new Map((previousSnapshot.companies || []).map((x) => [x.ticker, x]));

const [epsPayload, irPayload] = await Promise.all([
  fetchProvider(epsUrl, epsToken, 'EPS consensus provider'),
  fetchProvider(irUrl, irToken, 'IR evidence provider')
]);

const input = readJson(INPUT);
const epsByTicker = new Map((epsPayload?.companies || []).map((x) => [x.ticker, x]));
const irByTicker = new Map((irPayload?.companies || []).map((x) => [x.ticker, x]));

const companies = input.companies.map((base) => {
  const previous = previousByTicker.get(base.ticker) || null;
  const eps = epsPayload ? (epsByTicker.get(base.ticker) || null) : (previous?.eps || null);
  const epsFresh = Boolean(eps?.consensusProvider && daysOld(eps?.observedAt) <= MAX_EPS_AGE_DAYS);
  const epsRevisionScore = epsFresh ? revisionScore(eps) : null;
  const evidence = irPayload
    ? (irByTicker.get(base.ticker)?.evidence || []).filter(validIrEvidence)
    : (previous?.irEvidence || []).filter(validIrEvidence);
  const irReady = evidence.length > 0;
  return {
    ticker: base.ticker,
    company: base.company,
    epsReady: epsFresh && epsRevisionScore !== null,
    irReady,
    epsRevisionScore,
    eps: eps ? {
      epsFy1: eps.epsFy1 ?? null,
      epsFy1Revision30dPct: eps.epsFy1Revision30dPct ?? null,
      revenueRevision30dPct: eps.revenueRevision30dPct ?? null,
      opRevision30dPct: eps.opRevision30dPct ?? null,
      consensusProvider: eps.consensusProvider ?? null,
      observedAt: eps.observedAt ?? null
    } : null,
    irEvidence: evidence
  };
});

const snapshot = {
  version: '1.0',
  asOf: epsPayload?.asOf || irPayload?.asOf || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()),
  generatedAt: new Date().toISOString(),
  sourceHealth: {
    eps: epsPayload ? 'LIVE' : 'NOT_CONNECTED',
    ir: irPayload ? 'LIVE' : 'NOT_CONNECTED'
  },
  governance: {
    maxEpsAgeDays: MAX_EPS_AGE_DAYS,
    primarySourceRequiredForUpgrade: true,
    allowedIrSourceTypes: [...ALLOWED_IR_TYPES]
  },
  companies
};

writeJson(OUTPUT, snapshot);
console.log('AI CAPEX Fundamental Adapter updated:', snapshot.asOf, companies.filter((x)=>x.epsReady).length + ' EPS-ready,', companies.filter((x)=>x.irReady).length + ' IR-ready');

import fs from 'node:fs';
import assert from 'node:assert/strict';

const CONFIG_PATH = 'src/data/china-risk-adapter-config.json';
const SNAPSHOT_PATH = 'src/data/china-semiconductor-risk-snapshot.json';
const SELF_TEST = process.argv.includes('--self-test');
const DRY_RUN = process.argv.includes('--dry-run');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const previous = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const nowIso = () => new Date().toISOString();

const decode = (s) => String(s ?? '')
  .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replace(/&nbsp;/g, ' ');

const htmlToText = (html) => decode(html)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sentenceChunks = (text) => text
  .split(/(?<=[.!?])\s+|\s*[•|]\s*/g)
  .map((s) => s.trim())
  .filter(Boolean);

const pctMid = (a, b = a) => Math.round(((Number(a) + Number(b)) / 2) * 10) / 10;
const signed = (direction, value) => /declin|drop|fall|decreas|down/i.test(direction) ? -Math.abs(value) : Math.abs(value);

function dateFromUrl(url) {
  const compact = String(url).match(/\/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const pathDate = String(url).match(/\/(20\d{2})\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\//);
  if (pathDate) return `${pathDate[1]}-${String(pathDate[2]).padStart(2,'0')}-${String(pathDate[3]).padStart(2,'0')}`;
  return null;
}

function parseDate(text) {
  const iso = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
  const en = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i);
  if (en) {
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    return `${en[3]}-${String(months.indexOf(en[1].toLowerCase()) + 1).padStart(2,'0')}-${String(en[2]).padStart(2,'0')}`;
  }
  return null;
}

function sourceMetric(id, value, unit, score, doc, evidence, extra = {}) {
  return {
    status:'OK', id, value, unit, score,
    source:doc.source, sourceUrl:doc.url,
    observedAt: doc.observedAt || null,
    fetchedAt:doc.fetchedAt,
    evidence:evidence.slice(0,240),
    ...extra
  };
}

function scoreShare(v) {
  if (v < 5) return 0;
  if (v < 7.5) return 25;
  if (v < 10) return 50;
  if (v < 15) return 75;
  return 100;
}
function scoreEquipment(v) {
  if (v < 10) return 0;
  if (v < 20) return 25;
  if (v < 35) return 50;
  if (v < 50) return 75;
  return 100;
}
function scoreCapa(v) {
  if (v < 5) return 0;
  if (v < 15) return 25;
  if (v < 25) return 50;
  if (v < 40) return 75;
  return 100;
}
function scoreDramAsp(v) {
  if (v >= 10) return 0;
  if (v >= 0) return 25;
  if (v > -5) return 50;
  if (v > -10) return 75;
  return 100;
}
function scoreNandAsp(v) {
  if (v >= 10) return 0;
  if (v >= 0) return 25;
  if (v > -7.5) return 50;
  if (v > -15) return 75;
  return 100;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': config.userAgent, accept:'text/html,application/xhtml+xml' },
      redirect:'follow',
      signal:controller.signal
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function linksFromHtml(html, base, allowedHosts, keywords) {
  const out = [];
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const url = new URL(decode(m[1]), base);
      if (!allowedHosts.includes(url.hostname)) continue;
      const label = htmlToText(m[2]).toLowerCase();
      const hay = `${label} ${url.pathname.toLowerCase()}`;
      if (!keywords.some((k) => hay.includes(k))) continue;
      out.push(url.toString());
    } catch {}
  }
  return [...new Set(out)];
}

async function collectProvider(name, provider) {
  const fetchedAt = nowIso();
  const docs = [];
  const candidates = new Set(provider.seeds);
  const errors = [];

  for (const url of provider.discovery) {
    try {
      const html = await fetchText(url);
      docs.push({ source:name, url, text:htmlToText(html), html, observedAt:dateFromUrl(url) || parseDate(htmlToText(html)), fetchedAt, kind:'discovery' });
      for (const link of linksFromHtml(html, url, provider.allowHosts, provider.relevantKeywords)) candidates.add(link);
    } catch (error) {
      errors.push({ url, error:error.message });
    }
  }

  const selected = [...candidates]
    .filter((url) => !docs.some((d) => d.url === url))
    .slice(0, config.maxCandidatesPerSource);
  const fetched = await Promise.all(selected.map(async (url) => {
    try {
      const html = await fetchText(url);
      const text = htmlToText(html);
      return { ok:true, doc:{ source:name, url, text, html, observedAt:dateFromUrl(url) || parseDate(text), fetchedAt, kind:'article' } };
    } catch (error) {
      return { ok:false, error:{ url, error:error.message } };
    }
  }));
  for (const item of fetched) {
    if (item.ok) docs.push(item.doc);
    else errors.push(item.error);
  }
  return { docs, errors };
}

const latestMetric = (items) => items
  .filter(Boolean)
  .sort((a,b) => String(b.observedAt ?? '').localeCompare(String(a.observedAt ?? '')))[0] ?? null;

function parseTrendForce(docs) {
  const found = { cxmtShare:[], dramAsp:[], nandAsp:[], equipment:[], cxmtCapa:[] };
  for (const doc of docs) {
    for (const s of sentenceChunks(doc.text)) {
      if (/CXMT/i.test(s) && /DRAM/i.test(s) && /(share|market share|revenue share|점유율)/i.test(s)) {
        const p = s.match(/(?:share|market share|revenue share|점유율)[^%]{0,80}?(\d+(?:\.\d+)?)%|CXMT[^%]{0,120}?(\d+(?:\.\d+)?)%/i);
        const v = Number(p?.[1] ?? p?.[2]);
        if (Number.isFinite(v) && v > 0 && v < 50) found.cxmtShare.push(sourceMetric('cxmtShare',v,'%',scoreShare(v),doc,s));
      }

      if (/DRAM/i.test(s) && /(contract prices?|ASP|average selling price)/i.test(s)) {
        const p = s.match(/DRAM[^.!?]{0,180}?(?:contract prices?|ASP|average selling price)[^.!?]{0,100}?(rise|increase|gain|decline|drop|fall|decrease|down)[^\d]{0,35}(\d+(?:\.\d+)?)\s*[–~-]\s*(\d+(?:\.\d+)?)%/i)
          || s.match(/DRAM[^.!?]{0,180}?(?:contract prices?|ASP|average selling price)[^.!?]{0,100}?(rise|increase|gain|decline|drop|fall|decrease|down)[^\d]{0,35}(\d+(?:\.\d+)?)%/i);
        if (p) {
          const mid = pctMid(p[2], p[3] ?? p[2]);
          const v = signed(p[1], mid);
          found.dramAsp.push(sourceMetric('dramAsp',v,'% QoQ',scoreDramAsp(v),doc,s));
        }
      }

      if (/NAND/i.test(s) && /(contract prices?|ASP|average selling price)/i.test(s)) {
        const p = s.match(/NAND[^.!?]{0,180}?(?:contract prices?|ASP|average selling price)[^.!?]{0,100}?(rise|increase|gain|decline|drop|fall|decrease|down)[^\d]{0,35}(\d+(?:\.\d+)?)\s*[–~-]\s*(\d+(?:\.\d+)?)%/i)
          || s.match(/NAND[^.!?]{0,180}?(?:contract prices?|ASP|average selling price)[^.!?]{0,100}?(rise|increase|gain|decline|drop|fall|decrease|down)[^\d]{0,35}(\d+(?:\.\d+)?)%/i);
        if (p) {
          const mid = pctMid(p[2], p[3] ?? p[2]);
          const v = signed(p[1], mid);
          found.nandAsp.push(sourceMetric('nandAsp',v,'% QoQ',scoreNandAsp(v),doc,s));
        }
      }

      if (/(domestic|Chinese|China)[^.!?]{0,80}(equipment|chip equipment)/i.test(s) && /(adoption|localization|localisation|국산)/i.test(s)) {
        const p = s.match(/(\d+(?:\.\d+)?)%/);
        const v = Number(p?.[1]);
        if (Number.isFinite(v) && v >= 5 && v <= 90) found.equipment.push(sourceMetric('equipment',v,'% adoption',scoreEquipment(v),doc,s));
      }

      if (/CXMT/i.test(s) && /(wafer|wafers)/i.test(s) && /(month|monthly|월)/i.test(s)) {
        const nums = [...s.matchAll(/(\d{2,3})(?:,?000|K)\s*(?:wafers?|wpm)?/gi)].map((m) => Number(m[1]) * 1000);
        if (nums.length >= 2 && nums[0] > 0 && nums[1] > nums[0]) {
          const growth = Math.round(((nums[1] / nums[0]) - 1) * 1000) / 10;
          found.cxmtCapa.push(sourceMetric('cxmtCapa',growth,'% capacity growth',scoreCapa(growth),doc,s,{fromWpm:nums[0],toWpm:nums[1]}));
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(found).map(([k,v]) => [k,latestMetric(v)]));
}

function parseCounterpoint(docs) {
  const found = { ymtcShare:[], enterpriseSsdShare:[] };
  for (const doc of docs) {
    for (const s of sentenceChunks(doc.text)) {
      if (/YMTC/i.test(s) && /(share|shipment|third|3rd|점유율)/i.test(s) && /NAND/i.test(doc.text)) {
        const p = s.match(/YMTC[^%]{0,200}?(\d+(?:\.\d+)?)%|(?:share|점유율)[^%]{0,80}?(\d+(?:\.\d+)?)%/i);
        const v = Number(p?.[1] ?? p?.[2]);
        if (Number.isFinite(v) && v > 0 && v < 50) found.ymtcShare.push(sourceMetric('ymtcShare',v,'% bit shipments',scoreShare(v),doc,s));
      }
      if (/(enterprise SSD|eSSD)/i.test(s) && /(NAND|bits? shipped|shipments?)/i.test(s)) {
        const p = s.match(/(\d+(?:\.\d+)?)%/);
        const v = Number(p?.[1]);
        if (Number.isFinite(v) && v > 5 && v < 90) {
          found.enterpriseSsdShare.push({
            status:'OK', value:v, unit:'% NAND bit shipments', source:doc.source, sourceUrl:doc.url,
            observedAt:doc.observedAt, fetchedAt:doc.fetchedAt, evidence:s.slice(0,240)
          });
        }
      }
    }
    if (!found.ymtcShare.some((item) => item.sourceUrl === doc.url) && /YMTC/i.test(doc.text) && /NAND/i.test(doc.text)) {
      let contextual = null;
      for (const ymtc of doc.text.matchAll(/YMTC/gi)) {
        const start = ymtc.index ?? 0;
        const window = doc.text.slice(start, start + 420);
        const ranked = window.match(/(?:third place|third-place|top\s*3|top three)[^%]{0,140}?(?:with|at)\s+(?:a\s+)?(\d+(?:\.\d+)?)%/i)
          || window.match(/(?:with|at)\s+(?:a\s+)?(\d+(?:\.\d+)?)%[^.!?]{0,100}?(?:shipment share|share|third place|top\s*3|top three)/i)
          || window.match(/(?:shipment share|share)[^%]{0,80}?(\d+(?:\.\d+)?)%/i);
        const v = Number(ranked?.[1]);
        if (Number.isFinite(v) && v > 0 && v < 50) {
          contextual = { value:v, evidence:window.slice(0,240) };
          break;
        }
      }
      const v = contextual?.value;
      if (Number.isFinite(v) && v > 0 && v < 50) found.ymtcShare.push(sourceMetric('ymtcShare',v,'% bit shipments',scoreShare(v),doc,contextual.evidence));
    }
  }
  return Object.fromEntries(Object.entries(found).map(([k,v]) => [k,latestMetric(v)]));
}

function parseBis(docs) {
  const events = [];
  for (const doc of docs) {
    const title = doc.text.match(/(?:FOR IMMEDIATE RELEASE[^]{0,180})?((?:Department|Commerce|BIS)[^.]{15,180}(?:China|Semiconductor|Chip|Export)[^.]{0,100})/i)?.[1]
      || doc.text.slice(0,160);
    const relevant = /(semiconductor|chip|HBM|high-bandwidth memory)/i.test(doc.text) && /(China|PRC)/i.test(doc.text);
    if (!relevant || doc.kind === 'discovery') continue;
    events.push({
      title:title.replace(/\s+/g,' ').trim().slice(0,180),
      observedAt:doc.observedAt,
      sourceUrl:doc.url,
      hbmMention:/high-bandwidth memory|\bHBM\b/i.test(doc.text),
      fetchedAt:doc.fetchedAt
    });
  }
  return events
    .sort((a,b) => String(b.observedAt ?? '').localeCompare(String(a.observedAt ?? '')))
    .filter((item,index,arr) => arr.findIndex((x) => x.sourceUrl === item.sourceUrl) === index)
    .slice(0,10);
}

function preserveOrUnknown(id, metric, errors) {
  if (metric) return metric;
  const prev = previous.metrics?.[id];
  if (prev && prev.status === 'OK') return { ...prev, status:'STALE', staleAt:nowIso(), staleReason:errors.slice(0,2) };
  return { status:'UNKNOWN', id, fetchedAt:nowIso(), errors:errors.slice(0,2) };
}

function selfTest() {
  assert.equal(scoreShare(4.9),0);
  assert.equal(scoreShare(9.5),50);
  assert.equal(scoreShare(15),100);
  assert.equal(scoreDramAsp(13),0);
  assert.equal(scoreDramAsp(-6),75);
  assert.equal(scoreDramAsp(-20),100);
  assert.equal(scoreNandAsp(-22.8),100);
  const tf = parseTrendForce([{source:'trendforce',url:'https://example.com',observedAt:'2026-09-25',fetchedAt:'x',text:'DRAM Industry Revenue Rises 59.5% QoQ. Conventional DRAM contract prices are forecast to rise 13–18% QoQ, while NAND Flash contract prices are expected to increase 10–15% QoQ. CXMT global DRAM revenue share reached 9.5%.',kind:'article'}]);
  assert.equal(tf.dramAsp.value,15.5);
  assert.equal(tf.nandAsp.value,12.5);
  assert.equal(tf.cxmtShare.value,9.5);
  const cp = parseCounterpoint([{source:'counterpoint',url:'https://example.com',observedAt:'2026-08-12',fetchedAt:'x',text:'Server-Led eSSDs Hit 48% of NAND Shipments; YMTC Enters Global Top Three Login Register. NAND market update. YMTC climbed to third place with 14%, narrowly edging Kioxia. enterprise SSDs reached 48% of global NAND bit shipments.',kind:'article'}]);
  assert.equal(cp.ymtcShare.value,14);
  assert.equal(cp.enterpriseSsdShare.value,48);
  console.log('China Risk Data Adapter V1 self-test PASS');
}

if (SELF_TEST) {
  selfTest();
  process.exit(0);
}

const results = {};
for (const [name, provider] of Object.entries(config.sources)) {
  results[name] = await collectProvider(name, provider);
}

const tf = parseTrendForce(results.trendforce.docs);
const cp = parseCounterpoint(results.counterpoint.docs);
const bisEvents = parseBis(results.bis.docs);

const metrics = {
  cxmtShare:preserveOrUnknown('cxmtShare',tf.cxmtShare,results.trendforce.errors),
  ymtcShare:preserveOrUnknown('ymtcShare',cp.ymtcShare,results.counterpoint.errors),
  dramAsp:preserveOrUnknown('dramAsp',tf.dramAsp,results.trendforce.errors),
  nandAsp:preserveOrUnknown('nandAsp',tf.nandAsp,results.trendforce.errors),
  equipment:preserveOrUnknown('equipment',tf.equipment,results.trendforce.errors),
  cxmtCapa:preserveOrUnknown('cxmtCapa',tf.cxmtCapa,results.trendforce.errors)
};
const metricValues = Object.values(metrics);
const metricsReady = metricValues.filter((m) => m.status === 'OK').length;
const stale = metricValues.filter((m) => m.status === 'STALE').length;

const snapshot = {
  version:'1.0',
  generatedAt:nowIso(),
  ready:metricsReady >= 4,
  coverage:{ metricsReady, metricsStale:stale, metricsTotal:metricValues.length },
  metrics,
  auxiliary:{
    enterpriseSsdShare:cp.enterpriseSsdShare ?? previous.auxiliary?.enterpriseSsdShare ?? {status:'UNKNOWN'},
    bisEvents:bisEvents.length ? bisEvents : (previous.auxiliary?.bisEvents ?? [])
  },
  provenance:Object.entries(results).map(([source,result]) => ({
    source, documentsFetched:result.docs.length, errors:result.errors
  }))
};

const output = `${JSON.stringify(snapshot,null,2)}\n`;
if (DRY_RUN) {
  process.stdout.write(output);
} else {
  fs.writeFileSync(SNAPSHOT_PATH, output, 'utf8');
  console.log(`China Risk Data Adapter V1: READY=${snapshot.ready} OK=${metricsReady}/${metricValues.length} STALE=${stale}; BIS events=${snapshot.auxiliary.bisEvents.length}`);
}

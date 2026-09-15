import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const value = (flag, fallback = '') => {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function reviewVersion(pack) {
  const channels = Object.fromEntries(Object.entries(pack.channels || {}).map(([name, cfg]) => [name, {
    variants: (cfg.variants || []).map(({ id, title, body, cta, hashtags, utmUrl }) => ({ id, title, body, cta, hashtags, utmUrl }))
  }]));
  return crypto.createHash('sha256').update(JSON.stringify({
    articleSlug: pack.articleSlug,
    campaign: pack.campaign,
    sourceUrl: pack.sourceUrl,
    channels
  })).digest('hex').slice(0, 16);
}

function staticReviewRuntime() {
  const baseline = JSON.parse(document.getElementById('baseline').textContent);
  const storageKey = document.body.dataset.storageKey;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const load = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || clone(baseline); }
    catch { return clone(baseline); }
  };
  let pack = load();
  const toast = (msg) => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 1600);
  };
  const escHtml = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const approved = () => ['APPROVED','PUBLISHED','MEASURED'].includes(pack.state) && pack.approval?.approved;
  const setState = (state) => {
    pack.state = state;
    for (const channel of Object.values(pack.channels || {})) channel.status = state;
  };
  const save = () => {
    pack.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(pack));
    render();
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('복사했습니다.');
    } catch {
      toast('복사 권한이 없습니다. 텍스트를 길게 눌러 복사하세요.');
    }
  };
  const download = (name, content, type = 'application/json') => {
    const a = document.createElement('a');
    const href = URL.createObjectURL(new Blob([content], { type }));
    a.href = href;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 500);
  };
  const findVariant = (channel, id) => pack.channels[channel]?.variants?.find((v) => v.id === id);

  function recordPublished(channel, id, url) {
    if (!approved()) return toast('APPROVED 이후에만 기록할 수 있습니다.');
    let parsed;
    try { parsed = new URL(url); }
    catch { return toast('올바른 게시 URL을 입력하세요.'); }
    if (!/^https?:$/.test(parsed.protocol)) return toast('http/https URL만 허용됩니다.');
    const variant = findVariant(channel, id);
    if (!variant) return;
    const publishedAt = new Date().toISOString();
    variant.publishedUrl = parsed.toString();
    variant.publishedAt = publishedAt;
    setState('PUBLISHED');
    pack.publishLog = Array.isArray(pack.publishLog) ? pack.publishLog : [];
    pack.publishLog.push({
      articleSlug: pack.articleSlug,
      campaign: pack.campaign,
      channel,
      variantId: id,
      publishedUrl: variant.publishedUrl,
      publishedAt
    });
    save();
    toast('게시 URL을 기록했습니다.');
  }

  function render() {
    document.getElementById('stateBadge').textContent = 'State: ' + pack.state;
    document.getElementById('reviewBtn').classList.toggle('disabled', pack.state !== 'DRAFT');
    document.getElementById('approveBtn').classList.toggle('disabled', pack.state !== 'REVIEW');
    const root = document.getElementById('cards');
    root.innerHTML = '';
    Object.entries(pack.channels).forEach(([channel, cfg]) => {
      cfg.variants.forEach((variant) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.channel = channel;
        const copyText = [variant.title, variant.body, variant.cta, (variant.hashtags || []).join(' '), variant.utmUrl].filter(Boolean).join('\n\n');
        const published = variant.publishedUrl
          ? '<div class="published">게시됨 · ' + escHtml(variant.publishedAt || '') + '<br>' + escHtml(variant.publishedUrl) + '</div>'
          : '';
        const disabled = approved() ? '' : ' disabled';
        card.innerHTML = '<div class="eyebrow">' + escHtml(channel) + ' · ' + escHtml(variant.id) + '</div>' +
          '<h3>' + escHtml(variant.title || '(제목 없음)') + '</h3>' +
          '<div class="body">' + escHtml(variant.body || '') + '</div>' +
          '<p><strong>CTA</strong> ' + escHtml(variant.cta || '') + '</p>' +
          '<p class="meta">' + escHtml((variant.hashtags || []).join(' ')) + '</p>' +
          '<p class="meta">' + escHtml(variant.utmUrl || '') + '</p>' +
          '<div class="actions"><button data-copy="text">문안+링크 복사</button><button class="secondary" data-copy="url">UTM만 복사</button></div>' +
          '<div class="urlrow"><input type="url" inputmode="url" autocapitalize="none" placeholder="실제 게시 URL" value="' + escHtml(variant.publishedUrl || '') + '"' + disabled + '>' +
          '<div class="actions"><button data-record' + disabled + '>게시 URL 기록</button></div></div>' + published;
        card.querySelector('[data-copy="text"]').onclick = () => copy(copyText);
        card.querySelector('[data-copy="url"]').onclick = () => copy(variant.utmUrl || '');
        card.querySelector('[data-record]').onclick = () => recordPublished(channel, variant.id, card.querySelector('input').value.trim());
        root.appendChild(card);
      });
    });
    const filter = document.getElementById('channelFilter')?.value || 'all';
    root.querySelectorAll('.card').forEach((card) => { card.hidden = filter !== 'all' && card.dataset.channel !== filter; });
  }

  document.getElementById('channelFilter').onchange = render;
  document.getElementById('reviewBtn').onclick = () => {
    if (pack.state !== 'DRAFT') return;
    setState('REVIEW');
    save();
    toast('REVIEW로 전환했습니다.');
  };
  document.getElementById('approveBtn').onclick = () => {
    if (pack.state !== 'REVIEW') return;
    const approvedAt = new Date().toISOString();
    setState('APPROVED');
    pack.approval = { approved: true, approvedBy: 'mobile-reviewer', approvedAt };
    save();
    toast('APPROVED로 승인했습니다.');
  };
  document.getElementById('downloadPack').onclick = () => download('distribution-pack.updated.json', JSON.stringify(pack, null, 2) + '\n');
  document.getElementById('downloadLog').onclick = () => {
    const rows = pack.publishLog || [];
    download('publish-log.ndjson', rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''), 'application/x-ndjson');
  };
  document.getElementById('resetBtn').onclick = () => {
    if (!confirm('이 기기에 저장된 검토 상태를 원본으로 되돌릴까요?')) return;
    pack = clone(baseline);
    localStorage.removeItem(storageKey);
    render();
    toast('원본으로 초기화했습니다.');
  };
  render();
}

function buildHtml(pack) {
  const embedded = JSON.stringify(pack).replaceAll('<', '\\u003c');
  const version = reviewVersion(pack);
  const storageKey = `joylab-distribution-review:${pack.articleSlug}:${pack.campaign}:${version}`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#0B1F4D">
<title>JoyLab Distribution Review · ${esc(pack.articleSlug)}</title>
<style>
:root{color-scheme:light;--navy:#0B1F4D;--blue:#1677FF;--line:#DDE6F2;--muted:#66758F;--soft:#F5F8FD;--ok:#0A7A45}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--navy);background:#fff}.wrap{max-width:1180px;margin:0 auto;padding:24px 16px calc(80px + env(safe-area-inset-bottom))}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--blue);text-transform:uppercase}h1{font-size:clamp(22px,5vw,38px);line-height:1.18;margin:.35rem 0;overflow-wrap:anywhere}.state{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:var(--soft);font-weight:800;white-space:nowrap}.notice{margin:18px 0;padding:14px 16px;background:var(--soft);border-left:4px solid var(--blue);line-height:1.6}.mobilebar{position:sticky;top:0;z-index:20;margin:0 -16px 18px;padding:10px 16px;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}.toolbar{display:flex;flex-wrap:wrap;gap:8px}.filterrow{display:flex;gap:8px;align-items:center;margin-top:10px}.filterrow select{flex:1;min-height:44px;padding:10px 12px;border:1px solid #C9D6E8;border-radius:10px;background:#fff;color:var(--navy);font-weight:700}button{appearance:none;border:0;border-radius:10px;min-height:44px;padding:10px 14px;font-weight:800;cursor:pointer;background:var(--navy);color:#fff;font-size:14px}.secondary{background:#EAF2FF;color:var(--navy)}.danger{background:#FFF2F0;color:#9B2C21}.disabled{opacity:.45;pointer-events:none}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid var(--line);border-radius:18px;padding:18px;background:#fff}.card h3{margin:.45rem 0 1rem;font-size:20px}.body{white-space:pre-wrap;line-height:1.65;color:#23375D}.meta{font-size:13px;color:var(--muted);overflow-wrap:anywhere}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.actions button{flex:1 1 150px}.urlrow{margin-top:14px}.urlrow input{width:100%;min-height:46px;padding:11px 12px;border:1px solid #C9D6E8;border-radius:9px;font-size:16px}.published{margin-top:10px;font-size:13px;color:var(--ok);overflow-wrap:anywhere}.help{margin-top:30px;border-top:1px solid var(--line);padding-top:18px;color:var(--muted);line-height:1.7}.toast{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:50;background:var(--navy);color:#fff;padding:12px 14px;border-radius:10px;box-shadow:0 10px 30px rgba(11,31,77,.22);display:none;text-align:center}.statusline{font-size:13px;color:var(--muted);margin-top:8px}@media(max-width:760px){.top{display:block}.state{margin-top:10px}.grid{grid-template-columns:1fr}.card{padding:16px}.toolbar button{flex:1 1 calc(50% - 8px)}.toolbar .danger{flex-basis:100%}}
</style>
</head>
<body data-storage-key="${esc(storageKey)}">
<div class="wrap">
  <div class="top"><div><div class="eyebrow">JoyLab Distribution Review Mobile V1</div><h1>${esc(pack.articleSlug)}</h1><div class="statusline">Campaign: ${esc(pack.campaign)} · Review ${esc(version)}</div></div><div class="state" id="stateBadge"></div></div>
  <div class="notice"><strong>자동 게시 OFF.</strong> 승인·게시 URL은 이 휴대폰 브라우저에 저장됩니다. 문안이 실제로 바뀌면 새 검토 버전으로 자동 분리됩니다.</div>
  <div class="mobilebar"><div class="toolbar"><button id="reviewBtn">REVIEW</button><button id="approveBtn">APPROVE</button><button id="downloadPack" class="secondary">Pack 저장</button><button id="downloadLog" class="secondary">Log 저장</button><button id="resetBtn" class="danger">검토 초기화</button></div><div class="filterrow"><label for="channelFilter"><strong>채널</strong></label><select id="channelFilter"><option value="all">전체</option><option value="threads">Threads</option><option value="x">X</option><option value="linkedin">LinkedIn</option><option value="naver">Naver</option></select></div></div>
  <div class="grid" id="cards"></div>
  <div class="help"><strong>모바일 운영 순서</strong><br>문안 확인 → REVIEW → APPROVE → 문안+링크 복사 → 해당 앱에서 수동 게시 → 돌아와 실제 게시 URL 기록.</div>
</div>
<div class="toast" id="toast"></div>
<script type="application/json" id="baseline">${embedded}</script>
<script>(${staticReviewRuntime.toString()})();</script>
</body>
</html>`;
}

if (args.includes('--self-test')) {
  const sample = {
    articleSlug:'demo',
    campaign:'research_demo',
    generatedAt:'2026-09-15T00:00:00.000Z',
    state:'DRAFT',
    approval:{approved:false},
    channels:{threads:{status:'DRAFT',variants:[{id:'threads_hook_a',title:'<demo>',body:'body',cta:'cta',hashtags:['#demo'],utmUrl:'https://aijoylab.kr/articles/demo?utm_source=threads',publishedUrl:null,publishedAt:null}]}},
    publishLog:[]
  };
  const html = buildHtml(sample);
  for (const token of ['Review Mobile V1','APPROVE','distribution-pack.updated.json','localStorage','threads_hook_a','noindex,nofollow','channelFilter','Object.values(pack.channels']) {
    if (!html.includes(token)) throw new Error(`Static review self-test failed: ${token}`);
  }
  if (html.includes('<demo>')) throw new Error('Static review HTML escaping self-test failed.');
  const versionA = reviewVersion(sample);
  const changed = structuredClone(sample);
  changed.channels.threads.variants[0].body = 'changed';
  if (versionA === reviewVersion(changed)) throw new Error('Review content fingerprint self-test failed.');
  console.log('Static distribution review self-test passed.');
  process.exit(0);
}

const manifestArg = value('--manifest');
const outArg = value('--out');
if (!manifestArg || !outArg) throw new Error('Usage: node scripts/build-distribution-review-html.mjs --manifest <distribution-pack.json> --out <review.html>');
const manifestPath = path.resolve(manifestArg);
const outPath = path.resolve(outArg);
const pack = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!pack.articleSlug || !pack.channels || !pack.campaign) throw new Error('Invalid distribution pack.');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buildHtml(pack));
console.log(`Static distribution review created: ${path.relative(process.cwd(), outPath)}`);

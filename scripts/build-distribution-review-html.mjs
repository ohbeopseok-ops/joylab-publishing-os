import fs from 'node:fs';
import path from 'node:path';

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

function buildHtml(pack) {
  const embedded = JSON.stringify(pack).replaceAll('<', '\\u003c');
  const storageKey = `joylab-distribution-review:${pack.articleSlug}:${pack.campaign}`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JoyLab Distribution Review · ${esc(pack.articleSlug)}</title>
<style>
:root{color-scheme:light;--navy:#0B1F4D;--blue:#1677FF;--line:#DDE6F2;--muted:#66758F;--soft:#F5F8FD;--ok:#0A7A45;--warn:#A56600}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--navy);background:#fff}.wrap{max-width:1180px;margin:0 auto;padding:32px 20px 56px}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--blue)}h1{font-size:clamp(24px,4vw,40px);line-height:1.15;margin:.35rem 0}.state{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:var(--soft);font-weight:800}.notice{margin:22px 0;padding:14px 16px;background:var(--soft);border-left:4px solid var(--blue);line-height:1.6}.toolbar{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 28px}button,.button{appearance:none;border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer;background:var(--navy);color:#fff;text-decoration:none;font-size:14px}.secondary{background:#EAF2FF;color:var(--navy)}.danger{background:#FFF2F0;color:#9B2C21}.disabled{opacity:.45;pointer-events:none}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid var(--line);border-radius:18px;padding:18px;background:#fff}.card h3{margin:.45rem 0 1rem;font-size:20px}.body{white-space:pre-wrap;line-height:1.65;color:#23375D}.meta{font-size:13px;color:var(--muted);overflow-wrap:anywhere}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.urlrow{margin-top:14px}.urlrow input{width:100%;padding:11px;border:1px solid #C9D6E8;border-radius:9px}.published{margin-top:10px;font-size:13px;color:var(--ok);overflow-wrap:anywhere}.help{margin-top:30px;border-top:1px solid var(--line);padding-top:18px;color:var(--muted);line-height:1.7}.toast{position:fixed;right:18px;bottom:18px;background:var(--navy);color:#fff;padding:11px 14px;border-radius:10px;box-shadow:0 10px 30px rgba(11,31,77,.22);display:none}.statusline{font-size:13px;color:var(--muted);margin-top:8px}@media(max-width:760px){.top{display:block}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><div><div class="eyebrow">DISTRIBUTION EXECUTION LAYER V1 · STATIC REVIEW</div><h1>${esc(pack.articleSlug)}</h1><div class="statusline">Campaign: ${esc(pack.campaign)}</div></div><div class="state" id="stateBadge"></div></div>
  <div class="notice"><strong>자동 게시 OFF.</strong> 이 HTML은 네트워크 호출 없이 브라우저 안에서만 동작합니다. 승인·게시 URL은 이 기기의 localStorage에 임시 저장되며, 운영 기록 반영은 <strong>업데이트된 Pack 다운로드</strong>로 내보냅니다.</div>
  <div class="toolbar">
    <button id="reviewBtn">REVIEW로 전환</button>
    <button id="approveBtn">APPROVED로 승인</button>
    <button id="downloadPack" class="secondary">업데이트된 Pack 다운로드</button>
    <button id="downloadLog" class="secondary">Publish Log 다운로드</button>
    <button id="resetBtn" class="danger">Artifact 원본으로 초기화</button>
  </div>
  <div class="grid" id="cards"></div>
  <div class="help"><strong>운영 순서</strong><br>1) 문안을 확인하고 복사 → 2) REVIEW → APPROVED → 3) Threads/X/LinkedIn/Naver에 사람이 직접 게시 → 4) 실제 게시 URL 기록 → 5) 업데이트된 Pack을 다운로드해 운영 기록으로 보관합니다.</div>
</div>
<div class="toast" id="toast"></div>
<script type="application/json" id="baseline">${embedded}</script>
<script>
(() => {
  const baseline = JSON.parse(document.getElementById('baseline').textContent);
  const storageKey = ${JSON.stringify(storageKey)};
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const load = () => { try { return JSON.parse(localStorage.getItem(storageKey)) || clone(baseline); } catch { return clone(baseline); } };
  let pack = load();
  const save = () => { pack.updatedAt = new Date().toISOString(); localStorage.setItem(storageKey, JSON.stringify(pack)); render(); };
  const toast = (msg) => { const el=document.getElementById('toast'); el.textContent=msg; el.style.display='block'; setTimeout(()=>el.style.display='none',1600); };
  const escHtml = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const copy = async (text) => { await navigator.clipboard.writeText(text); toast('복사했습니다.'); };
  const download = (name, content, type='application/json') => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); };
  const findVariant = (channel,id) => pack.channels[channel]?.variants?.find(v=>v.id===id);
  const approved = () => ['APPROVED','PUBLISHED','MEASURED'].includes(pack.state) && pack.approval?.approved;

  function recordPublished(channel,id,url){
    if(!approved()) return toast('APPROVED 이후에만 기록할 수 있습니다.');
    let parsed; try { parsed=new URL(url); } catch { return toast('올바른 게시 URL을 입력하세요.'); }
    if(!/^https?:$/.test(parsed.protocol)) return toast('http/https URL만 허용됩니다.');
    const v=findVariant(channel,id); if(!v) return;
    const at=new Date().toISOString(); v.publishedUrl=parsed.toString(); v.publishedAt=at;
    pack.channels[channel].status='PUBLISHED'; pack.state='PUBLISHED';
    pack.publishLog = Array.isArray(pack.publishLog) ? pack.publishLog : [];
    pack.publishLog.push({articleSlug:pack.articleSlug,campaign:pack.campaign,channel,variantId:id,publishedUrl:v.publishedUrl,publishedAt:at});
    save(); toast('게시 URL을 기록했습니다.');
  }

  function render(){
    document.getElementById('stateBadge').textContent = `State: ${pack.state}`;
    document.getElementById('reviewBtn').classList.toggle('disabled', pack.state !== 'DRAFT');
    document.getElementById('approveBtn').classList.toggle('disabled', pack.state !== 'REVIEW');
    const root=document.getElementById('cards'); root.innerHTML='';
    Object.entries(pack.channels).forEach(([channel,cfg]) => cfg.variants.forEach(v => {
      const card=document.createElement('article'); card.className='card';
      const copyText=[v.title,v.body,v.cta,(v.hashtags||[]).join(' '),v.utmUrl].filter(Boolean).join('\n\n');
      card.innerHTML=`<div class="eyebrow">${escHtml(channel)} · ${escHtml(v.id)}</div><h3>${escHtml(v.title||'(제목 없음)')}</h3><div class="body">${escHtml(v.body||'')}</div><p><strong>CTA</strong> ${escHtml(v.cta||'')}</p><p class="meta">${escHtml((v.hashtags||[]).join(' '))}</p><p class="meta">${escHtml(v.utmUrl||'')}</p><div class="actions"><button data-copy="text">문안+링크 복사</button><button class="secondary" data-copy="url">UTM만 복사</button></div><div class="urlrow"><input type="url" placeholder="실제 게시 URL" value="${escHtml(v.publishedUrl||'')}" ${approved()?'':'disabled'}><div class="actions"><button data-record ${approved()?'':'disabled'}>게시 URL 기록</button></div></div>${v.publishedUrl?`<div class="published">게시됨 · ${escHtml(v.publishedAt||'')}<br>${escHtml(v.publishedUrl)}</div>`:''}`;
      card.querySelector('[data-copy="text"]').onclick=()=>copy(copyText);
      card.querySelector('[data-copy="url"]').onclick=()=>copy(v.utmUrl||'');
      card.querySelector('[data-record]').onclick=()=>recordPublished(channel,v.id,card.querySelector('input').value.trim());
      root.appendChild(card);
    }));
  }

  document.getElementById('reviewBtn').onclick=()=>{ if(pack.state!=='DRAFT') return; pack.state='REVIEW'; save(); toast('REVIEW로 전환했습니다.'); };
  document.getElementById('approveBtn').onclick=()=>{ if(pack.state!=='REVIEW') return; const at=new Date().toISOString(); pack.state='APPROVED'; pack.approval={approved:true,approvedBy:'static-reviewer',approvedAt:at}; save(); toast('APPROVED로 승인했습니다.'); };
  document.getElementById('downloadPack').onclick=()=>download('distribution-pack.updated.json',JSON.stringify(pack,null,2)+'\n');
  document.getElementById('downloadLog').onclick=()=>download('publish-log.ndjson',(pack.publishLog||[]).map(r=>JSON.stringify(r)).join('\n')+((pack.publishLog||[]).length?'\n':''),'application/x-ndjson');
  document.getElementById('resetBtn').onclick=()=>{ if(!confirm('이 브라우저에 저장된 검토 상태를 Artifact 원본으로 되돌릴까요?')) return; pack=clone(baseline); localStorage.removeItem(storageKey); render(); toast('원본으로 초기화했습니다.'); };
  render();
})();
</script>
</body>
</html>`;
}

if (args.includes('--self-test')) {
  const sample = { articleSlug:'demo', campaign:'research_demo', state:'DRAFT', approval:{approved:false}, channels:{threads:{status:'DRAFT',variants:[{id:'threads_hook_a',title:'<demo>',body:'body',cta:'cta',hashtags:['#demo'],utmUrl:'https://aijoylab.kr/articles/demo?utm_source=threads',publishedUrl:null,publishedAt:null}]}}, publishLog:[] };
  const html = buildHtml(sample);
  for (const token of ['STATIC REVIEW','APPROVED로 승인','distribution-pack.updated.json','localStorage','threads_hook_a']) if (!html.includes(token)) throw new Error(`Static review self-test failed: ${token}`);
  if (html.includes('<demo>')) throw new Error('Static review HTML escaping self-test failed.');
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

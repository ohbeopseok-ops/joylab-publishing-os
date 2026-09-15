import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { transitionPack } from './distribution-state.mjs';
import { createPublishHandoff } from './distribution-adapters.mjs';
import { recordPublished } from './distribution-publish-log.mjs';

const args = process.argv.slice(2);
const argValue = (flag, fallback) => { const i = args.indexOf(flag); return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback; };
const file = argValue('--manifest');
const port = Number(argValue('--port', '4178'));
if (!file || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Usage: node scripts/distribution-review-server.mjs --manifest <distribution-pack.json> [--port 4178]');
const manifestPath = path.resolve(file);

const read = () => JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const write = (pack) => fs.writeFileSync(manifestPath, `${JSON.stringify(pack, null, 2)}\n`);
const esc = (value='') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const formBody = (req) => new Promise((resolve) => { let data=''; req.on('data', c => data += c); req.on('end', () => resolve(new URLSearchParams(data))); });

function render(pack, message='') {
  const canPublish = ['APPROVED', 'PUBLISHED'].includes(pack.state) && pack.approval?.approved;
  const cards = Object.entries(pack.channels).flatMap(([channel, cfg]) => cfg.variants.map((v) => `
    <article class="card"><div class="eyebrow">${esc(channel)} · ${esc(v.id)}</div><h3>${esc(v.title || '(제목 없음)')}</h3><pre>${esc(v.body)}</pre><p><strong>CTA</strong> ${esc(v.cta)}</p><p>${esc((v.hashtags||[]).join(' '))}</p><a href="${esc(v.utmUrl)}" target="_blank">UTM 원문 확인 ↗</a>
    ${canPublish ? `<form method="post" action="/handoff"><input type="hidden" name="channel" value="${esc(channel)}"><input type="hidden" name="variant" value="${esc(v.id)}"><button>Publish handoff 생성</button></form>
    <form method="post" action="/published"><input type="hidden" name="channel" value="${esc(channel)}"><input type="hidden" name="variant" value="${esc(v.id)}"><input class="url" type="url" name="url" required placeholder="실제 게시 URL" value="${esc(v.publishedUrl || '')}"><button>게시 완료 URL 기록</button></form>` : ''}
    ${v.publishedUrl ? `<p class="published">게시됨 · <a href="${esc(v.publishedUrl)}" target="_blank">${esc(v.publishedUrl)}</a></p>` : ''}
    </article>`)).join('');
  const next = ({DRAFT:'REVIEW', REVIEW:'APPROVED', APPROVED:null, PUBLISHED:'MEASURED', MEASURED:null})[pack.state];
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>JoyLab Distribution Review</title><style>body{font-family:system-ui,sans-serif;max-width:1180px;margin:40px auto;padding:0 20px;color:#0b1f4d}header{display:flex;justify-content:space-between;gap:20px;align-items:end}.state{font-weight:800;color:#1677ff}.notice{background:#f3f7ff;padding:14px 16px;border-left:4px solid #1677ff}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px}.card{border:1px solid #dbe6f5;border-radius:16px;padding:18px}.eyebrow{font-size:12px;font-weight:800;color:#1677ff;text-transform:uppercase}pre{white-space:pre-wrap;font:inherit;line-height:1.6}button{margin-top:12px;padding:10px 14px;border:0;border-radius:10px;background:#0b1f4d;color:white;font-weight:700;cursor:pointer}.url{box-sizing:border-box;width:100%;margin-top:12px;padding:10px;border:1px solid #cbd9ec;border-radius:8px}.published{font-size:13px;overflow-wrap:anywhere}form.inline{display:inline-block;margin-right:8px}@media(max-width:760px){.grid{grid-template-columns:1fr}header{display:block}}</style><body><header><div><div class="eyebrow">DISTRIBUTION EXECUTION LAYER V1</div><h1>${esc(pack.articleSlug)}</h1></div><div>State: <span class="state">${esc(pack.state)}</span></div></header><p class="notice">자동 게시 OFF. APPROVED 이전에는 Publish handoff를 생성하거나 게시 완료 URL을 기록할 수 없습니다. ${esc(message)}</p>${next ? `<form class="inline" method="post" action="/transition"><input type="hidden" name="to" value="${next}"><button>${next}로 전환</button></form>` : ''}<div class="grid">${cards}</div></body></html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') { res.writeHead(200, {'content-type':'text/html; charset=utf-8'}); return res.end(render(read())); }
    if (req.method === 'POST' && req.url === '/transition') {
      const body = await formBody(req); const pack = read(); transitionPack(pack, body.get('to'), 'local-reviewer'); write(pack);
      res.writeHead(303, { location:'/' }); return res.end();
    }
    if (req.method === 'POST' && req.url === '/handoff') {
      const body = await formBody(req); const pack = read(); const handoff = createPublishHandoff(pack, body.get('channel'), body.get('variant'));
      const outDir = path.join(path.dirname(manifestPath), 'handoffs'); fs.mkdirSync(outDir,{recursive:true}); const out = path.join(outDir, `${handoff.channel}-${handoff.variantId}.json`); fs.writeFileSync(out, `${JSON.stringify(handoff,null,2)}\n`);
      res.writeHead(200, {'content-type':'text/html; charset=utf-8'}); return res.end(render(pack, `handoff 생성: ${out}`));
    }
    if (req.method === 'POST' && req.url === '/published') {
      const body = await formBody(req); const pack = read();
      const row = recordPublished(pack, { channel: body.get('channel'), variantId: body.get('variant'), publishedUrl: body.get('url'), publishedAt: new Date().toISOString() });
      write(pack);
      const logFile = path.join(path.dirname(manifestPath), 'publish-log.ndjson'); fs.appendFileSync(logFile, `${JSON.stringify(row)}\n`);
      res.writeHead(303, { location:'/' }); return res.end();
    }
    res.writeHead(404); res.end('Not found');
  } catch (error) { res.writeHead(400, {'content-type':'text/plain; charset=utf-8'}); res.end(error.message); }
});
server.listen(port, '127.0.0.1', () => console.log(`JoyLab Distribution Review: http://127.0.0.1:${port}`));

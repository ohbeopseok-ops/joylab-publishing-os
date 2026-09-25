import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://aijoylab.kr';
const targets = [
  { route: '/guides/ai-inference-memory', schemas: ['BreadcrumbList','FAQPage'] },
  { route: '/articles/ai-agent-hbm-demand', schemas: ['Article'] },
  { route: '/articles/hbm3e-hbm4-zhbm', schemas: ['Article'] },
  { route: '/articles/ai-inference-hbm-earnings', schemas: ['Article'] }
];

const outDir = path.join(process.cwd(), 'qa-artifacts/ai-memory-production-smoke');
fs.mkdirSync(outDir, { recursive: true });

function schemaTypes(html){
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  const types = new Set();
  for (const raw of blocks) {
    try {
      const data = JSON.parse(raw);
      const walk = (v) => {
        if (!v || typeof v !== 'object') return;
        if (Array.isArray(v)) return v.forEach(walk);
        if (v['@type']) {
          const vals = Array.isArray(v['@type']) ? v['@type'] : [v['@type']];
          vals.forEach(x=>types.add(String(x)));
        }
        Object.values(v).forEach(walk);
      };
      walk(data);
    } catch {}
  }
  return [...types];
}

function canonicalOf(html){
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return m?.[1] ?? null;
}

const results = [];
let failed = false;

for (const target of targets) {
  const url = ORIGIN + target.route;
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache', 'user-agent': 'JoyLab-Production-Smoke/1.0' } });
  const html = await res.text();
  const canonical = canonicalOf(html);
  const types = schemaTypes(html);
  const expectedCanonical = url;
  const schemaOk = target.schemas.every(t => types.includes(t)) || (target.route.startsWith('/articles/') && (types.includes('Article') || types.includes('BlogPosting')));

  const row = {
    route: target.route,
    status: res.status,
    contentType: res.headers.get('content-type'),
    canonical,
    expectedCanonical,
    schemaTypes: types,
    checks: {
      http200: res.status === 200,
      canonical: canonical === expectedCanonical,
      jsonLd: schemaOk
    }
  };
  if (!Object.values(row.checks).every(Boolean)) failed = true;
  results.push(row);
}

const sitemapUrl = ORIGIN + '/sitemap.xml';
const sitemapRes = await fetch(sitemapUrl, { headers: { 'cache-control': 'no-cache', 'user-agent': 'JoyLab-Production-Smoke/1.0' } });
const sitemap = await sitemapRes.text();
const sitemapChecks = Object.fromEntries(targets.map(t => [t.route, sitemap.includes('<loc>'+ORIGIN+t.route+'</loc>')]));
if (sitemapRes.status !== 200 || !Object.values(sitemapChecks).every(Boolean)) failed = true;

const report = {
  checkedAt: new Date().toISOString(),
  origin: ORIGIN,
  targets: results,
  sitemap: {
    status: sitemapRes.status,
    checks: sitemapChecks
  },
  result: failed ? 'FAIL' : 'PASS'
};

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2)+'\n');
console.log(JSON.stringify(report, null, 2));
if (failed) process.exit(1);

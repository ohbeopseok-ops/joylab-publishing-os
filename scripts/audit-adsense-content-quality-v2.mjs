import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleDir = path.join(root, 'src', 'data', 'articles');
const outDir = path.join(root, 'qa-artifacts', 'adsense-content-quality-audit-v2');
fs.mkdirSync(outDir, { recursive: true });

const primaryDomains = [
  'dart.fss.or.kr','kind.krx.co.kr','krx.co.kr','sec.gov','federalreserve.gov',
  'bls.gov','bea.gov','treasury.gov','bok.or.kr','kosis.kr','motie.go.kr',
  'msit.go.kr','mof.go.kr','samsung.com','skhynix.com','apple.com','openai.com',
  'anthropic.com','googleblog.com','blog.google',
  'iea.org','energy.gov','uptimeinstitute.com','gevernova.com','vertiv.com',
  'nvidia.com','nvidianews.nvidia.com','developer.nvidia.com',
  'cxmt.com','ymtc.com','samsungsem.com',
  'hd-hyundaielectric.com','hyundai-electric.com','doosanenerbility.com',
  'hyosungheavyindustries.com','ls-electric.com','lsholdings.co.kr','lsholdings.com',
  'hd-hhi.com','hdksoe.co.kr','samsungshi.com','hanwhaocean.com','esg.hd.com'
];

const riskyFinancePatterns = [
  '지금 사야','당장 매수','무조건 매수','전량 매도','풀매수','몰빵',
  '상승 확정','하락 확정','목표가 확정','오를 수밖에 없다'
];

const stop = new Set([
  '무엇인가','왜','어떻게','전망','분석','가이드','정리','비교','2026','년','월',
  '주가','투자','ai','the','a','an','is','what','how','why'
]);

function parse(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fm = m?.[1] || '';
  const body = m ? text.slice(m[0].length) : text;
  const get = (key) => {
    const x = fm.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
    return x ? x[1].trim().replace(/^['"]|['"]$/g, '') : '';
  };
  return {
    title:get('title'),
    description:get('description'),
    category:get('category'),
    draft:/^draft:\s*true\s*$/m.test(fm),
    body
  };
}

function titleTokens(title) {
  return new Set(String(title || '')
    .toLocaleLowerCase('ko-KR')
    .normalize('NFKC')
    .replace(/[^0-9a-z가-힣]+/gi,' ')
    .split(/\s+/)
    .filter((x) => x.length >= 2 && !stop.has(x)));
}

function similarity(a,b) {
  const A=titleTokens(a), B=titleTokens(b);
  if (A.size < 2 || B.size < 2) return 0;
  let inter=0;
  for (const x of A) if (B.has(x)) inter++;
  const union=A.size+B.size-inter;
  const jaccard=union ? inter/union : 0;
  const containment=inter/Math.min(A.size,B.size);
  return Math.max(jaccard, containment * 0.9);
}

function extractUrls(text) {
  return [...text.matchAll(/https?:\/\/[^\s)\]>"']+/g)].map((m)=>m[0].replace(/[.,;:]$/,''));
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./,'').toLowerCase(); }
  catch { return ''; }
}

const files=fs.readdirSync(articleDir).filter(x=>x.endsWith('.md')).sort();
const records=[];

for (const file of files) {
  const full=path.join(articleDir,file);
  const text=fs.readFileSync(full,'utf8');
  const p=parse(text);
  if (p.draft) continue;

  const compact=p.body.replace(/\s+/g,'');
  const h2=(p.body.match(/^##\s+/gm)||[]).length;
  const urls=extractUrls(p.body);
  const uniqueDomains=[...new Set(urls.map(domainOf).filter(Boolean))];
  const primarySources=uniqueDomains.filter((d)=>primaryDomains.some((p)=>d===p||d.endsWith('.'+p)));
  const isYMYL=p.category==='투자·경제';
  const financeRisk=riskyFinancePatterns.filter((x)=>(p.title+' '+p.description+' '+p.body).includes(x));

  const signals=[];
  if (compact.length < 2800) signals.push({type:'LOW_VALUE',severity:'P1',detail:`본문 ${compact.length}자 < 2800자`});
  if (h2 < 3) signals.push({type:'LOW_VALUE',severity:'P1',detail:`H2 ${h2}개 < 3개`});
  if (isYMYL && urls.length < 2) signals.push({type:'SOURCE',severity:'P0',detail:`YMYL 투자 글 외부 출처 ${urls.length}개 < 2개`});
  else if (!isYMYL && ['AI·생산성'].includes(p.category) && urls.length < 1) signals.push({type:'SOURCE',severity:'P1',detail:'AI 리서치 외부 출처 0개'});
  if (isYMYL && primarySources.length < 1) signals.push({type:'SOURCE',severity:'P1',detail:'YMYL 투자 글 1차 출처 도메인 미감지'});
  if (financeRisk.length) signals.push({type:'YMYL',severity:'P0',detail:'직접 투자지시/확정 표현: '+financeRisk.join(', ')});

  records.push({
    file,
    slug:file.replace(/\.md$/,''),
    title:p.title,
    category:p.category,
    bodyChars:compact.length,
    h2,
    outboundLinks:urls.length,
    uniqueDomains,
    primarySourceDomains:primarySources,
    ymyl:isYMYL,
    signals
  });
}

for (let i=0;i<records.length;i++) {
  for (let j=i+1;j<records.length;j++) {
    const score=similarity(records[i].title,records[j].title);
    if (score < 0.76) continue;
    records[i].signals.push({type:'DUPLICATE_INTENT',severity:'P1',detail:`유사 제목 ${score.toFixed(2)} → ${records[j].slug}`});
    records[j].signals.push({type:'DUPLICATE_INTENT',severity:'P1',detail:`유사 제목 ${score.toFixed(2)} → ${records[i].slug}`});
  }
}

for (const r of records) {
  if (r.signals.some(s=>s.severity==='P0')) r.status='P0';
  else if (r.signals.some(s=>s.type==='SOURCE' || s.type==='YMYL')) r.status='P1-A';
  else if (r.signals.length) r.status='P1-B';
  else r.status='PASS';
}

const summary={
  total:records.length,
  PASS:records.filter(r=>r.status==='PASS').length,
  P1A:records.filter(r=>r.status==='P1-A').length,
  P1B:records.filter(r=>r.status==='P1-B').length,
  P1:records.filter(r=>r.status==='P1-A'||r.status==='P1-B').length,
  P0:records.filter(r=>r.status==='P0').length,
  ymyl:records.filter(r=>r.ymyl).length,
  lowValue:records.filter(r=>r.signals.some(s=>s.type==='LOW_VALUE')).length,
  sourceRisk:records.filter(r=>r.signals.some(s=>s.type==='SOURCE')).length,
  duplicateIntent:records.filter(r=>r.signals.some(s=>s.type==='DUPLICATE_INTENT')).length
};

const report={schemaVersion:2,generatedAt:new Date().toISOString(),summary,records};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2)+'\n');

const priority=records.filter(r=>r.status!=='PASS').sort((a,b)=>
  ({P0:0,'P1-A':1,'P1-B':2}[a.status]??3)-({P0:0,'P1-A':1,'P1-B':2}[b.status]??3) || b.signals.length-a.signals.length
);

const md=[
  '# JoyLab AdSense Content Quality Audit V2',
  '',
  `- Total: ${summary.total}`,
  `- PASS: ${summary.PASS}`,
  `- P1-A (YMYL/source priority): ${summary.P1A}`,
  `- P1-B (depth/structure backlog): ${summary.P1B}`,
  `- P1 total: ${summary.P1}`,
  `- P0: ${summary.P0}`,
  `- YMYL: ${summary.ymyl}`,
  `- Low Value signals: ${summary.lowValue}`,
  `- Source risk signals: ${summary.sourceRisk}`,
  `- Duplicate intent signals: ${summary.duplicateIntent}`,
  '',
  '| Priority | Category | Article | Signals |',
  '| --- | --- | --- | --- |',
  ...priority.map(r=>`| ${r.status} | ${r.category} | ${r.title.replace(/\|/g,'/')} | ${r.signals.map(s=>s.type+': '+s.detail).join('<br>')} |`)
];
fs.writeFileSync(path.join(outDir,'report.md'),md.join('\n')+'\n');

console.log(JSON.stringify(summary));
for (const r of priority) {
  console.log(`${r.status} ${r.slug} :: ${r.signals.map(s=>s.type+':'+s.detail).join(' | ')}`);
}

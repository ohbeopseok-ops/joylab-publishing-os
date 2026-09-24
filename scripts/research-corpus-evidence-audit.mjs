import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articlesRoot = path.join(root, 'src/data/articles');
const outDir = path.join(root, 'artifacts');
const claimSignal = /(?:\d+(?:\.\d+)?\s?(?:%|퍼센트|조|억|만|원|달러|배|건|명|개|년|월|일)|20\d{2}|발표했|공개했|기록했|증가했|감소했|상승했|하락했|설명했|밝혔|보고했|확인됐|나타났)/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function splitDoc(text) {
  if (!text.startsWith('---')) return { fm: '', body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: '', body: text };
  return { fm: text.slice(3, end), body: text.slice(end + 4) };
}

function fmValue(fm, key) {
  const prefix = key + ':';
  const line = fm.split('\n').find((x) => x.trim().startsWith(prefix));
  if (!line) return '';
  let value = line.trim().slice(prefix.length).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return value;
}

function boolFm(fm, key) { return fmValue(fm, key).toLowerCase() === 'true'; }

function analyze(text, file) {
  const { fm, body } = splitDoc(text);
  const title = fmValue(fm, 'title') || path.basename(file, '.md');
  const category = fmValue(fm, 'category');
  const featured = boolFm(fm, 'featured');
  const homeFeatured = boolFm(fm, 'homeFeatured');
  const hp = Number(fmValue(fm, 'homePriority'));
  const homePriority = Number.isFinite(hp) ? hp : null;
  const sourceSection = (body.match(/(?:^|\n)##\s+(?:Sources?|출처|근거)\s*\n([\s\S]*?)(?=\n##\s+|$)/i) || [,''])[1];
  const hasArticleSources = /https?:\/\//.test(sourceSection);
  const paragraphs = body.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const claims = [];
  for (const para of paragraphs) {
    if (/^(#|>|```|\|)/.test(para) || !claimSignal.test(para)) continue;
    const direct = /https?:\/\//.test(para);
    claims.push({ status: direct ? 'MAPPED' : hasArticleSources ? 'ARTICLE_SOURCES_ONLY' : 'UNMAPPED', preview: para.replace(/\s+/g, ' ').slice(0,220) });
  }
  const claimCount = claims.length;
  const mappedCount = claims.filter((x) => x.status === 'MAPPED').length;
  const weakCount = claims.filter((x) => x.status === 'ARTICLE_SOURCES_ONLY').length;
  const unmappedCount = claims.filter((x) => x.status === 'UNMAPPED').length;
  const importance = Math.min(30, (featured?8:0) + (homeFeatured?10:0) + (homePriority !== null && homePriority <= 5 ? 6 : 0) + Math.min(6, Math.ceil(claimCount/5)));
  const investmentText = (title + ' ' + category + ' ' + body.slice(0,3000)).toLowerCase();
  const hits = (investmentText.match(/투자|주가|종목|증시|etf|수익률|밸류에이션|실적|공시|삼성전자|하이닉스|금리|환율|코스피|코스닥/g) || []).length;
  const investmentRisk = Math.min(20, hits * 2);
  const gapScore = Math.min(40, unmappedCount * 3 + weakCount);
  const trafficScore = 0;
  const priorityScore = gapScore + importance + investmentRisk + trafficScore;
  const tier = priorityScore >= 60 ? 'P0' : priorityScore >= 35 ? 'P1' : 'P2';
  return { file,title,category,featured,homeFeatured,homePriority,claims,claimCount,mappedCount,weakCount,unmappedCount,scoring:{priorityScore,tier,gapScore,importance,investmentRisk,trafficScore,trafficStatus:'UNKNOWN'} };
}

if (process.argv.includes('--self-test')) {
  const fixture = '---\ntitle: Fixture\n---\n\n2026년 매출은 20% 증가했습니다. https://example.com/ir\n\n이익은 10% 증가했습니다.\n\n## Sources\n- https://example.com/report\n';
  const r = analyze(fixture, 'fixture.md');
  if (r.claimCount !== 2 || r.mappedCount !== 1 || r.weakCount !== 1) throw new Error('self-test failed');
  console.log('Corpus Evidence Audit self-test PASS');
  process.exit(0);
}

const files = walk(articlesRoot).filter((p) => p.endsWith('.md'));
const articles = files.map((p) => analyze(fs.readFileSync(p,'utf8'), path.relative(root,p).split(path.sep).join('/')));
const totals = articles.reduce((a,x)=>{ a.articles++; a.claims+=x.claimCount; a.mapped+=x.mappedCount; a.weak+=x.weakCount; a.unmapped+=x.unmappedCount; if(x.unmappedCount)a.articlesWithUnmapped++; if(x.weakCount)a.articlesWithWeak++; if(x.claimCount>0&&x.mappedCount===x.claimCount)a.fullyMappedArticles++; return a; }, {articles:0,claims:0,mapped:0,weak:0,unmapped:0,articlesWithUnmapped:0,articlesWithWeak:0,fullyMappedArticles:0});
const priority = articles.filter((x)=>x.unmappedCount||x.weakCount).sort((a,b)=>b.scoring.priorityScore-a.scoring.priorityScore||b.unmappedCount-a.unmappedCount).slice(0,50);
const top20 = priority.slice(0,20);
const tierCounts = articles.reduce((a,x)=>{ if(x.unmappedCount||x.weakCount)a[x.scoring.tier]=(a[x.scoring.tier]||0)+1; return a; }, {P0:0,P1:0,P2:0});
const report = { contract:'JoyLab Claim-Source Corpus Audit V1', checkedAt:new Date().toISOString(), trafficDataStatus:'UNKNOWN — no URL-level current GSC baseline available in repository', totals, tierCounts, top20, articles };
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'research-corpus-evidence-audit.json'), JSON.stringify(report,null,2)+'\n');
const md = ['# JoyLab Research Claim ↔ Source Corpus Audit V1','', 'Traffic component: **UNKNOWN / 0 points** until URL-level GSC data is connected.','', '| Tier | Score | Article | Claims | Direct | Weak | Unmapped | Importance | Investment Risk | Traffic |','|---|---:|---|---:|---:|---:|---:|---:|---:|---:|', ...top20.map((x)=>'| '+x.scoring.tier+' | '+x.scoring.priorityScore+' | '+x.title.replaceAll('|','/')+' | '+x.claimCount+' | '+x.mappedCount+' | '+x.weakCount+' | '+x.unmappedCount+' | '+x.scoring.importance+' | '+x.scoring.investmentRisk+' | '+x.scoring.trafficScore+' |'), '', 'V1 is report-only for the legacy corpus.'].join('\n');
fs.writeFileSync(path.join(outDir,'research-corpus-evidence-audit.md'), md+'\n');
console.log(JSON.stringify({totals,tierCounts,trafficDataStatus:report.trafficDataStatus,top20:top20.map(x=>({tier:x.scoring.tier,score:x.scoring.priorityScore,title:x.title,file:x.file,unmapped:x.unmappedCount,weak:x.weakCount,importance:x.scoring.importance,investmentRisk:x.scoring.investmentRisk,traffic:x.scoring.trafficScore}))},null,2));
if (process.argv.includes('--enforce') && (totals.weak || totals.unmapped)) process.exit(2);
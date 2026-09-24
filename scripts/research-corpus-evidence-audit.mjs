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

function analyze(text, file) {
  const { fm, body } = splitDoc(text);
  const title = (fm.match(/^title:\s*[\"']?(.+?)[\"']?\s*$/m) || [])[1] || path.basename(file, '.md');
  const sourceSection = (body.match(/(?:^|\n)##\s+(?:Sources?|출처|근거)\s*\n([\s\S]*?)(?=\n##\s+|$)/i) || [,''])[1];
  const hasArticleSources = /https?:\/\//.test(sourceSection);
  const paragraphs = body.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const claims = [];
  for (const p of paragraphs) {
    if (/^(#|>|```|\|)/.test(p) || !claimSignal.test(p)) continue;
    const direct = /https?:\/\//.test(p);
    claims.push({
      status: direct ? 'MAPPED' : hasArticleSources ? 'ARTICLE_SOURCES_ONLY' : 'UNMAPPED',
      preview: p.replace(/\s+/g, ' ').slice(0, 220)
    });
  }
  return {
    file, title, claims,
    claimCount: claims.length,
    mappedCount: claims.filter((x) => x.status === 'MAPPED').length,
    weakCount: claims.filter((x) => x.status === 'ARTICLE_SOURCES_ONLY').length,
    unmappedCount: claims.filter((x) => x.status === 'UNMAPPED').length
  };
}

if (process.argv.includes('--self-test')) {
  const fixture = '---\ntitle: Fixture\n---\n\n2026년 매출은 20% 증가했습니다. https://example.com/ir\n\n이익은 10% 증가했습니다.\n\n## Sources\n- https://example.com/report\n';
  const r = analyze(fixture, 'fixture.md');
  if (r.claimCount !== 2 || r.mappedCount !== 1 || r.weakCount !== 1) throw new Error('self-test failed');
  console.log('Corpus Evidence Audit self-test PASS');
  process.exit(0);
}

const files = walk(articlesRoot).filter((p) => p.endsWith('.md'));
const articles = files.map((p) => analyze(fs.readFileSync(p, 'utf8'), path.relative(root, p).split(path.sep).join('/')));
const totals = articles.reduce((a, x) => {
  a.articles++; a.claims += x.claimCount; a.mapped += x.mappedCount; a.weak += x.weakCount; a.unmapped += x.unmappedCount;
  if (x.unmappedCount) a.articlesWithUnmapped++;
  if (x.weakCount) a.articlesWithWeak++;
  if (x.claimCount > 0 && x.mappedCount === x.claimCount) a.fullyMappedArticles++;
  return a;
}, { articles:0, claims:0, mapped:0, weak:0, unmapped:0, articlesWithUnmapped:0, articlesWithWeak:0, fullyMappedArticles:0 });

const priority = articles.filter((x) => x.unmappedCount || x.weakCount).sort((a,b) => (b.unmappedCount*3+b.weakCount)-(a.unmappedCount*3+a.weakCount)).slice(0,50);
const report = { contract:'JoyLab Claim-Source Corpus Audit V1', checkedAt:new Date().toISOString(), totals, articles };
fs.mkdirSync(outDir, { recursive:true });
fs.writeFileSync(path.join(outDir,'research-corpus-evidence-audit.json'), JSON.stringify(report,null,2)+'\n');
const md = ['# JoyLab Research Claim ↔ Source Corpus Audit V1','', 'Articles: **'+totals.articles+'**', 'Claim candidates: **'+totals.claims+'**', 'Direct: **'+totals.mapped+'**', 'Weak: **'+totals.weak+'**', 'Unmapped: **'+totals.unmapped+'**', '', '| Article | Claims | Direct | Weak | Unmapped |', '|---|---:|---:|---:|---:|', ...priority.map((x) => '| '+x.title.replaceAll('|','/')+' | '+x.claimCount+' | '+x.mappedCount+' | '+x.weakCount+' | '+x.unmappedCount+' |'), '', 'V1 is report-only for the legacy corpus.'].join('\n');
fs.writeFileSync(path.join(outDir,'research-corpus-evidence-audit.md'), md+'\n');
console.log(JSON.stringify(totals,null,2));
if (process.argv.includes('--enforce') && (totals.weak || totals.unmapped)) process.exit(2);
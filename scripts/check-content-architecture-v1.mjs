import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articlesRoot = path.join(root, 'src/data/articles');
const outDir = path.join(root, 'artifacts');
const allowedTypes = new Set(['investment-analysis','concept-explainer','comparison','industry-trend','practical-playbook']);
const allowedActions = new Set(['KEEP','ENHANCE','REWRITE','MERGE','ARCHIVE']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap((e) => {
    const p = path.join(dir,e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function splitDoc(text) {
  if (!text.startsWith('---')) return {fm:'',body:text};
  const end = text.indexOf('\n---',3);
  if (end < 0) return {fm:'',body:text};
  return {fm:text.slice(3,end),body:text.slice(end+4)};
}

function value(fm,key) {
  const line = fm.split('\n').find((x) => x.trim().startsWith(key + ':'));
  if (!line) return '';
  let v = line.trim().slice(key.length + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1);
  return v;
}

function section(fm,key) {
  const lines = fm.split('\n');
  const i = lines.findIndex((x) => x.trim() === key + ':');
  if (i < 0) return '';
  const out = [];
  for (let n=i+1;n<lines.length;n++) {
    if (lines[n] && !/^\s/.test(lines[n])) break;
    out.push(lines[n]);
  }
  return out.join('\n');
}

function listItems(block,key) {
  const lines = block.split('\n');
  const i = lines.findIndex((x) => x.trim().startsWith(key + ':'));
  if (i < 0) return [];
  const fieldIndent = lines[i].match(/^\s*/)[0].length;
  const inline = lines[i].match(/:\s*\[(.*)\]\s*$/);
  if (inline && inline[1].trim()) return inline[1].split(',').map((x)=>x.trim()).filter(Boolean);
  const out = [];
  for (let n=i+1;n<lines.length;n++) {
    if (!lines[n].trim()) continue;
    const indent = lines[n].match(/^\s*/)[0].length;
    if (indent <= fieldIndent) break;
    const t = lines[n].trim();
    if (t.startsWith('- ')) out.push(t.slice(2).trim());
  }
  return out;
}

function hasItems(block,key) { return listItems(block,key).length > 0; }

function yes(block,key) { return block.split('\n').some((x) => x.trim() === key + ': true'); }

function analyze(file) {
  const raw = fs.readFileSync(file,'utf8');
  const parts = splitDoc(raw);
  const fm = parts.fm;
  const title = value(fm,'title') || path.basename(file,'.md');
  const type = value(fm,'contentType');
  const action = value(fm,'migrationAction');
  const trust = section(fm,'trust');
  const checks = {
    author: Boolean(value(fm,'author')),
    researchDate: Boolean(value(trust,'researchedAt') || value(fm,'updatedAt')),
    methodology: hasItems(trust,'methodology'),
    primarySources: hasItems(trust,'primarySources'),
    originalValue: hasItems(trust,'originalValue'),
    counterEvidence: yes(trust,'hasCounterEvidence'),
    conclusion: yes(trust,'hasConclusion'),
    updateLog: yes(trust,'hasUpdateLog')
  };
  const slug = path.basename(file,'.md');
  const signal = (slug + ' ' + title).toLowerCase();
  const bodyUrls = parts.body.match(/https?:\/\/[^\s)>\]]+/g) || [];
  const trustUrls = listItems(trust,'primarySources').filter((x)=>/^https?:\/\//.test(x));
  const sourceUrlCount = new Set([...bodyUrls,...trustUrls]).size;
  const bodyChars = parts.body.replace(/\s+/g,' ').trim().length;
  let inferredType = type;
  if (!inferredType) {
    if (/compare|vs-| vs |비교/.test(signal)) inferredType = 'comparison';
    else if (/what-is|how-to|how-submarine|guide|basics|history|보는 법|란 무엇|읽는 법|총정리|용어|어떻게/.test(signal)) inferredType = 'concept-explainer';
    else if (/workflow|operating-model|automation|leadership|coaching|productivity|system|fairness|feedback|learning-system|performance-system|recognition-system|growth-leadership|guardrails/.test(signal)) inferredType = 'practical-playbook';
    else if (/outlook|valuation|eps|roe|roic|shareholder|daily-analysis|market-close|beneficiaries|foreign-investor|수혜|투자/.test(signal)) inferredType = 'investment-analysis';
    else inferredType = 'industry-trend';
  }
  let recommendedAction = action;
  if (!recommendedAction) {
    if (bodyChars < 3500 && sourceUrlCount === 0) recommendedAction = 'REWRITE';
    else if (bodyChars < 6500 || sourceUrlCount < 2) recommendedAction = 'ENHANCE';
    else recommendedAction = 'KEEP';
  }
  const reviewReasons = [];
  if (recommendedAction === 'REWRITE') reviewReasons.push('thin-or-unsourced');
  if (inferredType === 'investment-analysis' && sourceUrlCount < 2) reviewReasons.push('investment-source-depth');
  return {
    file:path.relative(root,file).split(path.sep).join('/'),
    slug,title,
    contentType:type || null,
    inferredContentType:inferredType,
    migrationAction:action || null,
    recommendedAction,
    sourceUrlCount,
    bodyChars,
    reviewRequired:reviewReasons.length > 0,
    reviewReasons,
    validContentType:!type || allowedTypes.has(type),
    validMigrationAction:!action || allowedActions.has(action),
    trustScore:Object.values(checks).filter(Boolean).length,
    trustChecks:checks
  };
}

function normalizeTitle(s) { return s.toLowerCase().replace(/[^0-9a-z가-힣]+/g,' ').trim(); }

function makeReport(items) {
  const map = new Map();
  for (const row of items) {
    const k = normalizeTitle(row.title);
    if (!map.has(k)) map.set(k,[]);
    map.get(k).push(row);
  }
  const duplicates = [...map.entries()].filter(([,v]) => v.length > 1).map(([normalizedTitle,v]) => ({normalizedTitle,articles:v.map((x)=>({file:x.file,title:x.title}))}));
  const sameDateSamsung = items.filter((x)=>/samsung-(daily-analysis|market-close)-2026-09-28/.test(x.slug));
  if (sameDateSamsung.length === 2) {
    for (const row of sameDateSamsung) {
      row.recommendedAction = 'MERGE';
      row.reviewRequired = true;
      row.reviewReasons = [...new Set([...row.reviewReasons,'same-company-same-date-overlap'])];
    }
  }
  const actionCounts = {};
  const typeCounts = {};
  for (const row of items) {
    actionCounts[row.recommendedAction] = (actionCounts[row.recommendedAction] || 0) + 1;
    typeCounts[row.inferredContentType] = (typeCounts[row.inferredContentType] || 0) + 1;
  }
  return {
    contract:'JoyLab Article Architecture Contract V1',
    mode:'REPORT_ONLY',
    checkedAt:new Date().toISOString(),
    totals:{
      articles:items.length,
      classified:items.filter((x)=>x.contentType).length,
      unclassified:items.filter((x)=>!x.contentType).length,
      migrationTagged:items.filter((x)=>x.migrationAction).length,
      invalidContentType:items.filter((x)=>!x.validContentType).length,
      invalidMigrationAction:items.filter((x)=>!x.validMigrationAction).length,
      trustScore7Plus:items.filter((x)=>x.trustScore>=7).length,
      exactTitleDuplicateGroups:duplicates.length,
      reviewRequired:items.filter((x)=>x.reviewRequired).length
    },
    actionCounts,
    typeCounts,
    duplicates,
    articles:items
  };
}

if (process.argv.includes('--self-test')) {
  const fixture = path.join(root,'.tmp-content-architecture-self-test.md');
  fs.writeFileSync(fixture,'---\ntitle: Fixture\nauthor: JoyLab Research\ncontentType: investment-analysis\nmigrationAction: ENHANCE\nupdatedAt: 2026-10-06\ntrust:\n  researchedAt: 2026-10-06\n  methodology:\n    - official-source-review\n  primarySources:\n    - https://example.com/report\n  originalValue:\n    - scenario-analysis\n  hasCounterEvidence: true\n  hasConclusion: true\n  hasUpdateLog: true\n---\n\nBody\n');
  try {
    const row = analyze(fixture);
    if (!row.validContentType || !row.validMigrationAction || row.trustScore < 7) throw new Error('self-test failed');
    console.log('Content Architecture V1 self-test PASS');
  } finally { fs.unlinkSync(fixture); }
  process.exit(0);
}

const articles = walk(articlesRoot).filter((p)=>p.endsWith('.md')).map(analyze);
const report = makeReport(articles);
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'content-architecture-audit.json'),JSON.stringify(report,null,2)+'\n');
const lines = ['# JoyLab Content Architecture Audit V1','','Mode: **REPORT_ONLY**','','| Metric | Count |','|---|---:|'];
for (const [k,v] of Object.entries(report.totals)) lines.push('| ' + k + ' | ' + v + ' |');
lines.push('','## Duplicate title groups','');
if (!report.duplicates.length) lines.push('None');
for (const group of report.duplicates) {
  lines.push('### ' + group.normalizedTitle);
  for (const row of group.articles) lines.push('- ' + row.title + ' — `' + row.file + '`');
  lines.push('');
}
lines.push('## Policy','','- V1 is report-only for the legacy corpus.','- Missing new metadata must not break the current production build.','- Archive, delete, redirect, and canonical merge require human approval.','');
fs.writeFileSync(path.join(outDir,'content-architecture-audit.md'),lines.join('\n'));
console.log(JSON.stringify({mode:report.mode,totals:report.totals,actionCounts:report.actionCounts,typeCounts:report.typeCounts,duplicateGroups:report.duplicates},null,2));
if (process.argv.includes('--enforce') && (report.totals.invalidContentType || report.totals.invalidMigrationAction)) process.exit(2);

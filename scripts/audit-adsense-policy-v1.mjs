import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rules = JSON.parse(fs.readFileSync(path.join(root,'config','adsense-policy-audit-v1.json'),'utf8'));
const articleDir = path.join(root,'src','data','articles');
const outDir = path.join(root,'qa-artifacts','adsense-policy-audit-v1');
fs.mkdirSync(outDir,{recursive:true});

function parseFrontmatter(text){
  const m=text.match(/^---\n([\s\S]*?)\n---\n?/);
  const raw=m?.[1]||'';
  const body=m ? text.slice(m[0].length) : text;
  const get=(key)=>{
    const x=raw.match(new RegExp('^'+key+':\\s*(.+)$','m'));
    return x ? x[1].trim().replace(/^['"]|['"]$/g,'') : '';
  };
  return {body,title:get('title'),description:get('description'),category:get('category'),draft:/^draft:\s*true\s*$/m.test(raw)};
}
function hitsFor(text,list,severity,scope){
  const hits=[];
  for(const rule of list||[]){
    for(const phrase of rule.patterns||[]){
      if(text.includes(phrase)) hits.push({severity,scope,ruleId:rule.id,label:rule.label,phrase});
    }
  }
  return hits;
}
const files=fs.readdirSync(articleDir).filter(x=>x.endsWith('.md')).sort();
const records=[];
for(const file of files){
  const full=path.join(articleDir,file);
  const text=fs.readFileSync(full,'utf8');
  const fm=parseFrontmatter(text);
  if(fm.draft) continue;
  const normalized=(fm.title+'\n'+fm.description+'\n'+fm.body).replace(/\s+/g,' ');
  const headingCount=(fm.body.match(/^##\s+/gm)||[]).length;
  const outbound=(fm.body.match(/https?:\/\//g)||[]).length;
  const bodyChars=fm.body.replace(/\s+/g,'').length;
  let hits=[
    ...hitsFor(normalized,rules.global.hold,'HOLD','global'),
    ...hitsFor(normalized,rules.global.fix,'FIX','global')
  ];
  for(const [pillar,p] of Object.entries(rules.pillars)){
    if((p.categories||[]).includes(fm.category)){
      hits.push(...hitsFor(normalized,p.fix,'FIX',pillar));
    }
  }
  const quality=[];
  if(bodyChars<rules.quality.minBodyChars) quality.push({id:'thin-body',label:`본문 길이 ${bodyChars}자 < ${rules.quality.minBodyChars}자`});
  if(headingCount<rules.quality.minHeadings) quality.push({id:'few-headings',label:`H2 ${headingCount}개 < ${rules.quality.minHeadings}개`});
  if((rules.quality.sourceRequiredCategories||[]).includes(fm.category) && outbound<rules.quality.minOutboundLinksForResearch) {
    quality.push({id:'no-outbound-source',label:'외부 출처 링크 0개'});
  }
  const uniq=new Map(hits.map(h=>[h.severity+'|'+h.ruleId+'|'+h.phrase,h]));
  hits=[...uniq.values()];
  const status=hits.some(h=>h.severity==='HOLD')?'HOLD':(hits.length||quality.length)?'FIX':'PASS';
  records.push({file,id:file.replace(/\.md$/,''),title:fm.title,category:fm.category,status,bodyChars,headingCount,outboundLinks:outbound,hits,quality});
}
const prefixGroups = new Map();
for (const record of records) {
  const prefix = String(record.title || '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[^0-9A-Za-z가-힣]+/g, '')
    .slice(0, 12)
    .toLocaleLowerCase('ko-KR');
  if (!prefix) continue;
  const list = prefixGroups.get(prefix) || [];
  list.push(record);
  prefixGroups.set(prefix, list);
}
for (const [prefix, group] of prefixGroups) {
  const ratio = group.length / Math.max(records.length, 1);
  if (group.length > 1 && ratio > rules.quality.maxDuplicateTitlePrefixRatio) {
    for (const record of group) {
      record.quality.push({
        id: 'duplicate-title-prefix',
        label: `제목 접두어 중복 비율 ${(ratio * 100).toFixed(1)}% > ${(rules.quality.maxDuplicateTitlePrefixRatio * 100).toFixed(1)}% (${prefix})`
      });
      if (record.status === 'PASS') record.status = 'FIX';
    }
  }
}

const summary={
  total:records.length,
  PASS:records.filter(r=>r.status==='PASS').length,
  FIX:records.filter(r=>r.status==='FIX').length,
  HOLD:records.filter(r=>r.status==='HOLD').length
};
const report={schemaVersion:1,generatedAt:new Date().toISOString(),rules:rules.name,summary,records};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2)+'\n');
const md=[
  '# AdSense Policy Audit V1',
  '',
  `- Total: ${summary.total}`,
  `- PASS: ${summary.PASS}`,
  `- FIX: ${summary.FIX}`,
  `- HOLD: ${summary.HOLD}`,
  '',
  '| Status | Category | Article | Signals |',
  '| --- | --- | --- | --- |',
  ...records.map(r=>`| ${r.status} | ${r.category} | ${r.title.replace(/\|/g,'/')} | ${[...r.hits.map(h=>h.label+': '+h.phrase),...r.quality.map(q=>q.label)].join('<br>')||'-'} |`)
];
fs.writeFileSync(path.join(outDir,'report.md'),md.join('\n')+'\n');
console.log(JSON.stringify(summary));
if(summary.HOLD>0){
  console.error('AdSense Policy Audit V1 HOLD detected.');
  process.exit(1);
}

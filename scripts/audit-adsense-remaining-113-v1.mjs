#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root='src/data/articles',dest='qa-artifacts/adsense-remaining-113-v1';
fs.mkdirSync(dest,{recursive:true});
const excluded='china-semiconductor-equipment-localization customer-center-ai-security-guardrails customer-center-ax-leadership customer-center-ax-operating-model customer-center-crm-productivity customer-center-qa-coaching-loop korea-shipbuilding-companies-compare optical-dsp-lpo-lro-1-6t us-china-chip-export-control-timeline what-is-hbm'.split(' ').map(x=>x+'.md');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.md')).sort();
if(files.length!==123||excluded.length!==10||excluded.some(f=>!files.includes(f)))throw Error('Corpus not 123, or PR508 exclusions are missing.');
const fmval=(fm,k)=>(fm.match(new RegExp('^'+k+':\\s*(.*)$','m'))?.[1]||'').trim().replace(/^['"]|['"]$/g,'');
const domain=url=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return''}};
const official=['.gov','.go.kr','.ac.kr','.edu','sec.gov','federalreserve.gov','bls.gov','bea.gov','bis.org','bok.or.kr','krx.co.kr','dart.fss.or.kr','iea.org','jedec.org','nvidia.com','samsung.com','skhynix.com','openai.com','anthropic.com','oecd.org','imf.org','worldbank.org','hanwhaocean.com','samsungshi.com','ls-electric.com'];
const isOfficial=d=>official.some(x=>x.startsWith('.')?d.endsWith(x):d===x||d.endsWith('.'+x));
const stop=new Set('ai 투자 주가 전망 가이드 비교 분석 방법 한국 시장 2026 2025 이야기 무엇인가'.split(' '));
const tokens=s=>[...new Set(String(s).toLowerCase().normalize('NFKC').replace(/[^a-z0-9가-힣]+/g,' ').split(/\s+/).filter(x=>x.length>1&&!stop.has(x)))];
const similarity=(a,b)=>{const A=new Set(a),B=new Set(b);if(A.size<2||B.size<2)return 0;const i=[...A].filter(x=>B.has(x)).length;return Math.round(1000*Math.max(i/(A.size+B.size-i),.84*i/Math.min(A.size,B.size)))/1000};
const items=files.filter(f=>!excluded.includes(f)).map(file=>{
 const raw=fs.readFileSync(path.join(root,file),'utf8'),m=raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/),fm=m?.[1]||'',body=m?raw.slice(m[0].length):raw;
 const title=fmval(fm,'title'),category=fmval(fm,'category'),date=fmval(fm,'publishedAt'),author=fmval(fm,'author');
 const urls=[...body.matchAll(/https?:\/\/[^\s)\]>\"']+/g)].map(x=>x[0].replace(/[.,;:]$/g,''));
 const domains=[...new Set(urls.map(domain).filter(Boolean))],primary=domains.filter(isOfficial);
 const h2=(body.match(/^##\s+/gm)||[]).length,chars=body.replace(/<!--[\s\S]*?-->/g,'').replace(/\s+/g,'').length;
 const utility=(body.match(/예시|가정|계산|체크리스트|실습|재현|검증 기준|판단 조건|비교표|시나리오/g)||[]).length;
 const tables=(body.match(/^\s*\|[^|\n]+\|/gm)||[]).length;
 const asOf=(body.match(/기준일|데이터 기준|발표일|조사일|업데이트|as.of/gi)||[]).length;
 const limitation=(body.match(/리스크|한계|불확실|예외|유의|주의|전제/g)||[]).length;
 const finance=category.includes('투자')||/주가|영업이익|금리|국채|수익률/.test(title);
 const samples=body.split(/\r?\n/).map((x,i)=>({line:i+1,text:x.trim()})).filter(x=>/\b\d+(?:[.,]\d+)?\s*(?:%|조원|억원|달러|원|GW|MW|bp)\b|202[5-7]년/.test(x.text)).slice(0,3).map(x=>({line:x.line,excerpt:x.text.slice(0,100)}));
 const flags=[];
 if(!m)flags.push('FRONTMATTER_MISSING');
 if(!date)flags.push('PUBLISHED_DATE_MISSING');
 if(!author)flags.push('AUTHOR_MISSING');
 if(chars<2300)flags.push('DEPTH_REVIEW');
 if(urls.length<2)flags.push('SOURCE_FEW');
 if(!primary.length)flags.push('PRIMARY_SOURCE_VERIFY');
 if(h2<3)flags.push('STRUCTURE_REVIEW');
 if(!utility&&!tables)flags.push('READER_UTILITY_VERIFY');
 if(finance&&!asOf)flags.push('FINANCIAL_AS_OF_VERIFY');
 if(finance&&samples.length&&!primary.length)flags.push('FINANCIAL_CLAIM_VERIFY');
 if(!limitation)flags.push('LIMITATIONS_REVIEW');
 const score=Math.min(25,urls.length*5+primary.length*5)+Math.min(30,(tables?12:0)+utility*3)+Math.min(20,utility*3+h2)+Math.min(15,(asOf?5:0)+(date?3:0)+(primary.length?5:0)+(limitation?2:0))+Math.min(10,(m?3:0)+(h2>=3?4:h2)+(fmval(fm,'description')?3:0));
 return {slug:file.slice(0,-3),title,category,date,author,chars,h2,links:urls.length,officialDomains:primary,allDomains:domains,utility,tables,asOf,limitation,finance,samples,score,flags,titleWords:tokens(title),introWords:tokens(body.slice(0,900)),reviewStatus:'MANUAL_FACT_CHECK_REQUIRED'};
});
if(items.length!==113)throw Error('Full 113 source screening failed');
const pairs=[];
for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
 const a=items[i],b=items[j],t=similarity(a.titleWords,b.titleWords),intro=similarity(a.introWords,b.introWords);
 if(t>=.65||(t>=.5&&intro>=.4))pairs.push({a:a.slug,b:b.slug,title:t,intro});
}
pairs.sort((a,b)=>b.title-a.title);
for(const r of items){
 r.overlapCandidates=pairs.filter(p=>p.a===r.slug||p.b===r.slug).slice(0,3).map(p=>p.a===r.slug?p.b:p.a);
 if(r.overlapCandidates.length)r.flags.push('SEARCH_INTENT_OVERLAP_REVIEW');
 r.priority=(!r.date||!r.author||(r.finance&&r.flags.includes('FINANCIAL_CLAIM_VERIFY')&&r.flags.includes('SOURCE_FEW')))?'P0-CANDIDATE':r.flags.some(f=>['DEPTH_REVIEW','SOURCE_FEW','PRIMARY_SOURCE_VERIFY','READER_UTILITY_VERIFY','FINANCIAL_AS_OF_VERIFY','SEARCH_INTENT_OVERLAP_REVIEW'].includes(f))?'P1-CANDIDATE':'P2-CANDIDATE';
 delete r.titleWords;delete r.introWords;
}
const order={'P0-CANDIDATE':0,'P1-CANDIDATE':1,'P2-CANDIDATE':2};
items.sort((a,b)=>order[a.priority]-order[b.priority]||a.score-b.score||a.slug.localeCompare(b.slug));
const summary={sourceTotal:files.length,improvedFirstSprint:excluded.length,screened:items.length,P0:items.filter(x=>x.priority==='P0-CANDIDATE').length,P1:items.filter(x=>x.priority==='P1-CANDIDATE').length,P2:items.filter(x=>x.priority==='P2-CANDIDATE').length,fewLinks:items.filter(x=>x.links<2).length,noRecognizedPrimary:items.filter(x=>!x.officialDomains.length).length,short:items.filter(x=>x.chars<2300).length,possibleOverlapPairs:pairs.length,verifiedFacts:0};
fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify({contract:'JOYLAB_ADSENSE_113_V1',generatedAt:new Date().toISOString(),summary,pairs,items},null,2)+'\n');
const csvcell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const rows=[['priority','slug','title','category','publishedAt','author','score','bodyChars','H2','links','officialDomains','utility','asOf','limitations','flags','overlap','claimSamples','reviewStatus']];
for(const x of items)rows.push([x.priority,x.slug,x.title,x.category,x.date,x.author,x.score,x.chars,x.h2,x.links,x.officialDomains.join(';'),x.utility,x.asOf,x.limitation,x.flags.join(';'),x.overlapCandidates.join(';'),x.samples.map(z=>'L'+z.line+':'+z.excerpt).join(' / '),x.reviewStatus]);
fs.writeFileSync(path.join(dest,'report.csv'),rows.map(r=>r.map(csvcell).join(',')).join('\n')+'\n');
const esc=v=>String(v??'').replace(/\|/g,'/').replace(/\n/g,' ');
const md=['# JoyLab 113개 원고별 품질 증거 감사','',
'> 113/113 Markdown 원문을 전체 스캔. P0/P1/P2는 자동 우선순위 후보이며 사실 오류 판정이나 AdSense 품질 점수가 아닙니다. 사람의 1차 자료 대조 검증 완료는 0/113입니다.','',
'## 집계',...Object.entries(summary).map(([k,v])=>'- '+k+': '+v),'',
'## 원고별 증거','',
'| 순위 | 후보 | 원고 | 내부 신호 점수 | 본문 글자 | 링크 / 공식 도메인 | 검토 사유 | 수치 주장 근거 확인 대상(원문 행) |',
'|---:|---|---|---:|---:|---:|---|---|'];
items.forEach((r,i)=>md.push('| '+(i+1)+' | '+r.priority+' | ['+r.slug+'](https://aijoylab.kr/articles/'+r.slug+') | '+r.score+' | '+r.chars+' | '+r.links+' / '+r.officialDomains.length+' | '+esc(r.flags.slice(0,4).join(', '))+' | '+esc(r.samples.length?'L'+r.samples[0].line+':'+r.samples[0].excerpt:'주장별 1차 자료 확인 필요')+' |'));
md.push('','## 최종 승인 전 사람 검증','1. 모든 글의 핵심 주장 2~5개를 1차 자료 문서/날짜/페이지와 대조.','2. 출처 URL의 정상 접속과 해당 주장 지원 여부 확인.','3. 검색 의도 중복과 고유 사례/분석 확인.','4. 390/430/1440 운영 페이지 및 링크와 표 검증.','5. 검토자, 검토일, 근거, 수정 PR, 최종 판정을 기록한 뒤에만 VERIFIED로 변경.','6. 자동 noindex/삭제/재심사 신청 금지.');
fs.writeFileSync(path.join(dest,'report.md'),md.join('\n')+'\n');
console.log('AUDIT113_SUMMARY='+JSON.stringify(summary));
console.log('AUDIT113_TOP20='+JSON.stringify(items.slice(0,20).map(x=>({slug:x.slug,priority:x.priority,score:x.score,flags:x.flags}))));
console.log('AUDIT113_OVERLAPS='+JSON.stringify(pairs.slice(0,15)));
console.log('AUDIT113_DISCLOSURE=This is per-file automated evidence screening; 0 verified factual claims.');

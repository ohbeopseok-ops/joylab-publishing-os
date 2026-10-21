#!/usr/bin/env node
// JoyLab AdSense Content Value Audit V3 — Full-corpus source screening; not a Google quality score.
import fs from "node:fs";
import path from "node:path";
const base=path.resolve("src/data/articles"),out=path.resolve("qa-artifacts/adsense-content-value-v3");
fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync(base).filter(x=>x.endsWith(".md")).sort();
const originalHints=/\b(?:ROIC|EPS|CAPEX|EBITDA|RWA|CET1|OPEX|MFE|MAE|DCF)\b|가정|계산|산식|수식|시나리오|비교표|실험|현장 사례|실행 절차|판단 조건|의사결정|체크리스트/g;
const dateHints=/기준일|데이터 기준|조사일|업데이트|수정 이력|발표일|as.of|last.updated/gi;
const antiHints=/반대 근거|반론|무효화|실패 조건|리스크|유의사항|한계|전제|예외|조건부/g;
const official=/(\.gov(\.|$)|\.go\.kr$|\.ac\.kr$|\.edu$|sec\.gov$|federalreserve\.gov$|bok\.or\.kr$|krx\.co\.kr$|dart\.fss\.or\.kr$|bis\.org$|bls\.gov$|bea\.gov$|jedec\.org$|nvidia\.com$|samsung\.com$|skhynix\.com$|iea\.org$|energy\.gov$|openai\.com$|anthropic\.com$)/i;
const fmv=(fm,key)=>{const m=fm.match(new RegExp("^"+key+":\\s*(.*)$","m"));return m?.[1]?.trim().replace(/^["']|["']$/g,"")||""};
const stop=new Set(["무엇인가","있습니다","따라서","그리고","가이드","비교","하는","방법","한국","2026","투자","주가","분석","어떻게","우리","이야기","대한","기준","중심","차이"]);
const tokenize=t=>[...new Set(String(t).toLocaleLowerCase("ko-KR").normalize("NFKC").replace(/[^a-z0-9가-힣]+/g," ").split(/\s+/).filter(x=>x.length>=2&&!stop.has(x)))];
const similarity=(a,b)=>{const A=new Set(a),B=new Set(b);if(A.size<2||B.size<2)return 0;const common=[...A].filter(x=>B.has(x)).length;return +Math.max(common/(A.size+B.size-common),.85*common/Math.min(A.size,B.size)).toFixed(3)};
const records=files.map(file=>{
 const full=fs.readFileSync(path.join(base,file),"utf8"),m=full.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
 const fm=m?.[1]||"",body=m?full.slice(m[0].length):full,compact=body.replace(/\s+/g,"");
 const external=[...body.matchAll(/https?:\/\/[^\s\])>"']+/g)].map(m=>m[0].replace(/[.,;:]$/g,""));
 const domains=[...new Set(external.map(x=>{try{return new URL(x).hostname.replace(/^www\./,"").toLowerCase()}catch{return""}}).filter(Boolean))];
 const primary=domains.filter(x=>official.test(x)),h2=[...body.matchAll(/^##\s+(.+)$/gm)].map(x=>x[1].trim());
 const title=fmv(fm,"title"),category=fmv(fm,"category"),date=fmv(fm,"publishedAt"),draft=fmv(fm,"draft")==="true";
 const reasons=[],chars=compact.length;
 if(!m)reasons.push("FRONTMATTER_MISSING");
 if(chars<2300)reasons.push("DEPTH_REVIEW");
 if(external.length<2)reasons.push("SOURCE_FEW");
 if(!primary.length)reasons.push("PRIMARY_SOURCE_VERIFY");
 if(h2.length<3)reasons.push("STRUCTURE_REVIEW");
 if(!(body.match(originalHints)||[]).length)reasons.push("ORIGINAL_VALUE_REVIEW");
 if(!(body.match(dateHints)||[]).length)reasons.push("DATA_DATE_REVIEW");
 if(!(body.match(antiHints)||[]).length)reasons.push("COUNTER_EVIDENCE_REVIEW");
 const components={
  answerDepth:Math.min(20,Math.round(chars/150)),
  sources:Math.min(20,external.length*3+primary.length*3),
  originalSignals:Math.min(20,(body.match(originalHints)||[]).length*3+(body.includes("|---")?3:0)),
  structure:Math.min(15,h2.length*3),
  trust:Math.min(15,(date?3:0)+(fmv(fm,"author")?3:0)+(body.match(dateHints)?.length?3:0)+(body.match(antiHints)?.length?3:0)+(domains.length?3:0)),
  readerNavigation:Math.min(10,((body.match(/\/articles\//g)||[]).length>=2?5:0)+(body.match(/\/guides\//g)?.length?5:0))
 };
 const score=Object.values(components).reduce((x,y)=>x+y,0);
 return {slug:file.replace(/\.md$/,""),title,category,publishedAt:date,draft,bodyChars:chars,h2Count:h2.length,externalLinks:external.length,officialDomainLinks:primary.length,externalDomains:domains,internalArticleLinks:(body.match(/\/articles\//g)||[]).length,score,components,flags:reasons,reviewStatus:"EDITORIAL_REVIEW_REQUIRED",titleTokens:tokenize(title),introTokens:tokenize(body.slice(0,450))};
});
const overlaps=[];
for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
 const a=records[i],b=records[j],titleScore=similarity(a.titleTokens,b.titleTokens),introScore=similarity(a.introTokens,b.introTokens);
 if(titleScore>=.7 || (titleScore>=.5&&introScore>=.45))overlaps.push({a:a.slug,b:b.slug,titleScore,introScore,decision:"MANUAL_INTENT_COMPARISON_REQUIRED"});
}
overlaps.sort((a,b)=>b.titleScore-a.titleScore);
const stats={total:records.length,published:records.filter(x=>!x.draft).length,drafts:records.filter(x=>x.draft).length,fewerThan2External:records.filter(x=>x.externalLinks<2).length,under2300Chars:records.filter(x=>x.bodyChars<2300).length,withoutDetectedOfficialDomain:records.filter(x=>!x.officialDomainLinks).length,withoutDetectedAsOfInBody:records.filter(x=>x.flags.includes("DATA_DATE_REVIEW")).length,overlapPairs:overlaps.length};
const report={contract:"JOYLAB-AD-VALUE-AUDIT-V3",generatedAt:new Date().toISOString(),source:"src/data/articles/*.md",method:"automated structural screening of all article bodies; factual support and originality not fact-checked",warning:"Not a Google scoring rubric. Every record requires editorial and production-page review. Structural scores do not prove AdSense approval.",stats,overlaps,records};
fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(report,null,2)+"\n");
const esc=s=>String(s||"").replace(/\|/g,"/").replace(/\n/g," ");
const lines=["# JoyLab Content Value Audit V3 — Full Corpus","","Generated: "+report.generatedAt,"","> AUTOMATED TRIAGE ONLY: this does not verify every factual claim, originality, or Google AdSense approval. Low-value content was the AdSense review reason shown 2026-10-04.","","## Screening summary",""];
for(const [k,v] of Object.entries(stats))lines.push("- "+k+": **"+v+"**");
lines.push("","Scores are a **100-point INTERNAL structural triage index**, not a Google metric. Each page remains EDITORIAL_REVIEW_REQUIRED.","","## Possible overlap pairs (manual comparison before merge/noindex)","","| Page A | Page B | Title similarity | Intro similarity |","|---|---|---:|---:|");
for(const x of overlaps)lines.push("| "+x.a+" | "+x.b+" | "+x.titleScore+" | "+x.introScore+" |");
lines.push("","## All source articles screened","","| Article | Category | Body chars | External URLs | Official domains | H2 | Internal score /100 | Review signals |","|---|---|---:|---:|---:|---:|---:|---|");
for(const x of records)lines.push("| ["+esc(x.slug)+"](https://aijoylab.kr/articles/"+x.slug+") | "+esc(x.category)+" | "+x.bodyChars+" | "+x.externalLinks+" | "+x.officialDomainLinks+" | "+x.h2Count+" | "+x.score+" | "+(x.flags.join(", ")||"No automatic flags")+" |");
lines.push("","## Publication gates","","1. Fact check original claims against primary sources and as-of dates; external domains alone are not verified evidence.","2. Manually compare search intents of potential overlaps before KEEP/MERGE/REWRITE.","3. Confirm unique reader utility: worked examples, analysis, reproducible assumptions, explicit limits.","4. Inspect production pages at 390px and 1440px and verify navigation, diagrams, sources.","5. Record the actual AdSense review issue and resubmit only after site-wide P0 problems are addressed.","");
fs.writeFileSync(path.join(out,"report.md"),lines.join("\n"));
console.log("AUDIT_V3_SUMMARY="+JSON.stringify(stats));
console.log("AUDIT_V3_TOP_OVERLAP="+JSON.stringify(overlaps.slice(0,25)));
console.log("AUDIT_V3_PRIORITY="+JSON.stringify(records.filter(x=>!x.draft).sort((a,b)=>a.score-b.score).slice(0,20).map(x=>({slug:x.slug,score:x.score,chars:x.bodyChars,external:x.externalLinks,flags:x.flags}))));
// Maintain the last certified 123-article floor without blocking genuinely additive research posts.
// This is an inventory safety check, not an AdSense quality score or content approval.
const minimumCertifiedArticles = 123;
if(records.length < minimumCertifiedArticles) {
 console.error("Article corpus regression: "+records.length+" below certified baseline "+minimumCertifiedArticles+".");
 process.exitCode = 1;
}

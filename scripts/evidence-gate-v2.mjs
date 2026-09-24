import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const base = process.env.EVIDENCE_BASE || 'origin/main';
const claimSignal = /(?:\d+(?:\.\d+)?\s?(?:%|조|억|만|원|달러|배|건|명|개|년|월|일)|20\d{2}|발표했|공개했|기록했|증가했|감소했|상승했|하락했|설명했|밝혔|보고했|확인됐|나타났)/;

function bodyOf(text){ if(!text.startsWith('---')) return text; const end=text.indexOf('\n---',3); return end<0?text:text.slice(end+4); }
function unmappedClaims(text){
  return bodyOf(text).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)
    .filter(p=>!/^(#|>|```|\|)/.test(p))
    .filter(p=>claimSignal.test(p))
    .filter(p=>!/https?:\/\//.test(p))
    .map(p=>p.replace(/\s+/g,' ').slice(0,180));
}

let added=[];
try {
  const out=execSync('git diff --name-only --diff-filter=A '+base+'..HEAD -- src/data/articles',{encoding:'utf8'}).trim();
  added=out?out.split('\n').filter(x=>x.endsWith('.md')):[];
} catch (error) { console.error('Evidence Gate V2 diff failed:', error.message); process.exit(3); }

const failures=[];
for(const file of added){
  const bad=unmappedClaims(fs.readFileSync(path.join(root,file),'utf8'));
  if(bad.length) failures.push({file,unmapped:bad});
}
console.log(JSON.stringify({contract:'Evidence Gate V2',base,addedArticles:added.length,failures},null,2));
if(failures.length) process.exit(2);
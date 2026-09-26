import fs from 'node:fs';
import crypto from 'node:crypto';

const sourcePath='src/data/studio/series-02-source.json';
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const fail=[];

if(source.contract!=='JoyLab Series 02 Source of Truth V1') fail.push('contract mismatch');
if(source.chapters.length!==15) fail.push('expected exactly 15 chapters');
const orders=source.chapters.map(x=>x.order);
if(new Set(orders).size!==15 || Math.min(...orders)!==1 || Math.max(...orders)!==15) fail.push('chapter order must be 1..15');
const ids=source.chapters.map(x=>x.id);
if(new Set(ids).size!==15) fail.push('chapter ids must be unique');

const ready=source.chapters.filter(x=>x.manuscriptStatus==='ready');
const outlines=source.chapters.filter(x=>x.manuscriptStatus==='outline');
if(ready.length!==3) fail.push('V1 must have exactly 3 ready manuscript chapters');
if(outlines.length!==12) fail.push('V1 must keep chapters 4-15 as outline until manuscript exists');
for(const ch of ready){
  if(!Array.isArray(ch.body)||ch.body.length<1) fail.push(ch.id+' ready chapter body missing');
  if(!ch.practice) fail.push(ch.id+' ready chapter practice missing');
}
for(const ch of outlines){
  if(Array.isArray(ch.body)&&ch.body.length) fail.push(ch.id+' outline must not masquerade as finished body');
  if(!ch.summary) fail.push(ch.id+' outline summary missing');
}
const profile=source.publicationProfile.readyChapterIds;
if(JSON.stringify(profile)!==JSON.stringify(ready.map(x=>x.id))) fail.push('publicationProfile ready list drift');

for(const file of ['scripts/generate-studio-epub-v1.mjs','scripts/generate-studio-print-pdf-v1.mjs','src/pages/studio/projects/series-02/preview/index.astro']){
  const text=fs.readFileSync(file,'utf8');
  if(!text.includes('series-02-source.json')) fail.push(file+' does not consume canonical source');
  if(text.includes('series-02-epub-source.json')) fail.push(file+' still references legacy EPUB source');
}

const hash=crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
console.log('Series 02 SSOT SHA256',hash);
console.log('ready',ready.length,'outline',outlines.length);
if(fail.length){console.error('Series 02 Source of Truth Gate V1 FAIL\n- '+fail.join('\n- '));process.exit(1);}
console.log('Series 02 Source of Truth Gate V1 PASS');

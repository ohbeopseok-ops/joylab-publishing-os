import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const arg=process.argv.find((x)=>x.startsWith('--file='));
const pdf=arg?path.resolve(root,arg.slice(7)):path.join(root,'dist/studio/exports/series-02-memory-debt-print.pdf');

if(!fs.existsSync(pdf)) throw new Error('PDF missing: '+pdf);
const bytes=fs.readFileSync(pdf);
if(bytes.length<5000) throw new Error('PDF too small');
if(bytes.subarray(0,5).toString('ascii')!=='%PDF-') throw new Error('PDF header invalid');
if(bytes.indexOf(Buffer.from('%%EOF'))<0) throw new Error('PDF EOF missing');

const info=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});
const pageMatch=info.match(/^Pages:\s+(\d+)/m);
if(!pageMatch) throw new Error('Could not read PDF page count');
const pages=Number(pageMatch[1]);
if(pages<5) throw new Error('Expected at least 5 pages, got '+pages);

for(let page=1;page<=pages;page++){
  const one=execFileSync('pdfinfo',['-f',String(page),'-l',String(page),pdf],{encoding:'utf8'});
  const size=one.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
  if(!size) throw new Error('Missing page size for page '+page);
  const w=Number(size[1]), h=Number(size[2]);
  const a5=(w>=418&&w<=422&&h>=593&&h<=597)||(h>=418&&h<=422&&w>=593&&w<=597);
  if(!a5) throw new Error('Non-A5 page '+page+': '+w+'x'+h);
}

const fonts=execFileSync('pdffonts',[pdf],{encoding:'utf8'}).trim().split('\n').slice(2).filter(Boolean);
if(!fonts.length) throw new Error('No fonts reported by pdffonts');
const unembedded=[];
const unparsable=[];
for(const row of fonts){
  const match=row.match(/\s+(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/i);
  if(!match){
    unparsable.push(row);
    continue;
  }
  const emb=match[1].toLowerCase();
  if(emb!=='yes') unembedded.push(row);
}
if(unparsable.length) throw new Error('Could not parse pdffonts rows:\n'+unparsable.join('\n'));
if(unembedded.length) throw new Error('Unembedded fonts:\n'+unembedded.join('\n'));

console.log('Studio PDF Preflight V1 PASS · pages='+pages+' · fonts='+fonts.length+' · bytes='+bytes.length);

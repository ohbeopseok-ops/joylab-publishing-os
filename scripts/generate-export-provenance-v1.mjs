import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const sourcePath=path.join(root,'src/data/studio/series-02-source.json');
const exportDir=path.join(root,'dist/studio/exports');
const outPath=path.join(exportDir,'export-provenance-v1.json');

const sha256=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');
const sourceBytes=fs.readFileSync(sourcePath);
const source=JSON.parse(sourceBytes.toString('utf8'));

const artifacts=[
  {id:'epub',path:'series-02-memory-debt.epub',format:'EPUB3',generator:'scripts/generate-studio-epub-v1.mjs'},
  {id:'printPdf',path:'series-02-memory-debt-print.pdf',format:'PDF/A5',generator:'scripts/generate-studio-print-pdf-v1.mjs'}
].map((item)=>{
  const full=path.join(exportDir,item.path);
  if(!fs.existsSync(full)) throw new Error('Missing export artifact: '+item.path);
  const bytes=fs.readFileSync(full);
  return {...item,bytes:bytes.length,sha256:sha256(bytes)};
});

const ready=source.chapters.filter((ch)=>ch.manuscriptStatus==='ready').map((ch)=>ch.id);
const manifest={
  contract:'JoyLab Export Provenance Manifest V1',
  projectId:'series-02',
  source:{
    path:'src/data/studio/series-02-source.json',
    contract:source.contract,
    sha256:sha256(sourceBytes),
    totalChapters:source.chapters.length,
    releaseReadyChapterIds:ready,
    publicationMode:source.publicationProfile?.mode ?? 'unknown'
  },
  artifacts,
  generatedAt:new Date().toISOString()
};

fs.mkdirSync(exportDir,{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Export Provenance Manifest V1:',path.relative(root,outPath));
console.log(JSON.stringify({sourceSha256:manifest.source.sha256,artifacts:manifest.artifacts.map(x=>({id:x.id,bytes:x.bytes,sha256:x.sha256}))},null,2));

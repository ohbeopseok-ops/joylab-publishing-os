import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const config=JSON.parse(fs.readFileSync(path.join(root,'config/series-02-release-v1.json'),'utf8'));
const manifestPath=path.join(root,'src/data/studio/releases/series-02-v1.0.0-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sourceBytes=fs.readFileSync(path.join(root,config.canonicalSource));
const source=JSON.parse(sourceBytes.toString('utf8'));
const sha256=(buf)=>crypto.createHash('sha256').update(buf).digest('hex');
const failures=[];

const eq=(label,a,b)=>{if(a!==b) failures.push(label+' mismatch: '+String(a)+' != '+String(b));};
eq('contract',manifest.contract,'JoyLab Immutable Release Manifest V1');
eq('projectId',manifest.projectId,config.projectId);
eq('releaseId',manifest.releaseId,config.releaseId);
eq('version',manifest.version,config.version);
eq('tag',manifest.tag,config.tag);
eq('state',manifest.state,'published');
eq('commitSha',manifest.commitSha,config.publishedCommitSha);
eq('source path',manifest.canonicalSource?.path,config.canonicalSource);
eq('source sha256',manifest.canonicalSource?.sha256,config.sourceSha256);
eq('computed source sha256',sha256(sourceBytes),manifest.canonicalSource?.sha256);
eq('ready chapters',manifest.canonicalSource?.readyChapters,config.requiredReadyChapters);
eq('total chapters',manifest.canonicalSource?.totalChapters,source.chapters.length);
eq('release gate',manifest.releaseGate?.gate,'JoyLab Release Gate V1');
eq('release gate status',manifest.releaseGate?.status,'GOLD');
if(!manifest.releaseGate?.runId) failures.push('release gate runId missing');

const requiredGateChecks=[
  'build',
  'cloudflareDeploy',
  'customDomain',
  'productionSmoke',
  'studioProductionSmoke',
  'productionMobileVisualQa',
  'productionResponsiveVisualQa',
  'productionReaderQa',
  'productionMindmapQa'
];
for (const name of requiredGateChecks) {
  const value=manifest.releaseGate?.checks?.[name];
  if(value!=='success') failures.push('required release gate check not success: '+name+'='+String(value));
}

try {
  const ref='refs/tags/'+manifest.tag;
  const output=execFileSync('git',['ls-remote','--tags','origin',ref,ref+'^{}'],{encoding:'utf8'});
  const rows=output.trim().split(/\r?\n/).filter(Boolean).map((line)=>line.trim().split(/\s+/));
  const peeled=rows.find((row)=>row[1]===ref+'^{}');
  const direct=rows.find((row)=>row[1]===ref);
  const resolved=(peeled?.[0]||direct?.[0]||'').trim();
  if(!resolved) failures.push('release tag missing on origin: '+manifest.tag);
  else if(resolved!==manifest.commitSha) failures.push('release tag target mismatch: '+resolved+' != '+manifest.commitSha);
} catch (error) {
  failures.push('release tag verification failed: '+error.message);
}

if(manifest.immutability?.supersedeOnly!==true) failures.push('supersedeOnly must be true');

if(failures.length){
  console.error('Series 02 Immutable Release Manifest V1: FAIL');
  failures.forEach((x)=>console.error('- '+x));
  process.exit(1);
}
console.log('Series 02 Immutable Release Manifest V1: PASS');
console.log(JSON.stringify({releaseId:manifest.releaseId,tag:manifest.tag,commitSha:manifest.commitSha,sourceSha256:manifest.canonicalSource.sha256,runId:manifest.releaseGate.runId},null,2));

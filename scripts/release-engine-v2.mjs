import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const engine=JSON.parse(fs.readFileSync(path.join(root,'config/release-engine-v2.json'),'utf8'));
const projectId=process.argv[2] || 'series-02';
const mode=process.argv[3] || 'verify';
const project=engine.projects?.[projectId];
if(!project) throw new Error('Unknown release project: '+projectId);

const release=JSON.parse(fs.readFileSync(path.join(root,project.releaseConfig),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,project.manifest),'utf8'));
const sourceBytes=fs.readFileSync(path.join(root,project.source));
const sha256=(buf)=>crypto.createHash('sha256').update(buf).digest('hex');
const failures=[];
const eq=(label,a,b)=>{if(a!==b) failures.push(label+': '+String(a)+' != '+String(b));};

eq('state',release.state,'published');
eq('projectId',release.projectId,projectId);
eq('manifest projectId',manifest.projectId,projectId);
eq('releaseId',manifest.releaseId,release.releaseId);
eq('version',manifest.version,release.version);
eq('tag',manifest.tag,release.tag);
eq('commit',manifest.commitSha,release.publishedCommitSha);
eq('manifest GOLD',manifest.releaseGate?.status,project.requiredStatus);
eq('release gate',manifest.releaseGate?.gate,project.requiredGate);
eq('source path',manifest.canonicalSource?.path,project.source);
eq('source sha config',manifest.canonicalSource?.sha256,release.sourceSha256);
eq('source sha computed',sha256(sourceBytes),release.sourceSha256);

const ref='refs/tags/'+release.tag;
let resolved='';
try {
  const output=execFileSync('git',['ls-remote','--tags','origin',ref,ref+'^{}'],{encoding:'utf8'}).trim();
  const rows=output ? output.split(/\r?\n/).map((line)=>line.trim().split(/\s+/)) : [];
  const peeled=rows.find((row)=>row[1]===ref+'^{}');
  const direct=rows.find((row)=>row[1]===ref);
  resolved=(peeled?.[0]||direct?.[0]||'').trim();
} catch {}

if(mode==='verify-tag') {
  if(!resolved) failures.push('release tag missing: '+release.tag);
  else eq('tag target',resolved,release.publishedCommitSha);
} else if(mode==='plan-tag') {
  if(resolved && resolved!==release.publishedCommitSha) failures.push('immutable tag points elsewhere: '+resolved);
}

if(failures.length){
  console.error('JoyLab Release Engine V2: BLOCKED');
  failures.forEach((x)=>console.error('- '+x));
  process.exit(1);
}
console.log('JoyLab Release Engine V2: PASS');
console.log(JSON.stringify({
  projectId,
  releaseId:release.releaseId,
  version:release.version,
  tag:release.tag,
  publishedCommitSha:release.publishedCommitSha,
  sourceSha256:release.sourceSha256,
  mode,
  tagState: resolved ? 'exists' : 'missing'
},null,2));

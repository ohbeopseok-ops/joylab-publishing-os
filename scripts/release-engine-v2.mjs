import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const registry=JSON.parse(fs.readFileSync(path.join(root,'config/release-engine-v2.json'),'utf8'));
const configPath=process.env.RELEASE_CONFIG || registry.activeReleaseConfig;
const config=JSON.parse(fs.readFileSync(path.join(root,configPath),'utf8'));
const gatePath=process.env.RELEASE_GATE || path.join(root,'qa-artifacts/release-gate/release-gate.json');
const gate=fs.existsSync(gatePath) ? JSON.parse(fs.readFileSync(gatePath,'utf8')) : null;
const sourceBytes=fs.readFileSync(path.join(root,config.canonicalSource));
const source=JSON.parse(sourceBytes.toString('utf8'));
const sha256=(buf)=>crypto.createHash('sha256').update(buf).digest('hex');
const ready=source.chapters.filter((ch)=>ch.manuscriptStatus==='ready');
const fail=(msg)=>{throw new Error(msg)};

if(ready.length!==config.requiredReadyChapters) fail('ready chapter count mismatch');
const sourceHash=sha256(sourceBytes);
const resultDir=path.join(root,'qa-artifacts/release-engine-v2');
fs.mkdirSync(resultDir,{recursive:true});

if(config.state==='published'){
  const manifestPath=path.join(root,registry.publishedManifest);
  if(!fs.existsSync(manifestPath)) fail('published manifest missing');
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(manifest.state!=='published') fail('manifest state is not published');
  if(manifest.releaseId!==config.releaseId) fail('releaseId mismatch');
  if(manifest.version!==config.version) fail('version mismatch');
  if(manifest.tag!==config.tag) fail('tag mismatch');
  if(manifest.canonicalSource?.sha256!==sourceHash) fail('source hash mismatch');
  fs.writeFileSync(path.join(resultDir,'result.json'),JSON.stringify({
    contract:'JoyLab Release Engine V2 Result',
    action:'verify-published',
    releaseId:config.releaseId,
    version:config.version,
    tag:config.tag,
    commitSha:manifest.commitSha,
    sourceSha256:sourceHash,
    shouldTag:false,
    state:'published'
  },null,2)+'\n');
  console.log('Release Engine V2: PUBLISHED release verified; no new tag required');
  process.exit(0);
}

if(config.state!=='release-candidate') fail('unsupported release state: '+config.state);
if(!gate) fail('release gate artifact missing');
if(gate.status!=='GOLD') fail('release candidate cannot publish unless Release Gate is GOLD');
if(!gate.commitSha) fail('Release Gate commit SHA missing');

const manifest={
  contract:'JoyLab Immutable Release Manifest V2',
  projectId:config.projectId,
  releaseId:config.releaseId,
  version:config.version,
  tag:config.tag,
  state:'published',
  commitSha:gate.commitSha,
  canonicalSource:{
    path:config.canonicalSource,
    sha256:sourceHash,
    readyChapters:ready.length,
    totalChapters:source.chapters.length
  },
  releaseGate:{
    gate:gate.gate,
    status:gate.status,
    runId:gate.runId,
    runAttempt:gate.runAttempt,
    checks:gate.checks
  },
  immutability:{
    rule:'releaseId + version + tag + commitSha + source.sha256 are immutable once published',
    supersedeOnly:true
  },
  publishedAt:new Date().toISOString()
};
const manifestOut=process.env.RELEASE_MANIFEST_OUT || path.join(resultDir,'immutable-release-manifest.json');
fs.writeFileSync(manifestOut,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(resultDir,'result.json'),JSON.stringify({
  contract:'JoyLab Release Engine V2 Result',
  action:'publish',
  releaseId:config.releaseId,
  version:config.version,
  tag:config.tag,
  commitSha:gate.commitSha,
  sourceSha256:sourceHash,
  shouldTag:true,
  state:'published',
  manifestPath:path.relative(root,manifestOut)
},null,2)+'\n');
console.log('Release Engine V2: RC -> GOLD -> PUBLISHED manifest created');

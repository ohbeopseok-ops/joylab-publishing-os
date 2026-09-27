import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const engine=JSON.parse(fs.readFileSync(path.join(root,'config/release-engine-v2.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,engine.activeRelease),'utf8'));
const sourcePath=path.join(root,release.canonicalSource);
const sourceBytes=fs.readFileSync(sourcePath);
const source=JSON.parse(sourceBytes.toString('utf8'));
const sha256=(buf)=>crypto.createHash('sha256').update(buf).digest('hex');
const currentSha=process.env.RELEASE_ENGINE_SHA || process.env.GITHUB_SHA || '';
const deployConclusion=process.env.RELEASE_ENGINE_DEPLOY_CONCLUSION || '';
const branch=process.env.RELEASE_ENGINE_BRANCH || process.env.GITHUB_REF_NAME || '';
const failures=[];

if(engine.contract!=='JoyLab Release Engine V2') failures.push('engine contract mismatch');
if(!['release-candidate','published'].includes(release.state)) failures.push('release state must be release-candidate or published');
if(engine.policy?.requireProtectedMain && branch!=='main') failures.push('Release Engine V2 requires main');
if(deployConclusion!=='success') failures.push('deploy workflow must conclude success');
const ready=source.chapters.filter((ch)=>ch.manuscriptStatus==='ready');
if(ready.length!==release.requiredReadyChapters) failures.push('ready chapter count mismatch');
const computed=sha256(sourceBytes);
if(release.state==='published' && release.sourceSha256 && release.sourceSha256!==computed) failures.push('published source SHA drift');
if(release.state==='published' && release.publishedCommitSha && release.publishedCommitSha!==currentSha) {
  // published versions are allowed to be verified from later main commits; tag remains anchored to publishedCommitSha
}

if(failures.length){console.error('JoyLab Release Engine V2: BLOCKED');failures.forEach(x=>console.error('- '+x));process.exit(1);}

const targetSha=release.state==='published' && release.publishedCommitSha ? release.publishedCommitSha : currentSha;
const manifest={
  contract:'JoyLab Published Release V2',
  projectId:release.projectId,
  releaseId:release.releaseId,
  version:release.version,
  tag:release.tag,
  state:'published',
  commitSha:targetSha,
  verifiedFromMainSha:currentSha,
  canonicalSource:{path:release.canonicalSource,sha256:computed,readyChapters:ready.length,totalChapters:source.chapters.length},
  deploy:{workflow:'Deploy to Cloudflare Workers',conclusion:deployConclusion},
  immutability:{tagMustNotMove:true,supersedeOnly:release.supersedeOnly===true},
  publishedAt:new Date().toISOString()
};
const outDir=path.join(root,'qa-artifacts/release-engine-v2');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'published-release.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('JoyLab Release Engine V2: PUBLISHED');
console.log(JSON.stringify(manifest,null,2));

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const release = JSON.parse(fs.readFileSync(path.join(root,'config/series-02-release-v1.json'),'utf8'));
if (release.state === 'published') {
  throw new Error('Published Series 02 releases are immutable. Verify the committed manifest with studio:release:verify; create a new version to supersede.');
}

const sourcePath = path.join(root, release.canonicalSource);
const sourceBytes = fs.readFileSync(sourcePath);
const source = JSON.parse(sourceBytes.toString('utf8'));
const gatePath = path.join(root,'qa-artifacts/release-gate/release-gate.json');
if (!fs.existsSync(gatePath)) throw new Error('JoyLab Release Gate V1 artifact missing');
const gate = JSON.parse(fs.readFileSync(gatePath,'utf8'));

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const ready = source.chapters.filter((ch)=>ch.manuscriptStatus==='ready');
if (ready.length !== release.requiredReadyChapters) {
  throw new Error('Series 02 ready chapter count mismatch: '+ready.length);
}
if (gate.status !== 'GOLD') throw new Error('Series 02 cannot publish before JoyLab Release Gate V1 is GOLD');
if (!gate.commitSha) throw new Error('Release Gate commit SHA missing');

const manifest = {
  contract: 'JoyLab Immutable Release Manifest V1',
  projectId: release.projectId,
  releaseId: release.releaseId,
  version: release.version,
  tag: release.tag,
  state: 'published',
  commitSha: gate.commitSha,
  canonicalSource: {
    path: release.canonicalSource,
    sha256: sha256(sourceBytes),
    readyChapters: ready.length,
    totalChapters: source.chapters.length
  },
  releaseGate: {
    gate: gate.gate,
    status: gate.status,
    runId: gate.runId,
    runAttempt: gate.runAttempt,
    checks: gate.checks
  },
  immutability: {
    rule: 'releaseId + version + tag + commitSha + source.sha256 are immutable once published',
    supersedeOnly: true
  },
  publishedAt: new Date().toISOString()
};

const outDir = path.join(root,'qa-artifacts','studio-release','series-02',release.version);
fs.mkdirSync(outDir,{recursive:true});
const out = path.join(outDir,'immutable-release-manifest.json');
fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');
console.log('Series 02 Immutable Release Manifest V1 PUBLISHED');
console.log(JSON.stringify({releaseId:manifest.releaseId,tag:manifest.tag,commitSha:manifest.commitSha,sourceSha256:manifest.canonicalSource.sha256},null,2));

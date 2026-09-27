import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const args=process.argv.slice(2);
const action=args[0]||'validate';
const configArg=args.find((x)=>x.startsWith('--config='))?.slice(9)||process.env.RELEASE_CONFIG;
if(!configArg) throw new Error('release config required: --config=<path> or RELEASE_CONFIG');
const configPath=path.resolve(root,configArg);
const spec=JSON.parse(fs.readFileSync(configPath,'utf8'));
const fail=[];
const sha256=(buf)=>crypto.createHash('sha256').update(buf).digest('hex');
const eq=(label,a,b)=>{if(a!==b) fail.push(label+' mismatch: '+String(a)+' != '+String(b));};

if(spec.contract!=='JoyLab Release Engine Contract V2') fail.push('unsupported release contract');
if(!['release-candidate','published'].includes(spec.state)) fail.push('invalid state');
if(!/^\d+\.\d+\.\d+$/.test(spec.version||'')) fail.push('invalid semver version');
if(!spec.projectId||!spec.releaseId||!spec.tag) fail.push('projectId/releaseId/tag required');
if(!spec.canonicalSource||!fs.existsSync(path.join(root,spec.canonicalSource))) fail.push('canonical source missing');
if(!spec.releasePath||!spec.manifestPath) fail.push('releasePath/manifestPath required');

const sourceBytes=fs.existsSync(path.join(root,spec.canonicalSource||''))?fs.readFileSync(path.join(root,spec.canonicalSource)):Buffer.from('');
const source=sourceBytes.length?JSON.parse(sourceBytes.toString('utf8')):{chapters:[]};
const ready=Array.isArray(source.chapters)?source.chapters.filter((x)=>x.manuscriptStatus==='ready'):[];
if(spec.requiredReadyChapters!==undefined&&ready.length!==spec.requiredReadyChapters) fail.push('ready chapter count '+ready.length+' != '+spec.requiredReadyChapters);

if(action==='validate'){
  if(fail.length){fail.forEach((x)=>console.error('- '+x));process.exit(1);}
  console.log('JoyLab Release Engine V2 VALID');
  console.log(JSON.stringify({releaseId:spec.releaseId,state:spec.state,version:spec.version,ready:ready.length,sourceSha256:sha256(sourceBytes)},null,2));
  process.exit(0);
}

if(action==='promote'){
  const gateArg=args.find((x)=>x.startsWith('--gate='))?.slice(7)||process.env.RELEASE_GATE_PATH||'qa-artifacts/release-gate/release-gate.json';
  const gatePath=path.resolve(root,gateArg);
  if(!fs.existsSync(gatePath)) fail.push('release gate artifact missing');
  const gate=fs.existsSync(gatePath)?JSON.parse(fs.readFileSync(gatePath,'utf8')):{};
  if(gate.status!=='GOLD') fail.push('release gate must be GOLD');
  if(!gate.commitSha) fail.push('release gate commit SHA missing');
  if(spec.state!=='release-candidate') fail.push('promote requires release-candidate state');
  if(fail.length){fail.forEach((x)=>console.error('- '+x));process.exit(1);}

  const manifest={
    contract:'JoyLab Immutable Release Manifest V2',
    engine:'JoyLab Release Engine V2',
    projectId:spec.projectId,
    releaseId:spec.releaseId,
    version:spec.version,
    tag:spec.tag,
    state:'published',
    commitSha:gate.commitSha,
    canonicalSource:{path:spec.canonicalSource,sha256:sha256(sourceBytes),readyChapters:ready.length,totalChapters:source.chapters.length},
    artifacts:spec.artifacts||{},
    releasePath:spec.releasePath,
    releaseGate:{gate:gate.gate,status:gate.status,runId:gate.runId,runAttempt:gate.runAttempt,checks:gate.checks},
    immutability:{rule:'version + tag + GOLD commit SHA + source SHA256 are immutable',supersedeOnly:true},
    publishedAt:new Date().toISOString()
  };
  const out=path.resolve(root,spec.manifestPath);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');
  console.log('JoyLab Release Engine V2 PROMOTED');
  console.log(JSON.stringify({manifest:spec.manifestPath,tag:spec.tag,commitSha:gate.commitSha},null,2));
  process.exit(0);
}

if(action==='verify-tag'){
  const manifest=JSON.parse(fs.readFileSync(path.resolve(root,spec.manifestPath),'utf8'));
  const ref='refs/tags/'+manifest.tag;
  const output=execFileSync('git',['ls-remote','--tags','origin',ref,ref+'^{}'],{encoding:'utf8'});
  const rows=output.trim().split(/\r?\n/).filter(Boolean).map((line)=>line.trim().split(/\s+/));
  const peeled=rows.find((row)=>row[1]===ref+'^{}');
  const direct=rows.find((row)=>row[1]===ref);
  const resolved=(peeled?.[0]||direct?.[0]||'').trim();
  eq('tag target',resolved,manifest.commitSha);
  if(fail.length){fail.forEach((x)=>console.error('- '+x));process.exit(1);}
  console.log('JoyLab Release Engine V2 TAG VERIFIED '+manifest.tag+' -> '+resolved);
  process.exit(0);
}

throw new Error('unknown action: '+action);

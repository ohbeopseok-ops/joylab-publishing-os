#!/usr/bin/env node
// Read-only release-asset gate for a future Cloudflare-native preview deployment.
// This does not deploy, change Actions, or imply production readiness.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures = [];
const rootPath = (p) => path.join(root, p);
const check = (ok, message) => { if (!ok) failures.push(message); };
const exists = (p) => fs.existsSync(rootPath(p));
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

let config = null;
try {
  config = JSON.parse(fs.readFileSync(rootPath('wrangler.jsonc'), 'utf8'));
} catch (error) {
  failures.push('Unable to parse wrangler.jsonc: ' + error.message);
}
if (config) {
  check(config.main === './worker/index.js', 'Worker entrypoint mismatch');
  check(config.assets?.directory === './dist', 'Cloudflare assets.directory must point to ./dist');
  check(config.assets?.binding === 'ASSETS', 'Cloudflare ASSETS binding mismatch');
  for (const domain of ['aijoylab.kr', 'www.aijoylab.kr']) {
    check(config.routes?.some((r) => r.pattern === domain && r.custom_domain === true),
      'Missing custom-domain route: ' + domain);
  }
}
check(exists('worker/index.js'), 'Missing worker/index.js');
check(exists('dist/index.html'), 'Missing built dist/index.html (run npm run build)');

const exportDir = 'dist/studio/exports';
const names = ['series-02-memory-debt.epub', 'series-02-memory-debt-print.pdf'];
const files = new Map();
for (const name of names) {
  const p = exportDir + '/' + name;
  if (!exists(p)) {
    failures.push('Missing required export: ' + p);
  } else {
    files.set(name, fs.readFileSync(rootPath(p)));
  }
}
const epub = files.get(names[0]);
if (epub) {
  check(epub.length >= 1000 && epub.readUInt32LE(0) === 0x04034b50,
    'EPUB signature/size invalid');
  check(epub.includes(Buffer.from('mimetypeapplication/epub+zip')),
    'EPUB mimetype entry missing');
}
const pdf = files.get(names[1]);
if (pdf) {
  check(pdf.length >= 5000 && pdf.subarray(0, 5).toString('ascii') === '%PDF-' &&
      pdf.includes(Buffer.from('%%EOF')), 'PDF signature/size invalid');
}

const manifestPath = exportDir + '/export-provenance-v1.json';
if (!exists(manifestPath)) {
  failures.push('Missing export provenance JSON: ' + manifestPath);
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(rootPath(manifestPath), 'utf8'));
    check(manifest.contract === 'JoyLab Export Provenance Manifest V1',
      'Provenance contract mismatch');
    for (const [id, name] of [['epub', names[0]], ['printPdf', names[1]]]) {
      const record = manifest.artifacts?.find((a) => a.id === id);
      check(Boolean(record), 'Missing provenance record: ' + id);
      if (record && files.has(name)) {
        check(record.sha256 === hash(files.get(name)), 'Provenance SHA256 mismatch: ' + name);
        check(record.bytes === files.get(name).length, 'Provenance length mismatch: ' + name);
      }
    }
  } catch (error) {
    failures.push('Unable to read export provenance JSON: ' + error.message);
  }
}
const immutablePath = 'dist/studio/releases/series-02/v1-0-0/immutable-release-manifest.json';
check(exists(immutablePath), 'Missing published immutable release manifest');

if (failures.length) {
  console.error('CLOUDFLARE DIRECT READINESS: BLOCKED');
  for (const message of failures) console.error(' - ' + message);
  process.exitCode = 2;
} else {
  console.log('CLOUDFLARE DIRECT READINESS: LOCAL ASSET GATE PASS');
  console.log('Preview deploy + independent HTTP/asset smoke are still required before any cutover.');
}

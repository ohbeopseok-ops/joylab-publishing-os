import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const registryPath = path.join(root, 'config/reader-binary-assets.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const failures = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function getBaseRef() {
  const event = process.env.GITHUB_EVENT_NAME;
  if (event === 'pull_request') {
    const base = process.env.GITHUB_BASE_REF || 'main';
    const mergeBase = git(['merge-base', 'HEAD', 'origin/' + base]);
    if (mergeBase) return mergeBase;
  }
  return git(['rev-parse', 'HEAD^']);
}

function readRegistryAt(ref) {
  if (!ref) return null;
  const raw = git(['show', ref + ':config/reader-binary-assets.json']);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const materializer = read('scripts/materialize-weight-of-silence-reader.mjs');

for (const [slug, asset] of Object.entries(registry.assets ?? {})) {
  for (const kind of ['reader', 'mindmap']) {
    const contract = asset[kind];
    if (!contract) continue;

    if (!/-v\d+\.bin$/i.test(contract.active)) {
      failures.push(slug + '/' + kind + ': active payload must use immutable -vN.bin filename; got ' + contract.active);
    }
    if ((contract.retired ?? []).includes(contract.active)) {
      failures.push(slug + '/' + kind + ': active payload is also listed as retired: ' + contract.active);
    }

    const loader = read(contract.loader);
    if (!loader.includes('./' + contract.active)) {
      failures.push(slug + '/' + kind + ': loader does not reference active payload ' + contract.active);
    }
    for (const retired of contract.retired ?? []) {
      if (loader.includes('./' + retired)) {
        failures.push(slug + '/' + kind + ': retired payload is active in loader: ' + retired);
      }
    }

    const expectedOutput = 'public/books/' + slug + '/' + contract.active;
    if (!materializer.includes(expectedOutput)) {
      failures.push(slug + '/' + kind + ': materializer does not generate ' + expectedOutput);
    }
  }
}

const baseRef = getBaseRef();
const baseRegistry = readRegistryAt(baseRef);
if (baseRef && baseRegistry) {
  for (const [slug, asset] of Object.entries(registry.assets ?? {})) {
    const oldAsset = baseRegistry.assets?.[slug];
    for (const kind of ['reader', 'mindmap']) {
      const contract = asset[kind];
      const sourceFile = contract?.sourceFile;
      if (!sourceFile) {
        failures.push(slug + '/' + kind + ': sourceFile is not registered');
        continue;
      }
      const changed = Boolean(git(['diff', '--name-only', baseRef + '..HEAD', '--', sourceFile]));
      if (!changed) continue;

      const previous = oldAsset?.[kind]?.active;
      const current = contract?.active;
      if (previous && current === previous) {
        failures.push(
          slug + '/' + kind + ': source HTML changed (' + sourceFile +
          ') but immutable payload name was not bumped from ' + current
        );
      }
    }
  }
}

if (failures.length) {
  console.error('Reader Binary Immutable Asset Gate FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Reader Binary Immutable Asset Gate PASS');
for (const [slug, asset] of Object.entries(registry.assets ?? {})) {
  console.log(slug + ': reader=' + asset.reader.active + ', mindmap=' + asset.mindmap.active);
}

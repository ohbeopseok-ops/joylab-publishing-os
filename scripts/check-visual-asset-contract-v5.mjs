import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const contractPath = path.join(root, 'src/data/visual-asset-contract-v5.json');
const brandHomePath = path.join(root, 'src/styles/brand-system-v1-1.css');
const brandSurfacesPath = path.join(root, 'src/styles/brand-surfaces-v1-1.css');
const failures = [];
const records = [];

function read(file) {
  if (!fs.existsSync(file)) {
    failures.push(`missing file: ${path.relative(root, file)}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const contract = JSON.parse(read(contractPath) || '{}');

// V5 extends V4; V4 must remain green.
const v4 = spawnSync(process.execPath, ['scripts/check-visual-asset-contract-v4.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (v4.status !== 0) {
  failures.push('Visual Asset Contract V4 prerequisite failed');
  if (v4.stdout) process.stdout.write(v4.stdout);
  if (v4.stderr) process.stderr.write(v4.stderr);
} else if (v4.stdout) {
  process.stdout.write(v4.stdout);
}

const combinedBrandCss = [read(brandHomePath), read(brandSurfacesPath)].join('\n');

for (const [name, hex] of Object.entries(contract.palette ?? {})) {
  const normalized = String(hex).toLowerCase();
  const present = combinedBrandCss.toLowerCase().includes(normalized);
  records.push({ type: 'palette', name, value: hex, present });
  if (!present) failures.push(`palette token missing from brand CSS: ${name} ${hex}`);
}

for (const surface of contract.surfaces ?? []) {
  const file = path.join(root, surface.source);
  const source = read(file);
  const sourceChecks = (surface.requiredSource ?? []).map((token) => ({
    token,
    present: source.includes(token)
  }));
  for (const check of sourceChecks) {
    if (!check.present) failures.push(`${surface.name}: source token missing: ${check.token}`);
  }

  const route = surface.name === 'homepage'
    ? 'index.html'
    : surface.name === 'about'
      ? 'about/index.html'
      : surface.name === 'research'
        ? 'articles/index.html'
        : surface.name === 'books'
          ? 'books/index.html'
          : null;
  let renderedClass = null;
  if (route) {
    const renderedPath = path.join(root, 'dist', route);
    const html = read(renderedPath);
    renderedClass = html.includes(surface.bodyClass);
    if (!renderedClass) failures.push(`${surface.name}: rendered body class missing: ${surface.bodyClass}`);
  }
  records.push({ type: 'surface', name: surface.name, source: surface.source, sourceChecks, renderedClass });
}

const homeSource = read(path.join(root, 'src/pages/index.astro'));
if (!homeSource.includes(contract.microLanguage ?? '')) {
  failures.push(`homepage micro-language missing: ${contract.microLanguage}`);
}
for (const pillar of contract.pillars ?? []) {
  if (!homeSource.includes(`<span>${pillar}</span>`) && !homeSource.includes(pillar)) {
    failures.push(`homepage pillar label missing: ${pillar}`);
  }
}

const outDir = path.join(root, 'qa-artifacts', 'visual-asset-contract-v5');
fs.mkdirSync(outDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  version: contract.version,
  extends: contract.extends,
  surfaces: records.filter((r) => r.type === 'surface').length,
  paletteChecks: records.filter((r) => r.type === 'palette').length,
  failures,
  records
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('\nJoyLab Visual Asset Contract V5 FAILED\n');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}
console.log(`JoyLab Visual Asset Contract V5 PASS: ${report.surfaces} brand surfaces + ${report.paletteChecks} palette tokens verified; V4 prerequisite GREEN.`);

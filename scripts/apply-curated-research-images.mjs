import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
execFileSync(process.execPath, [path.join(root, 'scripts/assemble-generated-hero-assets.mjs')], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(root, 'scripts/generate-curated-research-visuals.mjs')], { stdio: 'inherit' });

const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const curatedPath = path.join(root, 'src/data/curated-research-images.json');
const generatedPath = path.join(root, 'src/data/curated-generated-heroes.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const curated = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));
const generated = fs.existsSync(generatedPath) ? JSON.parse(fs.readFileSync(generatedPath, 'utf8')) : {};
const overrides = { ...curated, ...generated };

for (const [articleId, config] of Object.entries(overrides)) {
  const current = manifest[articleId] || {};
  manifest[articleId] = {
    ...current,
    ...(config.hero ? { hero: config.hero } : {}),
    ...(config.supporting ? { supporting: config.supporting } : {})
  };
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Applied ${Object.keys(overrides).length} curated visual overrides.`);

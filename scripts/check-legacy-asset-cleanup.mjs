import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config/legacy-assets.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const failures = [];
const allowed = new Set(config.allowedRegistryFiles ?? []);

const scanRoots = ['src', 'public', 'scripts', '.github', 'config'];
const scanExts = new Set(['.astro','.md','.mdx','.json','.css','.js','.mjs','.ts','.tsx','.html','.yml','.yaml']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const searchableFiles = scanRoots
  .flatMap((base) => walk(path.join(root, base)))
  .filter((file) => scanExts.has(path.extname(file).toLowerCase()))
  .filter((file) => !allowed.has(rel(file)));

for (const item of config.retired ?? []) {
  const retiredPath = item.path;
  const absolute = path.join(root, retiredPath);

  if (fs.existsSync(absolute)) {
    failures.push(retiredPath + ': retired asset still exists in repository');
  }

  const publicUrl = retiredPath.startsWith('public/') ? '/' + retiredPath.slice('public/'.length) : retiredPath;
  const basename = path.basename(retiredPath);

  for (const file of searchableFiles) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    if (text.includes(publicUrl) || text.includes(retiredPath) || text.includes(basename)) {
      failures.push(retiredPath + ': active reference found in ' + rel(file));
    }
  }
}

if (failures.length) {
  console.error('Legacy Asset Cleanup Gate FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Legacy Asset Cleanup Gate PASS: ' + (config.retired ?? []).length + ' retired paths absent and unreferenced.');

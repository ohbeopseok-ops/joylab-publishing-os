import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];

const imageToFile = (src) => path.join(root, 'public', src.replace(/^\//, ''));
const readFrontmatter = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = match?.[1] ?? '';
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
    return m?.[1]?.trim();
  };
  return { series: get('series'), draft: get('draft') === 'true' };
};

for (const [articleId, visual] of Object.entries(manifest)) {
  const images = [visual?.hero, ...(visual?.supporting ?? [])].filter(Boolean);
  if (!visual?.hero?.src) failures.push(`${articleId}: hero image is missing`);
  if ((visual?.supporting ?? []).length < 2) failures.push(`${articleId}: at least 2 supporting images are required`);
  if (images.length < 3) failures.push(`${articleId}: minimum 3 research images are required`);

  const seen = new Set();
  for (const image of images) {
    if (!image?.src || !image?.alt) {
      failures.push(`${articleId}: every image requires src and alt`);
      continue;
    }
    if (seen.has(image.src)) failures.push(`${articleId}: duplicate image path ${image.src}`);
    seen.add(image.src);
    const file = imageToFile(image.src);
    if (!fs.existsSync(file)) failures.push(`${articleId}: missing asset ${image.src}`);
  }
}

// The first Living Research reference implementation is the U.S. Rates pillar.
for (const name of fs.readdirSync(articleDir).filter((name) => name.endsWith('.md'))) {
  const file = path.join(articleDir, name);
  const { series, draft } = readFrontmatter(file);
  const articleId = name.replace(/\.md$/, '');
  if (!draft && series === '미국 금리 리서치' && !manifest[articleId]) {
    failures.push(`${articleId}: U.S. Rates research must be registered in research-image-manifest.json`);
  }
}

// Forward gate: every newly added, published series article must ship with the 3-image contract.
if (process.env.GITHUB_EVENT_NAME === 'pull_request' && process.env.GITHUB_BASE_REF) {
  try {
    execSync(`git fetch origin ${process.env.GITHUB_BASE_REF} --depth=1`, { stdio: 'ignore' });
    const changed = execSync(`git diff --name-only --diff-filter=A origin/${process.env.GITHUB_BASE_REF}...HEAD -- src/data/articles`, { encoding: 'utf8' })
      .split('\n').map((v) => v.trim()).filter((v) => v.endsWith('.md'));
    for (const rel of changed) {
      const file = path.join(root, rel);
      const { series, draft } = readFrontmatter(file);
      if (!draft && series) {
        const articleId = path.basename(rel, '.md');
        if (!manifest[articleId]) failures.push(`${articleId}: new series research requires Hero + 2 supporting images`);
      }
    }
  } catch (error) {
    failures.push(`PR diff validation failed: ${error.message}`);
  }
}

if (failures.length) {
  console.error('\nResearch Image Gate FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Research Image Gate PASS: ${Object.keys(manifest).length} research articles, 3-image contract verified.`);

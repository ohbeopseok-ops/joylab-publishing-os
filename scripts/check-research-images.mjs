import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
execSync('node scripts/apply-curated-research-images.mjs', { stdio: 'inherit' });
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
  return { title: get('title') ?? '', series: get('series'), draft: get('draft') === 'true' };
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

let publishedResearchCount = 0;
for (const name of fs.readdirSync(articleDir).filter((name) => name.endsWith('.md'))) {
  const file = path.join(articleDir, name);
  const { title, series, draft } = readFrontmatter(file);
  const articleId = name.replace(/\.md$/, '');
  if (draft || !series) continue;
  publishedResearchCount += 1;

  const visual = manifest[articleId];
  if (!visual) {
    failures.push(`${articleId}: every published series research article must be registered in research-image-manifest.json`);
    continue;
  }

  const supportingCount = visual.supporting?.length ?? 0;
  const isCompare = /compare|value-chain|-vs-/i.test(articleId) || /비교|밸류체인/.test(title);
  if (!isCompare && supportingCount !== 2) {
    failures.push(`${articleId}: standard research requires exactly 2 supporting visuals`);
  }
  if (isCompare && (supportingCount < 2 || supportingCount > 3)) {
    failures.push(`${articleId}: compare/value-chain research requires 2 or 3 supporting visuals`);
  }
}

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
        if (!manifest[articleId]) failures.push(`${articleId}: new research requires Hero + 2 supporting visuals before merge`);
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

console.log(`Research Image Gate PASS: ${publishedResearchCount} published research articles verified.`);

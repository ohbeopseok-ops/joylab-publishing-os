import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];
let publishedCount = 0;

const readFrontmatter = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = match?.[1] ?? '';
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
    return m?.[1]?.trim();
  };
  return {
    draft: get('draft') === 'true',
    heroImage: get('heroImage'),
    heroAlt: get('heroAlt')
  };
};

const assetExists = (src) => {
  if (!src) return false;
  if (/^https?:\/\//i.test(src)) return true;
  if (!src.startsWith('/')) return false;
  return fs.existsSync(path.join(root, 'public', src.slice(1)));
};

for (const name of fs.readdirSync(articleDir).filter((name) => name.endsWith('.md')).sort()) {
  const articleId = name.replace(/\.md$/, '');
  const file = path.join(articleDir, name);
  const fm = readFrontmatter(file);
  if (fm.draft) continue;
  publishedCount += 1;

  const manifestHero = manifest[articleId]?.hero;
  const heroSrc = manifestHero?.src ?? fm.heroImage;
  const heroAlt = manifestHero?.alt ?? fm.heroAlt;

  if (!heroSrc) {
    failures.push(`${articleId}: published article requires a Hero image (manifest hero or heroImage frontmatter)`);
    continue;
  }
  if (!heroAlt) failures.push(`${articleId}: Hero image requires alt text`);
  if (!assetExists(heroSrc)) failures.push(`${articleId}: Hero asset does not exist: ${heroSrc}`);
}

if (failures.length) {
  console.error('\nArticle Hero Gate FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`\n${failures.length} Hero contract failure(s) across ${publishedCount} published articles.`);
  process.exit(1);
}

console.log(`Article Hero Gate PASS: ${publishedCount} published articles have a valid Hero image + alt.`);

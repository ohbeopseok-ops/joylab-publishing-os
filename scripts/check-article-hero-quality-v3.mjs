import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/data/research-image-manifest.json'), 'utf8'));
const overridesPath = path.join(root, 'src/data/article-image-overrides.json');
const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, 'utf8')) : {};
const rules = JSON.parse(fs.readFileSync(path.join(root, 'src/data/article-hero-quality-rules-v3.json'), 'utf8'));
const failures = [];
const warnings = [];
const records = [];

const getFrontmatter = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = match?.[1] ?? '';
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
    return m?.[1]?.trim();
  };
  return { draft: get('draft') === 'true', heroImage: get('heroImage') };
};

const markdownFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return markdownFiles(full);
  return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
});

const isRaster = (src) => /\.(?:webp|png|jpe?g)$/i.test(src.split('?')[0]);
const localPath = (src) => src?.startsWith('/') ? path.join(root, 'public', src.slice(1)) : null;

const analyzeRaster = async (file, config) => {
  const bytes = fs.readFileSync(file);
  const meta = await sharp(bytes).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const pixels = Math.max(1, width * height);
  const bytesPerPixel = bytes.length / pixels;
  const { data, info } = await sharp(bytes)
    .resize(config.analysisWidth, config.analysisHeight, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let edgeCount = 0;
  let lapSum = 0;
  let lapSqSum = 0;
  let lapCount = 0;
  const w = info.width;
  const h = info.height;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const c = data[i];
      const dx = Math.abs(data[i + 1] - data[i - 1]);
      const dy = Math.abs(data[i + w] - data[i - w]);
      if (Math.max(dx, dy) >= config.edgeThreshold) edgeCount += 1;
      const lap = (4 * c) - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
      lapSum += lap;
      lapSqSum += lap * lap;
      lapCount += 1;
    }
  }
  const edgeDensity = edgeCount / Math.max(1, lapCount);
  const lapMean = lapSum / Math.max(1, lapCount);
  const laplacianVariance = (lapSqSum / Math.max(1, lapCount)) - (lapMean * lapMean);
  return { width, height, bytes: bytes.length, bytesPerPixel, edgeDensity, laplacianVariance };
};

for (const file of markdownFiles(articleDir).sort()) {
  const relative = path.relative(articleDir, file).split(path.sep).join('/');
  const articleId = relative.replace(/\.md$/, '');
  const fm = getFrontmatter(file);
  if (fm.draft) continue;
  const hero = overrides[articleId]?.hero ?? manifest[articleId]?.hero;
  const heroSrc = hero?.src ?? fm.heroImage;
  if (!heroSrc || !isRaster(heroSrc)) continue;
  if (/^https?:\/\//i.test(heroSrc)) {
    failures.push(`${articleId}: remote raster Hero cannot be quality-verified locally; use a tracked local asset or vector Hero (${heroSrc})`);
    continue;
  }
  const filePath = localPath(heroSrc);
  if (!filePath || !fs.existsSync(filePath)) continue;

  const metric = await analyzeRaster(filePath, rules.raster);
  records.push({ articleId, heroSrc, ...metric });

  if (metric.width < rules.raster.hardMinWidth || metric.height < rules.raster.hardMinHeight) {
    failures.push(`${articleId}: raster Hero is undersized (${metric.width}x${metric.height}); minimum ${rules.raster.hardMinWidth}x${rules.raster.hardMinHeight}`);
  } else if (metric.width < rules.raster.recommendedWidth || metric.height < rules.raster.recommendedHeight) {
    warnings.push(`${articleId}: raster Hero below recommended ${rules.raster.recommendedWidth}x${rules.raster.recommendedHeight} (${metric.width}x${metric.height})`);
  }

  if (metric.width * metric.height >= 1000000 && metric.bytesPerPixel < rules.raster.severeBytesPerPixel) {
    failures.push(`${articleId}: probable overcompression (bytes/pixel=${metric.bytesPerPixel.toFixed(4)} < ${rules.raster.severeBytesPerPixel})`);
  }

  if (metric.laplacianVariance < rules.raster.blurLaplacianVariance && metric.edgeDensity < rules.raster.blurEdgeDensity) {
    failures.push(`${articleId}: probable blur/low-detail raster (lapVar=${metric.laplacianVariance.toFixed(1)}, edgeDensity=${metric.edgeDensity.toFixed(3)})`);
  }
}

if (warnings.length) {
  console.warn('\nArticle Hero Quality Gate V3 WARNINGS\n');
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
if (failures.length) {
  console.error('\nArticle Hero Quality Gate V3 FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`\n${failures.length} severe raster quality issue(s); ${records.length} raster Article Heroes inspected.`);
  process.exit(1);
}
console.log(`Article Hero Quality Gate V3 PASS: ${records.length} raster Article Heroes checked for dimensions, overcompression and blur.`);

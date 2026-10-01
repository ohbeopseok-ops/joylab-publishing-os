import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const rulesPath = path.join(root, 'src/data/research-image-quality-rules-v1.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
const failures = [];
const warnings = [];
const records = [];

const isRaster = (src) => /\.(?:webp|png|jpe?g)$/i.test(src.split('?')[0]);
const isSvg = (src) => /\.svg$/i.test(src.split('?')[0]);
const localPath = (src) => src?.startsWith('/') ? path.join(root, 'public', src.slice(1)) : null;

async function analyzeRaster(file, config) {
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
}

for (const [articleId, config] of Object.entries(manifest)) {
  const supporting = config?.supporting ?? [];
  supporting.forEach((image, index) => {
    if (!image?.src) failures.push(`${articleId}[supporting:${index}]: missing src`);
    if (!image?.alt?.trim()) failures.push(`${articleId}[supporting:${index}]: missing alt text`);
  });

  for (let index = 0; index < supporting.length; index += 1) {
    const image = supporting[index];
    const src = image?.src;
    if (!src) continue;
    if (/^https?:\/\//i.test(src)) {
      failures.push(`${articleId}[supporting:${index}]: remote image cannot be quality-verified locally (${src})`);
      continue;
    }
    const file = localPath(src);
    if (!file || !fs.existsSync(file)) {
      failures.push(`${articleId}[supporting:${index}]: asset missing (${src})`);
      continue;
    }

    if (isSvg(src)) {
      const svg = fs.readFileSync(file, 'utf8');
      const hasViewBox = /<svg\b[^>]*\bviewBox=["'][^"']+["']/i.test(svg);
      if (rules.svg.requireViewBox && !hasViewBox) {
        failures.push(`${articleId}[supporting:${index}]: SVG requires viewBox for responsive sharpness (${src})`);
      }
      records.push({ articleId, index, src, format: 'svg', hasViewBox });
      continue;
    }

    if (isRaster(src)) {
      const metric = await analyzeRaster(file, rules.raster);
      records.push({ articleId, index, src, format: 'raster', ...metric });
      if (metric.width < rules.raster.hardMinWidth || metric.height < rules.raster.hardMinHeight) {
        failures.push(`${articleId}[supporting:${index}]: raster undersized (${metric.width}x${metric.height})`);
      } else if (metric.width < rules.raster.recommendedWidth || metric.height < rules.raster.recommendedHeight) {
        warnings.push(`${articleId}[supporting:${index}]: below recommended ${rules.raster.recommendedWidth}x${rules.raster.recommendedHeight} (${metric.width}x${metric.height})`);
      }
      if (metric.width * metric.height >= 1000000 && metric.bytesPerPixel < rules.raster.severeBytesPerPixel) {
        failures.push(`${articleId}[supporting:${index}]: probable overcompression (bytes/pixel=${metric.bytesPerPixel.toFixed(4)})`);
      }
      if (metric.laplacianVariance < rules.raster.blurLaplacianVariance && metric.edgeDensity < rules.raster.blurEdgeDensity) {
        failures.push(`${articleId}[supporting:${index}]: probable blur/low-detail raster (lapVar=${metric.laplacianVariance.toFixed(1)}, edgeDensity=${metric.edgeDensity.toFixed(3)})`);
      }
      continue;
    }

    failures.push(`${articleId}[supporting:${index}]: unsupported image format (${src})`);
  }
}

const outDir = path.join(root, 'qa-artifacts', 'research-image-quality-v1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  total: records.length,
  svg: records.filter((r) => r.format === 'svg').length,
  raster: records.filter((r) => r.format === 'raster').length,
  warnings,
  failures,
  records
}, null, 2));

if (warnings.length) {
  console.warn('\nResearch Image Quality Gate V1 WARNINGS\n');
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
if (failures.length) {
  console.error('\nResearch Image Quality Gate V1 FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Research Image Quality Gate V1 PASS: ${records.length} supporting images checked (${records.filter((r) => r.format === 'svg').length} SVG, ${records.filter((r) => r.format === 'raster').length} raster).`);

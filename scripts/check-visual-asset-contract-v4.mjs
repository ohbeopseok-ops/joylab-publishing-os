import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const dist = path.join(root, 'dist');
const articleRoot = path.join(dist, 'articles');
const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const rulesPath = path.join(root, 'src/data/visual-asset-contract-v4.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
const failures = [];
const warnings = [];
const records = [];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function attr(tag, name) {
  const match = tag.match(new RegExp(name + '=["\']([^"\']*)["\']', 'i'));
  return match?.[1] ?? '';
}

function isRemote(value) {
  return /^https?:\/\//i.test(String(value ?? '').replace(/&amp;/g, '&'));
}

function normalize(value) {
  if (!value) return '';
  const decoded = String(value).replace(/&amp;/g, '&');
  try {
    if (isRemote(decoded)) return new URL(decoded).pathname;
  } catch {}
  return decoded.split('?')[0];
}

function localPath(src) {
  return src?.startsWith('/') ? path.join(dist, src.replace(/^\//, '')) : null;
}

function isRaster(src) {
  return /\.(?:webp|png|jpe?g)$/i.test(src.split('?')[0]);
}

function isSvg(src) {
  return /\.svg$/i.test(src.split('?')[0]);
}

function extractMetaOg(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (attr(tag, 'property').toLowerCase() === 'og:image') return normalize(attr(tag, 'content'));
  }
  return '';
}

function extractContractTag(html) {
  return (html.match(/<(?:article|section)\b[^>]*data-asset-contract-version=["\']4["\'][^>]*>/i) ?? [])[0] ?? '';
}

function extractVisualResearch(html) {
  const start = html.indexOf('id="visual-research"');
  if (start < 0) return '';
  const sectionStart = html.lastIndexOf('<section', start);
  const nextSection = html.indexOf('<section', start + 1);
  const end = nextSection >= 0 ? nextSection : html.length;
  return html.slice(sectionStart >= 0 ? sectionStart : start, end);
}

function imgTags(fragment) {
  return fragment.match(/<img\b[^>]*>/gi) ?? [];
}

async function inspectRaster(file, config) {
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

async function validateAsset({ slug, role, src, tag = '', index = null }) {
  if (!src) {
    failures.push(`${slug}: ${role}${index === null ? '' : '[' + index + ']'} src missing`);
    return;
  }
  if (isRemote(src)) {
    failures.push(`${slug}: ${role} must be tracked locally for deterministic validation (${src})`);
    return;
  }
  const normalizedSrc = normalize(src);
  const roleRules = rules.roles[role];
  const file = localPath(normalizedSrc);
  if (!file || !fs.existsSync(file) || fs.statSync(file).size <= 0) {
    failures.push(`${slug}: ${role} asset missing from dist (${normalizedSrc})`);
    return;
  }

  if (role === 'hero' && roleRules.requireHighPriority && tag && !/fetchpriority=["\']high["\']/i.test(tag)) {
    failures.push(`${slug}: hero must use fetchpriority=high`);
  }
  if (role === 'supporting' && roleRules.requireLazy && tag && !/loading=["\']lazy["\']/i.test(tag)) {
    failures.push(`${slug}: supporting image must use loading=lazy (${normalizedSrc})`);
  }

  if (isSvg(normalizedSrc)) {
    const svg = fs.readFileSync(file, 'utf8');
    const hasViewBox = /<svg\b[^>]*\bviewBox=["\'][^"\']+["\']/i.test(svg);
    if (rules.svg.requireViewBox && !hasViewBox) {
      failures.push(`${slug}: ${role} SVG missing viewBox (${normalizedSrc})`);
    }
    records.push({ slug, role, index, src: normalizedSrc, format: 'svg', hasViewBox });
    return;
  }

  if (!isRaster(normalizedSrc)) {
    failures.push(`${slug}: ${role} unsupported format (${normalizedSrc})`);
    return;
  }

  const metric = await inspectRaster(file, rules.rasterQuality);
  if (metric.width < roleRules.hardMinWidth || metric.height < roleRules.hardMinHeight) {
    failures.push(`${slug}: ${role} undersized ${metric.width}x${metric.height}; minimum ${roleRules.hardMinWidth}x${roleRules.hardMinHeight}`);
  } else if (metric.width < roleRules.recommendedWidth || metric.height < roleRules.recommendedHeight) {
    warnings.push(`${slug}: ${role} below recommended ${roleRules.recommendedWidth}x${roleRules.recommendedHeight} (${metric.width}x${metric.height})`);
  }

  if (metric.width * metric.height >= 1000000 && metric.bytesPerPixel < rules.rasterQuality.severeBytesPerPixel) {
    failures.push(`${slug}: ${role} probable overcompression (bytes/pixel=${metric.bytesPerPixel.toFixed(4)})`);
  }
  if (metric.laplacianVariance < rules.rasterQuality.blurLaplacianVariance && metric.edgeDensity < rules.rasterQuality.blurEdgeDensity) {
    failures.push(`${slug}: ${role} probable blur/low-detail raster (lapVar=${metric.laplacianVariance.toFixed(1)}, edgeDensity=${metric.edgeDensity.toFixed(3)})`);
  }

  records.push({ slug, role, index, src: normalizedSrc, format: 'raster', ...metric });
}

const pages = walk(articleRoot).filter((file) => path.basename(file) === 'index.html' && path.relative(articleRoot, file).split(path.sep).length === 2);
if (!pages.length) failures.push('No Article pages found in dist; Visual Asset Contract V4 requires at least one rendered article.');

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const slug = path.basename(path.dirname(file));
  const contract = extractContractTag(html);
  if (!contract) {
    failures.push(`${slug}: missing data-asset-contract-version="4"`);
    continue;
  }

  const declaredKind = attr(contract, 'data-asset-contract-kind');
  const heroRaw = attr(contract, 'data-asset-contract-hero');
  const ogRaw = attr(contract, 'data-asset-contract-og');
  const hero = normalize(heroRaw);
  const og = normalize(ogRaw);
  const declaredSupporting = Number(attr(contract, 'data-asset-contract-supporting') || '0');
  if (declaredKind !== 'article') failures.push(`${slug}: contract kind must be article`);

  const metaOg = extractMetaOg(html);
  if (!og) failures.push(`${slug}: declared OG missing`);
  if (!metaOg) failures.push(`${slug}: rendered og:image missing`);
  if (og && metaOg && og !== metaOg) failures.push(`${slug}: OG mismatch declared=${og} rendered=${metaOg}`);

  const allImgs = imgTags(html);
  const heroTag = allImgs.find((tag) => normalize(attr(tag, 'src')) === hero) ?? '';
  if (hero) {
    if (!heroTag) failures.push(`${slug}: declared Hero not rendered (${hero})`);
    else {
      if (!attr(heroTag, 'alt').trim()) failures.push(`${slug}: Hero alt missing`);
      await validateAsset({ slug, role: 'hero', src: heroRaw, tag: heroTag });
    }
  }

  if (og) await validateAsset({ slug, role: 'og', src: ogRaw });

  const expectedRaw = (manifest[slug]?.supporting ?? []).map((item) => item.src);
  const expected = expectedRaw.map((src) => normalize(src));
  if (declaredSupporting !== expected.length) {
    failures.push(`${slug}: supporting count mismatch declared=${declaredSupporting} manifest=${expected.length}`);
  }

  const visual = extractVisualResearch(html);
  const renderedSupportingTags = imgTags(visual);
  const renderedSupporting = renderedSupportingTags.map((tag) => normalize(attr(tag, 'src')));

  if (expected.length !== renderedSupporting.length) {
    failures.push(`${slug}: supporting render count mismatch manifest=${expected.length} rendered=${renderedSupporting.length}`);
  }
  for (let i = 0; i < expected.length; i += 1) {
    if (renderedSupporting[i] !== expected[i]) {
      failures.push(`${slug}: supporting[${i}] mismatch manifest=${expected[i]} rendered=${renderedSupporting[i] ?? 'missing'}`);
      continue;
    }
    const tag = renderedSupportingTags[i] ?? '';
    if (!attr(tag, 'alt').trim()) failures.push(`${slug}: supporting[${i}] alt missing`);
    await validateAsset({ slug, role: 'supporting', src: expectedRaw[i], tag, index: i });
  }
}

const outDir = path.join(root, 'qa-artifacts', 'visual-asset-contract-v4');
fs.mkdirSync(outDir, { recursive: true });
const summary = {
  generatedAt: new Date().toISOString(),
  version: rules.version,
  pages: pages.length,
  assets: records.length,
  byRole: {
    hero: records.filter((r) => r.role === 'hero').length,
    supporting: records.filter((r) => r.role === 'supporting').length,
    og: records.filter((r) => r.role === 'og').length
  },
  warnings,
  failures,
  records
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));

if (warnings.length) {
  console.warn('\nJoyLab Visual Asset Contract V4 WARNINGS\n');
  warnings.forEach((w) => console.warn('- ' + w));
}
if (failures.length) {
  console.error('\nJoyLab Visual Asset Contract V4 FAILED\n');
  failures.forEach((f) => console.error('- ' + f));
  process.exit(1);
}

console.log(`JoyLab Visual Asset Contract V4 PASS: ${pages.length} article pages / ${records.length} assets verified (Hero ${summary.byRole.hero}, Supporting ${summary.byRole.supporting}, OG ${summary.byRole.og}).`);

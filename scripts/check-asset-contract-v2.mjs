import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const cssPath = path.join(root, 'src/styles/growth-leadership-guide-v2.css');
const css = fs.readFileSync(cssPath, 'utf8');

const literatureContracts = [
  { name: 'EP01', html: 'dist/guides/growth-leadership/literature/old-man-and-the-sea/index.html', cssClass: 'le-visual--ep01' },
  { name: 'EP02', html: 'dist/guides/growth-leadership/literature/little-prince/index.html', cssClass: 'le-visual--ep02' },
  { name: 'EP03', html: 'dist/guides/growth-leadership/literature/demian/index.html', cssClass: 'le-visual--ep03' }
];

function normalizeAsset(value) {
  if (!value) return null;
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) return new URL(value).pathname;
  } catch {}
  return value.split('?')[0];
}

function extractMetaImage(html, attribute, key) {
  const patterns = [
    new RegExp('<meta\\s+' + attribute + '=["\\\']' + key + '["\\\']\\s+content=["\\\']([^"\\\']+)["\\\'][^>]*>', 'i'),
    new RegExp('<meta\\s+content=["\\\']([^"\\\']+)["\\\']\\s+' + attribute + '=["\\\']' + key + '["\\\'][^>]*>', 'i')
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return match[1];
  }
  return null;
}

function extractOgImage(html) {
  return extractMetaImage(html, 'property', 'og:image');
}

function extractTwitterImage(html) {
  return extractMetaImage(html, 'name', 'twitter:image');
}

function extractCssHeroUrl(cssClass) {
  const marker = '.' + cssClass;
  const start = css.indexOf(marker);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open + 1);
  if (open < 0 || close < 0) return null;
  const block = css.slice(open + 1, close);
  const match = block.match(/url\((['"]?)([^)'"]+)\1\)/i);
  return match?.[2] ?? null;
}

function readFrontmatter(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { source, data: {} };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const scalar = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!scalar) continue;
    let value = scalar[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[scalar[1]] = value;
  }
  return { source, data };
}

function publicFileFor(assetPath) {
  const normalized = normalizeAsset(assetPath);
  if (!normalized?.startsWith('/')) return null;
  return path.join(root, 'public', normalized.slice(1));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
}

function walkTextFiles(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTextFiles(full, output);
      continue;
    }
    if (/\.(?:md|mdx|astro|js|mjs|ts|css|html|json|ya?ml|svg)$/i.test(entry.name)) output.push(full);
  }
  return output;
}

// Books baseline applies to every published title; strict V2 is opt-in during migration.\nconst failures = [];
const report = [];

for (const contract of literatureContracts) {
  const htmlPath = path.join(root, contract.html);
  if (!fs.existsSync(htmlPath)) {
    failures.push(contract.name + ': built HTML missing: ' + contract.html);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const og = normalizeAsset(extractOgImage(html));
  const hero = normalizeAsset(extractCssHeroUrl(contract.cssClass));
  report.push({ type: 'literature', name: contract.name, og, hero });
  if (!og) failures.push(contract.name + ': og:image not found');
  if (!hero) failures.push(contract.name + ': CSS Hero URL not found for .' + contract.cssClass);
  if (og && hero && og !== hero) failures.push(contract.name + ': OG/Hero mismatch: og=' + og + ', hero=' + hero);
}

const booksDir = path.join(root, 'src/data/books');
const bookFiles = fs.readdirSync(booksDir).filter((name) => name.endsWith('.md')).sort();

for (const fileName of bookFiles) {
  const slug = fileName.slice(0, -3);
  const { data } = readFrontmatter(path.join(booksDir, fileName));
  if (data.draft === 'true') continue;

  const name = 'BOOK:' + slug;
  const cover = normalizeAsset(data.coverImage);
  const og = normalizeAsset(data.ogImage);
  const contractVersion = Number(data.assetContractVersion || 0);
  const htmlPath = path.join(root, 'dist/books', slug, 'index.html');

  if (!cover) {
    failures.push(name + ': coverImage is required for published books');
    continue;
  }

  const coverFile = publicFileFor(cover);
  if (!coverFile || !fs.existsSync(coverFile)) failures.push(name + ': cover asset missing: ' + cover);

  if (!fs.existsSync(htmlPath)) {
    failures.push(name + ': built HTML missing: dist/books/' + slug + '/index.html');
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const renderedOg = normalizeAsset(extractOgImage(html));
  const renderedTwitter = normalizeAsset(extractTwitterImage(html));
  const heroPattern = new RegExp('<img[^>]+src=["\\\']' + escapeRegExp(cover) + '["\\\'][^>]*>', 'i');
  const absoluteCover = 'https://aijoylab.kr' + cover;

  if (!heroPattern.test(html)) failures.push(name + ': Hero <img> does not use coverImage ' + cover);
  if (!html.includes(absoluteCover)) failures.push(name + ': Book JSON-LD does not expose coverImage ' + absoluteCover);

  if (og) {
    const ogFile = publicFileFor(og);
    if (!ogFile || !fs.existsSync(ogFile)) failures.push(name + ': OG asset missing: ' + og);
    if (renderedOg !== og) failures.push(name + ': rendered og:image mismatch: expected=' + og + ', got=' + renderedOg);
    if (renderedTwitter !== og) failures.push(name + ': rendered twitter:image mismatch: expected=' + og + ', got=' + renderedTwitter);
  }

  const item = { type: 'book', name: slug, contractVersion, cover, hero: cover, schema: cover, og, renderedOg, renderedTwitter };

  if (contractVersion === 2) {
    if (!cover.endsWith('.webp')) failures.push(name + ': Asset Contract V2 cover must be .webp');
    if (!og) failures.push(name + ': Asset Contract V2 requires ogImage');
    if (og && !og.endsWith('.webp')) failures.push(name + ': Asset Contract V2 OG must be .webp');

    if (coverFile && fs.existsSync(coverFile)) {
      try {
        const meta = await sharp(coverFile, { failOn: 'error' }).metadata();
        await sharp(coverFile, { failOn: 'error' }).raw().toBuffer();
        item.coverMeta = { format: meta.format, width: meta.width, height: meta.height };
        if (meta.format !== 'webp') failures.push(name + ': cover decode format is not webp');
        if (!meta.width || !meta.height || meta.width * 3 !== meta.height * 2) {
          failures.push(name + ': cover ratio must be 2:3, got ' + meta.width + 'x' + meta.height);
        }
      } catch (error) {
        failures.push(name + ': cover full decode failed: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    const ogFile = og ? publicFileFor(og) : null;
    if (ogFile && fs.existsSync(ogFile)) {
      try {
        const meta = await sharp(ogFile, { failOn: 'error' }).metadata();
        await sharp(ogFile, { failOn: 'error' }).raw().toBuffer();
        item.ogMeta = { format: meta.format, width: meta.width, height: meta.height };
        if (meta.format !== 'webp') failures.push(name + ': OG decode format is not webp');
        if (!meta.width || !meta.height || meta.width * 9 !== meta.height * 16) {
          failures.push(name + ': OG ratio must be 16:9, got ' + meta.width + 'x' + meta.height);
        }
        if (data.ogImageWidth && Number(data.ogImageWidth) !== meta.width) {
          failures.push(name + ': ogImageWidth metadata mismatch: frontmatter=' + data.ogImageWidth + ', file=' + meta.width);
        }
        if (data.ogImageHeight && Number(data.ogImageHeight) !== meta.height) {
          failures.push(name + ': ogImageHeight metadata mismatch: frontmatter=' + data.ogImageHeight + ', file=' + meta.height);
        }
      } catch (error) {
        failures.push(name + ': OG full decode failed: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    const legacyNames = [slug + '-cover.svg', slug + '-og.svg'];
    const scanRoots = ['src', 'public', 'docs', 'scripts', '.github'].map((dir) => path.join(root, dir));
    const scanFiles = scanRoots.flatMap((dir) => walkTextFiles(dir));
    for (const legacy of legacyNames) {
      const refs = scanFiles.filter((file) => fs.readFileSync(file, 'utf8').includes(legacy));
      if (refs.length) {
        failures.push(name + ': legacy SVG reference remains for ' + legacy + ': ' + refs.map((file) => path.relative(root, file)).join(', '));
      }
    }
  }

  report.push(item);
}

console.log(JSON.stringify({ gate: 'Asset Contract V2', report }, null, 2));
if (failures.length) {
  console.error('Asset Contract V2 FAILED:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('Asset Contract V2 PASS');

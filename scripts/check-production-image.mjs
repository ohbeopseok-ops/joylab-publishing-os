import sharp from 'sharp';

const [file, expectedWidth, expectedHeight] = process.argv.slice(2);
if (!file || !expectedWidth || !expectedHeight) {
  console.error('Usage: node scripts/check-production-image.mjs <file> <width> <height>');
  process.exit(2);
}

try {
  const meta = await sharp(file, { failOn: 'error' }).metadata();
  const width = Number(expectedWidth);
  const height = Number(expectedHeight);

  console.log(JSON.stringify({
    file,
    format: meta.format,
    width: meta.width,
    height: meta.height,
    size: meta.size ?? null,
    space: meta.space ?? null,
    channels: meta.channels ?? null,
  }));

  if (meta.format !== 'webp') throw new Error(`Expected webp, got ${meta.format}`);
  if (meta.width !== width) throw new Error(`Expected width ${width}, got ${meta.width}`);
  if (meta.height !== height) throw new Error(`Expected height ${height}, got ${meta.height}`);

  // Force a full decode. metadata() alone can succeed on a damaged payload.
  const decoded = await sharp(file, { failOn: 'error' }).raw().toBuffer({ resolveWithObject: true });
  if (!decoded.data?.length) throw new Error('Decoded image is empty');
  console.log(`Decoded OK: ${decoded.info.width}x${decoded.info.height}, bytes=${decoded.data.length}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

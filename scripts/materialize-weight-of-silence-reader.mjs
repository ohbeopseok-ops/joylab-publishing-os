import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const jobs = [
  {
    source: 'public/books/weight-of-silence/interactive.bin',
    target: 'public/books/weight-of-silence/reader.html',
    label: 'Weight of Silence reader',
    minBytes: 10000
  },
  {
    source: 'public/books/weight-of-silence/mindmap.bin',
    target: 'public/books/weight-of-silence/mindmap-reader.html',
    label: 'Weight of Silence mindmap',
    minBytes: 5000
  }
];

function looksLikeHtml(html) {
  const normalized = html.trim().toLowerCase();
  return normalized.includes('<!doctype html') || normalized.includes('<html');
}

async function gunzipBestEffort(buffer, label) {
  const gunzip = zlib.createGunzip();
  const chunks = [];
  let error = null;

  gunzip.on('data', (chunk) => chunks.push(chunk));
  gunzip.on('error', (caught) => { error = caught; });

  await new Promise((resolve) => {
    gunzip.on('end', resolve);
    gunzip.on('close', resolve);
    gunzip.end(buffer);
  });

  const decoded = Buffer.concat(chunks);
  if (error) {
    console.warn(label + ': gzip payload is damaged; recovered ' + decoded.length + ' bytes before ' + error.message);
  }
  return { decoded, error };
}

async function decodeHtml(buffer, job) {
  const isGzip = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  let decoded = buffer;
  let gzipError = null;

  if (isGzip) {
    const result = await gunzipBestEffort(buffer, job.label);
    decoded = result.decoded;
    gzipError = result.error;
  }

  let html = decoded.toString('utf8');

  if (!looksLikeHtml(html)) {
    throw new Error(job.label + ': recovered payload is not HTML');
  }
  if (decoded.length < job.minBytes) {
    throw new Error(job.label + ': recovered HTML too small: ' + decoded.length + ' bytes');
  }

  const lower = html.toLowerCase();
  if (gzipError && !lower.includes('</html>')) {
    html += '\n</body>\n</html>\n';
    console.warn(job.label + ': appended defensive closing tags after partial recovery');
  }

  return { html, gzipError };
}

for (const job of jobs) {
  const sourcePath = path.join(root, job.source);
  const targetPath = path.join(root, job.target);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(job.label + ': source not found: ' + job.source);
  }

  const { html, gzipError } = await decodeHtml(fs.readFileSync(sourcePath), job);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, html, 'utf8');

  console.log(
    'Materialized ' + job.label + ': ' + job.target +
    ' (' + Buffer.byteLength(html, 'utf8') + ' bytes, recovery=' + (gzipError ? 'partial' : 'clean') + ')'
  );
}

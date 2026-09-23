import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const jobs = [
  {
    source: 'public/books/weight-of-silence/interactive.bin',
    target: 'public/books/weight-of-silence/reader.html',
    label: 'Weight of Silence reader'
  },
  {
    source: 'public/books/weight-of-silence/mindmap.bin',
    target: 'public/books/weight-of-silence/mindmap-reader.html',
    label: 'Weight of Silence mindmap'
  }
];

function decodeHtml(buffer, label) {
  const isGzip = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  const decoded = isGzip ? zlib.gunzipSync(buffer) : buffer;
  const html = decoded.toString('utf8');
  const normalized = html.trim().toLowerCase();

  if (!normalized.includes('<!doctype html') && !normalized.includes('<html')) {
    throw new Error(label + ': decoded payload is not HTML');
  }
  if (decoded.length < 1024) {
    throw new Error(label + ': decoded payload is unexpectedly small');
  }
  return html;
}

for (const job of jobs) {
  const sourcePath = path.join(root, job.source);
  const targetPath = path.join(root, job.target);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(job.label + ': source not found: ' + job.source);
  }

  const html = decodeHtml(fs.readFileSync(sourcePath), job.label);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, html, 'utf8');

  console.log(
    'Materialized ' + job.label + ': ' + job.target +
    ' (' + Buffer.byteLength(html, 'utf8') + ' bytes)'
  );
}

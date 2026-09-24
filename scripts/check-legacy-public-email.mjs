import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');
const LEGACY_EMAILS = ['ohbeopseok@gmail.com'];
const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.xml', '.txt', '.json', '.js', '.mjs', '.css', '.svg', '.webmanifest'
]);

if (!fs.existsSync(ROOT)) {
  console.error('Legacy Public Email Gate: dist/ does not exist. Run the production build first.');
  process.exit(1);
}

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

    const content = fs.readFileSync(full, 'utf8');
    for (const email of LEGACY_EMAILS) {
      if (content.includes(email)) {
        findings.push({
          file: path.relative(process.cwd(), full).replaceAll('\\', '/'),
          email
        });
      }
    }
  }
}

walk(ROOT);

if (findings.length > 0) {
  console.error('Legacy Public Email Gate: BLOCKED');
  for (const finding of findings) {
    console.error(`- ${finding.email} found in ${finding.file}`);
  }
  process.exit(1);
}

console.log('Legacy Public Email Gate: PASS');

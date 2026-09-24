import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const legacyHandle = ['@super', 'halabe100'].join('');
const canonicalYouTube = 'https://www.youtube.com/@JoyLabResearch';
const canonicalSource = 'src/config/siteIdentity.ts';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const textExtensions = new Set([
  '.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.mdx', '.html', '.css', '.scss', '.yml', '.yaml',
  '.txt', '.xml', '.toml'
]);

const extOf = (path) => {
  const index = path.lastIndexOf('.');
  return index >= 0 ? path.slice(index).toLowerCase() : '';
};

const legacyHits = [];
for (const path of tracked) {
  if (!textExtensions.has(extOf(path)) && !['README', 'LICENSE'].includes(path)) continue;
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    continue;
  }
  if (content.includes(legacyHandle)) legacyHits.push(path);
}

if (legacyHits.length) {
  console.error('Official Channel Contract FAILED: legacy YouTube handle found in tracked text files:');
  legacyHits.forEach((path) => console.error(`- ${path}`));
  process.exit(1);
}

const identity = readFileSync(canonicalSource, 'utf8');
if (!identity.includes(canonicalYouTube)) {
  console.error(`Official Channel Contract FAILED: canonical YouTube URL missing from ${canonicalSource}`);
  process.exit(1);
}

const consumers = [
  'src/components/SiteFooter.astro',
  'src/components/ContactSocialChannels.astro',
  'src/components/AboutOfficialChannels.astro',
  'src/components/IdentitySchema.astro'
];

for (const path of consumers) {
  const content = readFileSync(path, 'utf8');
  if (!content.includes("config/siteIdentity")) {
    console.error(`Official Channel Contract FAILED: ${path} does not consume siteIdentity`);
    process.exit(1);
  }
  if (content.includes(canonicalYouTube)) {
    console.error(`Official Channel Contract FAILED: direct YouTube URL duplicated in ${path}`);
    process.exit(1);
  }
}

console.log('Official Channel Contract PASS');
console.log(`Canonical YouTube: ${canonicalYouTube}`);
console.log(`Tracked text files checked: ${tracked.length}`);

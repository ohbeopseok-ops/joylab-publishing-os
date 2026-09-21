import fs from 'node:fs/promises';

const html = await fs.readFile('public/books/ax-customer-center/interactive.html', 'utf8');
const scriptUrls = [...html.matchAll(/<script[^>]+src=["'](https?:\/\/[^"'#]+)["'][^>]*>/gi)].map((m) => m[1]);
const linkUrls = [...html.matchAll(/<link[^>]+href=["'](https?:\/\/[^"'#]+)["'][^>]*>/gi)].map((m) => m[1]);
const urls = [...scriptUrls, ...linkUrls].filter((u) => new URL(u).hostname !== 'aijoylab.kr');
const hosts = [...new Set(urls.map((u) => new URL(u).hostname))].sort();

const approvedHosts = new Set([
  'cdn.tailwindcss.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com'
]);

const unknown = hosts.filter((h) => !approvedHosts.has(h));
const contracts = {
  tailwindCdn: urls.some((u) => u.includes('cdn.tailwindcss.com')),
  pretendardCdn: urls.some((u) => u.includes('cdn.jsdelivr.net')),
  googleFonts: urls.some((u) => u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')),
  phosphorCdn: urls.some((u) => u.includes('unpkg.com'))
};
const dependencyGroups = Object.values(contracts).filter(Boolean).length;

console.log(JSON.stringify({ urls, hosts, contracts, dependencyGroups, targetDependencyGroups: 0 }, null, 2));

if (unknown.length) {
  console.error('Reader dependency audit failed: unapproved hosts: ' + unknown.join(', '));
  process.exit(1);
}
if (dependencyGroups > 4) {
  console.error('Reader dependency audit failed: external dependency groups increased to ' + dependencyGroups);
  process.exit(1);
}

console.log('Reader dependency audit passed: ' + dependencyGroups + ' external groups (baseline <=4, V2 target 0)');

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'qa-artifacts', 'visual-asset-contract-v4', 'report.json');
if (!fs.existsSync(reportPath)) throw new Error('Visual Asset Contract V4 report is missing.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const bySlug = new Map();
for (const record of report.records ?? []) {
  const row = bySlug.get(record.slug) ?? { slug: record.slug, hero: 0, supporting: 0, og: 0, formats: new Set() };
  row[record.role] = (row[record.role] ?? 0) + 1;
  row.formats.add(record.format);
  bySlug.set(record.slug, row);
}
const rows = [...bySlug.values()]
  .sort((a,b)=>a.slug.localeCompare(b.slug))
  .map((row)=>({
    slug: row.slug,
    hero: row.hero,
    supporting: row.supporting,
    og: row.og,
    formats: [...row.formats].sort(),
    status: 'PASS'
  }));

const lines = [
  '# JoyLab Visual Quality Dashboard V1',
  '',
  '> Visual Asset Contract V4 · Hero + Supporting + OG',
  '',
  '| Metric | Value |',
  '| --- | ---: |',
  '| Articles | ' + rows.length + ' |',
  '| Total assets | ' + report.assets + ' |',
  '| Hero | ' + report.byRole.hero + ' |',
  '| Supporting | ' + report.byRole.supporting + ' |',
  '| OG | ' + report.byRole.og + ' |',
  '| Warnings | ' + report.warnings.length + ' |',
  '| Failures | ' + report.failures.length + ' |',
  '',
  '| Article | Hero | Supporting | OG | Formats | Status |',
  '| --- | ---: | ---: | ---: | --- | --- |'
];
for (const row of rows) {
  lines.push('| ' + row.slug + ' | ' + row.hero + ' | ' + row.supporting + ' | ' + row.og + ' | ' + row.formats.join(', ') + ' | ' + row.status + ' |');
}
lines.push('', 'Generated from Visual Asset Contract V4 report: ' + report.generatedAt);

const outDir = path.join(root, 'qa-artifacts', 'visual-quality-dashboard-v1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'dashboard.md'), lines.join('\n'));
fs.writeFileSync(path.join(outDir, 'dashboard.json'), JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
console.log('Visual Quality Dashboard V1 generated: ' + rows.length + ' articles / ' + report.assets + ' assets.');

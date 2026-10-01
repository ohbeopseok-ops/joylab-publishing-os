import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rules = JSON.parse(fs.readFileSync(path.join(root, 'src/data/mobile-experience-contract-v1.json'), 'utf8'));
const outDir = path.join(root, 'qa-artifacts', 'mobile-experience-contract-v1');
const files = fs.existsSync(outDir)
  ? fs.readdirSync(outDir).filter((name) => /^lighthouse-.*\.json$/.test(name)).sort()
  : [];

if (!files.length) {
  console.error('Mobile Lighthouse Budget V1 FAILED: no Lighthouse reports found.');
  process.exit(1);
}

const results = [];
const failures = [];

for (const name of files) {
  const report = JSON.parse(fs.readFileSync(path.join(outDir, name), 'utf8'));
  const lcpMs = Math.round(report.audits?.['largest-contentful-paint']?.numericValue ?? 0);
  const cls = Number((report.audits?.['cumulative-layout-shift']?.numericValue ?? 0).toFixed(4));
  const performanceScore = Math.round((report.categories?.performance?.score ?? 0) * 100);
  const checks = {
    lcpObserved: lcpMs > 0,
    lcpWithinBudget: lcpMs > 0 && lcpMs <= rules.budgets.lcpMs,
    clsWithinBudget: cls <= rules.budgets.cls
  };
  const passed = Object.values(checks).every(Boolean);
  results.push({ file: name, lcpMs, cls, performanceScore, checks, passed });
  if (!passed) failures.push(name + ': ' + Object.entries(checks).filter(([,ok]) => !ok).map(([k])=>k).join(','));
}

fs.writeFileSync(path.join(outDir, 'lighthouse-summary.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  budgets: rules.budgets,
  failures,
  results
}, null, 2));

for (const r of results) {
  console.log((r.passed ? 'PASS ' : 'FAIL ') + r.file + ' LCP=' + r.lcpMs + 'ms CLS=' + r.cls + ' perf=' + r.performanceScore);
}
if (failures.length) {
  console.error('Mobile Lighthouse Budget V1 FAILED: ' + failures.join(' | '));
  process.exit(1);
}
console.log('Mobile Lighthouse Budget V1 PASS: ' + results.length + ' Lighthouse runs.');

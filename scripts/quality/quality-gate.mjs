import fs from 'node:fs';
import path from 'node:path';
import { articleFiles, artifactDir, band, ensureArtifacts, hardGate, loadConfig, parseArticle } from './lib.mjs';
import { scoreSeo } from './check-seo.mjs';
import { scoreGeo } from './check-geo.mjs';
import { scoreEeat } from './check-eeat.mjs';
import { scoreDiscover } from './check-discover.mjs';

const config = loadConfig();

function evaluate(article) {
  const seo = scoreSeo(article);
  const geo = scoreGeo(article);
  const eeat = scoreEeat(article);
  const discover = scoreDiscover(article);
  const total = seo.score + geo.score + eeat.score + discover.score;
  const hardErrors = hardGate(article);
  return {
    slug: article.slug,
    scores: { seo: seo.score, geo: geo.score, eeat: eeat.score, discover: discover.score, total },
    band: hardErrors.length ? 'BLOCKED' : band(total, config),
    hardErrors,
    notes: { seo: seo.notes, geo: geo.notes, eeat: eeat.notes, discover: discover.notes }
  };
}

if (process.argv.includes('--self-test')) {
  const cases = Object.entries(config.legacyGoldCases);
  for (const [slug] of cases) {
    const file = path.join(process.cwd(), 'src/data/articles', `${slug}.md`);
    if (!fs.existsSync(file)) throw new Error(`Missing GOLD case: ${slug}`);
    const result = evaluate(parseArticle(file));
    if (result.hardErrors.length) throw new Error(`GOLD case hard-gate failure: ${slug} => ${result.hardErrors.join(', ')}`);
    console.log(`${slug}: ${result.scores.total}/100 ${result.band}`);
  }
  console.log('Quality Gate self-test passed.');
  process.exit(0);
}

const changedOnly = process.argv.includes('--changed');
const files = articleFiles({ changedOnly });
if (!files.length) {
  console.log('Quality Gate: no changed articles.');
  process.exit(0);
}

const results = files.map((file) => evaluate(parseArticle(file)));
ensureArtifacts();
const report = {
  version: config.version,
  generatedAt: new Date().toISOString(),
  changedOnly,
  results
};
fs.writeFileSync(path.join(artifactDir, 'quality-report.json'), JSON.stringify(report, null, 2) + '\n');

const md = [
  '# JoyLab Content Quality Gate',
  '',
  ...results.flatMap((r) => [
    `## ${r.slug}`,
    '',
    `- SEO: **${r.scores.seo}/25**`,
    `- GEO: **${r.scores.geo}/25**`,
    `- E-E-A-T: **${r.scores.eeat}/25**`,
    `- Discover: **${r.scores.discover}/25**`,
    `- Total: **${r.scores.total}/100**`,
    `- Result: **${r.band}**`,
    ...(r.hardErrors.length ? [`- Hard errors: ${r.hardErrors.join(', ')}`] : []),
    ''
  ])
].join('\n');
fs.writeFileSync(path.join(artifactDir, 'quality-report.md'), md + '\n');
console.log(md);

const failed = results.some((r) => r.hardErrors.length || r.scores.total < config.thresholds.pass);
if (failed) process.exit(1);

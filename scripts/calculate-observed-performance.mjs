import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'config/observed-performance-score.json'), 'utf8'));

const defaults = {
  quality: path.join(root, 'qa-artifacts/content-quality/quality-report.json'),
  gsc: path.join(root, 'qa-artifacts/gsc-28d/gsc-28d.json'),
  ctr: path.join(root, 'qa-artifacts/ctr-benchmark/ctr-benchmark.json'),
  out: path.join(root, 'qa-artifacts/observed-performance')
};

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function parseCategory(slug) {
  const file = path.join(root, 'src/data/articles', `${slug}.md`);
  if (!fs.existsSync(file)) return 'UNKNOWN';
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
  return fm.match(/^category:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim() || 'UNKNOWN';
}

function percentile(value, values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const less = sorted.filter((v) => v < value).length;
  const equal = sorted.filter((v) => v === value).length;
  return (less + equal * 0.5) / sorted.length;
}

function scoreDiscovery(article, cohort) {
  const dim = config.dimensions.discovery;
  if (cohort.length < dim.minimumCohortSize) {
    return { score: null, max: dim.max, availableMax: 0, status: 'N/A', reason: 'INSUFFICIENT_COHORT', percentile: null };
  }
  const p = percentile(article.d28.impressions, cohort.map((x) => x.d28.impressions));
  return { score: Math.round(dim.max * p), max: dim.max, availableMax: dim.max, status: 'AVAILABLE', percentile: p };
}

function findCtrBucket(position, benchmark) {
  return (benchmark.buckets || []).find((b) =>
    position >= Number(b.positionMin) && position <= Number(b.positionMax)
  ) || null;
}

function scoreCtr(article, benchmark) {
  const dim = config.dimensions.ctrQuality;
  if (article.d28.impressions < dim.minimumImpressions) {
    return { score: null, max: dim.max, availableMax: 0, status: 'N/A', reason: 'LOW_IMPRESSIONS' };
  }
  const bucket = findCtrBucket(article.d28.averagePosition, benchmark);
  if (!bucket || bucket.expectedCtr == null || Number(bucket.expectedCtr) <= 0) {
    return { score: null, max: dim.max, availableMax: 0, status: 'N/A', reason: 'CTR_BENCHMARK_UNAVAILABLE' };
  }
  const efficiency = article.d28.ctr / Number(bucket.expectedCtr);
  const threshold = dim.thresholds.find((t) => efficiency >= t.minEfficiency) ?? dim.thresholds.at(-1);
  return {
    score: threshold.score,
    max: dim.max,
    availableMax: dim.max,
    status: 'AVAILABLE',
    efficiency,
    expectedCtr: Number(bucket.expectedCtr),
    benchmarkBucket: bucket.id,
    benchmarkStatus: bucket.status
  };
}

function scoreRank(article) {
  const dim = config.dimensions.rankMomentum;
  let score = 0;
  let availableMax = 0;
  const details = {};

  const d7pos = Number(article.d7?.averagePosition) || 0;
  const d28pos = Number(article.d28?.averagePosition) || 0;
  if (d7pos > 0 && d28pos > 0) {
    const improvement = d7pos - d28pos;
    const improvementScore = clamp(
      Math.round((improvement / dim.fullCreditImprovement) * dim.averagePositionImprovementMax),
      0,
      dim.averagePositionImprovementMax
    );
    score += improvementScore;
    availableMax += dim.averagePositionImprovementMax;
    details.positionImprovement = improvement;
    details.positionImprovementScore = improvementScore;
  }

  if (Number.isFinite(Number(article.d28?.top20Queries))) {
    availableMax += dim.top20Presence;
    if ((article.d28?.top20Queries ?? 0) >= 1) score += dim.top20Presence;
  }
  if (Number.isFinite(Number(article.d28?.top10Queries))) {
    availableMax += dim.top10Presence;
    if ((article.d28?.top10Queries ?? 0) >= 1) score += dim.top10Presence;
  }

  if (!availableMax) return { score: null, max: dim.max, availableMax: 0, status: 'N/A', reason: 'RANK_DATA_UNAVAILABLE' };
  return { score, max: dim.max, availableMax, status: 'AVAILABLE', ...details };
}

function growthRatio(d7, d28) {
  const a = Number(d7) || 0;
  const b = Number(d28) || 0;
  if (a === 0 && b === 0) return 0;
  return b / Math.max(a, 1);
}

function scoreQueryExpansion(article) {
  const dim = config.dimensions.queryExpansion;
  if (!article.d7 || !article.d28) {
    return { score: null, max: dim.max, availableMax: 0, status: 'N/A', reason: 'QUERY_DATA_UNAVAILABLE' };
  }
  const u = growthRatio(article.d7.uniqueQueries, article.d28.uniqueQueries);
  const t20 = growthRatio(article.d7.top20Queries, article.d28.top20Queries);
  const t10 = growthRatio(article.d7.top10Queries, article.d28.top10Queries);

  const uniqueScore = clamp(Math.round((u / dim.fullCreditGrowthRatio) * dim.uniqueQueryGrowthMax), 0, dim.uniqueQueryGrowthMax);
  const top20Score = clamp(Math.round((t20 / dim.fullCreditGrowthRatio) * dim.top20QueryGrowthMax), 0, dim.top20QueryGrowthMax);
  const top10Score = clamp(Math.round((t10 / dim.fullCreditGrowthRatio) * dim.top10QueryGrowthMax), 0, dim.top10QueryGrowthMax);

  return {
    score: uniqueScore + top20Score + top10Score,
    max: dim.max,
    availableMax: dim.max,
    status: 'AVAILABLE',
    growth: { uniqueQueries: u, top20Queries: t20, top10Queries: t10 },
    components: { uniqueScore, top20Score, top10Score }
  };
}

function confidence(article, cohortSize, availableMaximum) {
  const c = config.confidence;
  if (
    article.d28.impressions >= c.high.minimumD28Impressions &&
    cohortSize >= c.high.minimumCohortSize &&
    availableMaximum === 100
  ) return 'HIGH';
  if (
    article.d28.impressions >= c.medium.minimumD28Impressions &&
    cohortSize >= c.medium.minimumCohortSize
  ) return 'MEDIUM';
  return 'LOW';
}

function calculate({ quality, gsc, ctr }) {
  const qualityMap = new Map((quality.results || []).map((r) => [r.slug, r]));
  const eligible = (gsc.articles || [])
    .filter((a) => a.d28?.window?.complete)
    .map((a) => ({ ...a, category: parseCategory(a.slug) }));

  const cohorts = new Map();
  for (const a of eligible) {
    if (!cohorts.has(a.category)) cohorts.set(a.category, []);
    cohorts.get(a.category).push(a);
  }

  const results = [];
  for (const article of eligible) {
    const q = qualityMap.get(article.slug);
    if (!q) {
      results.push({
        slug: article.slug,
        category: article.category,
        status: 'SKIPPED',
        reason: 'QUALITY_SCORE_UNAVAILABLE'
      });
      continue;
    }

    const cohort = cohorts.get(article.category) || [];
    const dimensions = {
      discovery: scoreDiscovery(article, cohort),
      ctrQuality: scoreCtr(article, ctr),
      rankMomentum: scoreRank(article),
      queryExpansion: scoreQueryExpansion(article)
    };

    const rawScore = Object.values(dimensions).reduce((sum, d) => sum + (d.score ?? 0), 0);
    const availableMaximum = Object.values(dimensions).reduce((sum, d) => sum + (d.availableMax ?? 0), 0);
    const observedPerformance = availableMaximum ? Math.round((rawScore / availableMaximum) * 100) : null;
    const qualityTotal = Number(q.scores?.total);
    const predictionError = observedPerformance != null && Number.isFinite(qualityTotal)
      ? observedPerformance - qualityTotal
      : null;

    results.push({
      slug: article.slug,
      category: article.category,
      status: observedPerformance == null ? 'INSUFFICIENT_DATA' : 'AVAILABLE',
      quality: q.scores,
      d7: article.d7,
      d28: article.d28,
      cohort: {
        category: article.category,
        size: cohort.length
      },
      dimensions,
      rawScore,
      availableMaximum,
      observedPerformance,
      confidence: confidence(article, cohort.length, availableMaximum),
      predictionError,
      benchmark: {
        version: ctr.version,
        window: ctr.window
      }
    });
  }
  return results;
}

if (process.argv.includes('--self-test')) {
  const quality = {
    results: [{
      slug: 'ops-self-test',
      scores: { seo: 20, geo: 20, eeat: 20, discover: 20, total: 80 }
    }]
  };
  const articles = [];
  for (let i = 0; i < 10; i++) {
    articles.push({
      slug: i === 0 ? 'ops-self-test' : `peer-${i}`,
      d7: { averagePosition: 20, uniqueQueries: 2, top20Queries: 1, top10Queries: 0 },
      d28: {
        window: { complete: true },
        impressions: 100 + i * 10,
        ctr: 0.06,
        averagePosition: 10,
        uniqueQueries: 6,
        top20Queries: 3,
        top10Queries: 1
      }
    });
  }
  const originalParse = parseCategory;
  const gsc = { articles };
  const ctr = {
    version: '1.0',
    window: { start: '2026-01-01', end: '2026-03-31' },
    buckets: [{ id: 'p6_10', positionMin: 6, positionMax: 10.99, expectedCtr: 0.05, status: 'AVAILABLE' }]
  };
  const result = calculate({ quality, gsc, ctr }).find((x) => x.slug === 'ops-self-test');
  if (!result || result.observedPerformance == null || result.predictionError == null) {
    throw new Error('OPS calculator self-test failed');
  }
  console.log(`OPS self-test: ${result.observedPerformance}/100, error ${result.predictionError >= 0 ? '+' : ''}${result.predictionError}`);
  process.exit(0);
}

const qualityPath = arg('--quality', defaults.quality);
const gscPath = arg('--gsc', defaults.gsc);
const ctrPath = arg('--ctr', defaults.ctr);
const outDir = arg('--out', defaults.out);

for (const [label, file] of [['quality', qualityPath], ['gsc', gscPath], ['ctr', ctrPath]]) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${label} input: ${file}`);
}

const quality = JSON.parse(fs.readFileSync(qualityPath, 'utf8'));
const gsc = JSON.parse(fs.readFileSync(gscPath, 'utf8'));
const ctr = JSON.parse(fs.readFileSync(ctrPath, 'utf8'));
const results = calculate({ quality, gsc, ctr });

const report = {
  version: config.version,
  generatedAt: new Date().toISOString(),
  inputs: {
    quality: path.relative(root, qualityPath),
    gsc: path.relative(root, gscPath),
    ctr: path.relative(root, ctrPath)
  },
  results
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'observed-performance.json'), JSON.stringify(report, null, 2) + '\n');

const lines = [
  '# JoyLab Observed Performance Score V1',
  '',
  '| Slug | Quality | OPS | Error | Confidence | Available Max | Status |',
  '| --- | ---: | ---: | ---: | :---: | ---: | --- |'
];
for (const r of results) {
  const q = r.quality?.total ?? '-';
  const ops = r.observedPerformance ?? '-';
  const err = r.predictionError == null ? '-' : (r.predictionError >= 0 ? '+' : '') + r.predictionError;
  lines.push(`| ${r.slug} | ${q} | ${ops} | ${err} | ${r.confidence ?? '-'} | ${r.availableMaximum ?? 0} | ${r.status} |`);
}
const md = lines.join('\n') + '\n';
fs.writeFileSync(path.join(outDir, 'observed-performance.md'), md);
console.log(md);

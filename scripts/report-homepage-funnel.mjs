import fs from 'node:fs';
import path from 'node:path';

const sections = ['editorial', 'major', 'latest', 'guide'];

function parseNumberArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export function buildMetrics(impressionRows, clickRows) {
  const impressions = new Map(sections.map((section) => [section, 0]));
  const clicks = new Map(sections.map((section) => [section, 0]));

  for (const row of impressionRows) {
    if (impressions.has(row.section)) impressions.set(row.section, Number(row.impressions) || 0);
  }
  for (const row of clickRows) {
    if (clicks.has(row.section)) clicks.set(row.section, Number(row.clicks) || 0);
  }

  const totalImpressions = sections.reduce((sum, section) => sum + impressions.get(section), 0);
  const totalClicks = sections.reduce((sum, section) => sum + clicks.get(section), 0);
  const weightedCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  return sections.map((section) => {
    const sectionImpressions = impressions.get(section);
    const sectionClicks = clicks.get(section);
    const ctr = sectionImpressions > 0 ? sectionClicks / sectionImpressions : 0;
    const relativeIndex = weightedCtr > 0 ? (ctr / weightedCtr) * 100 : 0;
    return {
      section,
      impressions: Math.round(sectionImpressions),
      clicks: Math.round(sectionClicks),
      ctr: round(ctr * 100),
      relativeIndex: round(relativeIndex, 1)
    };
  });
}

export function judgePass03(metrics, minImpressions = 100) {
  const bySection = new Map(metrics.map((row) => [row.section, row]));
  const major = bySection.get('major');
  const latest = bySection.get('latest');
  const editorial = bySection.get('editorial');
  const guide = bySection.get('guide');

  if (!major || !latest || major.impressions < minImpressions || latest.impressions < minImpressions) {
    return {
      verdict: 'WAIT_MORE_DATA',
      reason: `major/latest impressions가 각각 ${minImpressions}회에 도달할 때까지 기존 GOLD 배치를 유지합니다.`
    };
  }

  if (latest.ctr > 0 && major.ctr < latest.ctr * 0.6) {
    return {
      verdict: 'REDUCE_MAJOR',
      reason: `주요 리서치 CTR(${major.ctr}%)이 최신 업데이트 CTR(${latest.ctr}%)의 60% 미만입니다. 주요 리서치 개수 축소 또는 선발 규칙 재조정을 검토합니다.`
    };
  }

  if (major.ctr > 0 && latest.ctr < major.ctr * 0.6) {
    return {
      verdict: 'COMPRESS_LATEST',
      reason: `최신 업데이트 CTR(${latest.ctr}%)이 주요 리서치 CTR(${major.ctr}%)의 60% 미만입니다. 최신 업데이트 영역을 압축하고 대표 리서치 탐색을 강화합니다.`
    };
  }

  const anchorStrong = (editorial?.relativeIndex ?? 0) >= 120 || (guide?.relativeIndex ?? 0) >= 120;
  const bothWeak = major.relativeIndex < 70 && latest.relativeIndex < 70;
  if (anchorStrong && bothWeak) {
    return {
      verdict: 'REVIEW_OVERLAP',
      reason: '에디터 추천 또는 Research Guide는 강하지만 주요 리서치와 최신 업데이트가 모두 평균 대비 약합니다. 두 영역의 중복 진입점을 재설계합니다.'
    };
  }

  return {
    verdict: 'KEEP_SEPARATE',
    reason: '주요 리서치와 최신 업데이트가 서로 다른 탐색 의도를 유지하고 있습니다. 슬롯을 분리한 상태로 유지합니다.'
  };
}

function buildMarkdown({ generatedAt, days, minImpressions, metrics, verdict, topTargets }) {
  const lines = [
    '# JoyLab Homepage Funnel Report',
    '',
    `- Generated: ${generatedAt}`,
    `- Window: rolling ${days} days`,
    `- Minimum sample: ${minImpressions} impressions per major/latest section`,
    '',
    '## Section Funnel',
    '',
    '| Section | Impressions | Clicks | CTR | Relative CTR Index |',
    '| --- | ---: | ---: | ---: | ---: |'
  ];

  for (const row of metrics) {
    lines.push(`| ${row.section} | ${row.impressions} | ${row.clicks} | ${row.ctr.toFixed(2)}% | ${row.relativeIndex.toFixed(1)} |`);
  }

  lines.push('', '## Pass 03 Decision', '', `**${verdict.verdict}**`, '', verdict.reason, '');

  if (topTargets.length) {
    lines.push('## Top Click Targets', '', '| Section | Target | Clicks |', '| --- | --- | ---: |');
    for (const row of topTargets.slice(0, 12)) {
      lines.push(`| ${row.section} | ${row.target} | ${Math.round(Number(row.clicks) || 0)} |`);
    }
    lines.push('');
  }

  lines.push(
    '## Interpretation Rule',
    '',
    '- Relative CTR Index 100 = homepage measured sections의 가중 평균 CTR.',
    '- 120 이상 = 평균보다 20% 이상 강함.',
    '- 70 미만 = 평균보다 30% 이상 약함.',
    '- 자동 판정은 UI를 자동 수정하지 않으며 Pass 03의 편집 판단 근거로만 사용합니다.',
    ''
  );

  return `${lines.join('\n')}\n`;
}

function selfTest() {
  const metrics = buildMetrics(
    [
      { section: 'editorial', impressions: 300 },
      { section: 'major', impressions: 200 },
      { section: 'latest', impressions: 200 },
      { section: 'guide', impressions: 150 }
    ],
    [
      { section: 'editorial', clicks: 45 },
      { section: 'major', clicks: 8 },
      { section: 'latest', clicks: 20 },
      { section: 'guide', clicks: 18 }
    ]
  );
  const verdict = judgePass03(metrics, 100);
  if (verdict.verdict !== 'REDUCE_MAJOR') {
    throw new Error(`Homepage funnel self-test expected REDUCE_MAJOR, got ${verdict.verdict}`);
  }
  console.log('Homepage Funnel report self-test passed.');
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const days = Math.max(1, Math.min(90, Math.round(parseNumberArg('days', 7))));
const minImpressions = Math.max(1, Math.round(parseNumberArg('min-impressions', 100)));
const outDirArg = process.argv.find((arg) => arg.startsWith('--out-dir='))?.slice('--out-dir='.length) || 'qa-artifacts/homepage-funnel';
const outDir = path.resolve(process.cwd(), outDirArg);
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
const dataset = 'joylab_events_v1';

if (!accountId || !token) {
  throw new Error('Homepage Funnel report requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_READ_TOKEN.');
}

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
const query = async (sql) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: `${sql}\nFORMAT JSON`
  });
  if (!response.ok) throw new Error(`Cloudflare SQL ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.data ?? payload.result ?? []);
};

const impressionRows = await query(`
  SELECT blob2 AS section, SUM(_sample_interval) AS impressions
  FROM ${dataset}
  WHERE index1 = 'home_section_impression' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob2
`);

const clickRows = await query(`
  SELECT blob3 AS section, SUM(_sample_interval) AS clicks
  FROM ${dataset}
  WHERE index1 = 'home_section_click' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob3
`);

const topTargets = await query(`
  SELECT blob3 AS section, blob2 AS target, SUM(_sample_interval) AS clicks
  FROM ${dataset}
  WHERE index1 = 'home_section_click' AND timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY blob3, blob2
  ORDER BY clicks DESC
  LIMIT 50
`);

const metrics = buildMetrics(impressionRows, clickRows);
const verdict = judgePass03(metrics, minImpressions);
const generatedAt = new Date().toISOString();
const report = {
  generatedAt,
  windowDays: days,
  minImpressions,
  metrics,
  verdict,
  topTargets: topTargets.map((row) => ({
    section: row.section,
    target: row.target,
    clicks: Math.round(Number(row.clicks) || 0)
  }))
};

fs.mkdirSync(outDir, { recursive: true });
const baseName = `homepage-funnel-${days}d`;
const jsonPath = path.join(outDir, `${baseName}.json`);
const markdownPath = path.join(outDir, `${baseName}.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(markdownPath, buildMarkdown({ generatedAt, days, minImpressions, metrics, verdict, topTargets }));

console.log(`Homepage Funnel report: ${verdict.verdict}`);
console.log(`Markdown: ${markdownPath}`);
console.log(`JSON: ${jsonPath}`);

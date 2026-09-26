import fs from 'node:fs';
import path from 'node:path';

const sections = ['editorial', 'major', 'latest', 'books', 'guide'];
const decisionSections = ['editorial', 'major', 'latest', 'books'];

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

  const totalImpressions = decisionSections.reduce((sum, section) => sum + impressions.get(section), 0);
  const totalClicks = decisionSections.reduce((sum, section) => sum + clicks.get(section), 0);
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
  const selected = decisionSections.map((section) => bySection.get(section)).filter(Boolean);
  const missing = decisionSections.filter((section) => !bySection.get(section) || bySection.get(section).impressions < minImpressions);

  if (missing.length) {
    return {
      verdict: 'KEEP',
      readiness: 'COLLECT_MORE_DATA',
      confidence: 'LOW',
      targets: [],
      reason: `${missing.join(', ')} 슬롯이 ${minImpressions} impressions에 도달하지 않아 현재 구성을 유지하며 데이터를 더 수집합니다.`
    };
  }

  const weak = selected.filter((row) => row.relativeIndex < 70).sort((a, b) => a.relativeIndex - b.relativeIndex);
  const strong = selected.filter((row) => row.relativeIndex >= 120).sort((a, b) => b.relativeIndex - a.relativeIndex);
  const maxCtr = Math.max(...selected.map((row) => row.ctr));
  const minCtr = Math.min(...selected.map((row) => row.ctr));
  const ratio = minCtr > 0 ? maxCtr / minCtr : (maxCtr > 0 ? Infinity : 1);

  if (weak.length >= 2 || ratio >= 2.5) {
    return {
      verdict: 'CHANGE',
      readiness: 'READY',
      confidence: 'HIGH',
      targets: weak.map((row) => row.section),
      reason: `4개 핵심 슬롯 중 ${weak.length}개가 평균 대비 약하거나 슬롯 간 CTR 격차가 과도합니다. 슬롯 역할·순서·콘텐츠 선발 규칙 재설계를 검토합니다.`
    };
  }

  if (weak.length === 1 && strong.length >= 1) {
    return {
      verdict: 'REDUCE',
      readiness: 'READY',
      confidence: 'MEDIUM',
      targets: [weak[0].section],
      reason: `${weak[0].section} 슬롯 Relative CTR Index가 ${weak[0].relativeIndex}로 낮습니다. 해당 슬롯의 노출량·카드 수 또는 중복을 축소하고 강한 슬롯으로 탐색을 이동합니다.`
    };
  }

  return {
    verdict: 'KEEP',
    readiness: 'READY',
    confidence: 'HIGH',
    targets: [],
    reason: '에디터 추천·주요 리서치·최신 업데이트·Books가 각각 독립적인 탐색 가치를 유지하고 있습니다.'
  };
}

function buildMarkdown({ generatedAt, days, minImpressions, metrics, verdict, topTargets }) {
  const lines = [
    '# JoyLab Homepage Funnel Report',
    '',
    `- Generated: ${generatedAt}`,
    `- Window: rolling ${days} days`,
    `- Minimum sample: ${minImpressions} impressions per editorial/major/latest/books section`,
    '',
    '## Section Funnel',
    '',
    '| Section | Impressions | Clicks | CTR | Relative CTR Index |',
    '| --- | ---: | ---: | ---: | ---: |'
  ];

  for (const row of metrics) {
    lines.push(`| ${row.section} | ${row.impressions} | ${row.clicks} | ${row.ctr.toFixed(2)}% | ${row.relativeIndex.toFixed(1)} |`);
  }

  lines.push('', '## Pass 03 Decision', '', `**${verdict.verdict}** · ${verdict.readiness ?? 'READY'} · confidence ${verdict.confidence ?? 'N/A'}`, '', verdict.reason, '');

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
      { section: 'books', impressions: 180 },
      { section: 'guide', impressions: 150 }
    ],
    [
      { section: 'editorial', clicks: 45 },
      { section: 'major', clicks: 8 },
      { section: 'latest', clicks: 20 },
      { section: 'books', clicks: 10 },
      { section: 'guide', clicks: 18 }
    ]
  );
  const verdict = judgePass03(metrics, 100);
  if (verdict.verdict !== 'CHANGE') {
    throw new Error(`Homepage funnel self-test expected CHANGE, got ${verdict.verdict}`);
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

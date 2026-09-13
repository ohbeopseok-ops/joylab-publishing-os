import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleDir = path.join(root, 'src/data/articles');
const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const auditPath = path.join(root, 'docs/operations/research-image-audit-2026-09-13.md');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const getFrontmatter = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = match?.[1] ?? '';
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
    return m?.[1]?.trim();
  };
  return {
    title: get('title') ?? path.basename(file, '.md'),
    series: get('series'),
    draft: get('draft') === 'true'
  };
};

const defaultHero = {
  src: '/images/research/joylab-research-default-hero.svg',
  alt: 'JoyLab Research Standard v1.0 공통 프리미엄 리서치 대표 이미지',
  caption: 'JoyLab Research Standard v1.0 기본 Hero. 핵심 논지와 데이터는 Visual Research에서 이어집니다.'
};
const defaultSignal = {
  src: '/images/research/joylab-research-signal.svg',
  alt: '핵심 데이터와 변화 신호를 정리한 JoyLab Visual Research 이미지',
  caption: '핵심 데이터와 변화 신호를 한 화면에서 확인합니다.'
};
const defaultFramework = {
  src: '/images/research/joylab-research-framework.svg',
  alt: 'Fact Interpretation Scenario Action 구조를 설명한 JoyLab 리서치 프레임워크 이미지',
  caption: 'Fact → Interpretation → Scenario → Action 순서로 판단 기준을 정리합니다.'
};
const defaultCompare = {
  src: '/images/research/joylab-research-compare.svg',
  alt: '비교형 또는 밸류체인형 리서치의 선택 기준을 정리한 JoyLab 비교 이미지',
  caption: '비교형·밸류체인형 글은 핵심 차이를 세 번째 보조 시각자료로 보완할 수 있습니다.'
};

const rows = [];
for (const name of fs.readdirSync(articleDir).filter((name) => name.endsWith('.md')).sort()) {
  const id = name.replace(/\.md$/, '');
  const meta = getFrontmatter(path.join(articleDir, name));
  if (meta.draft || !meta.series) continue;

  const existed = Boolean(manifest[id]);
  const isCompare = /compare|value-chain|-vs-/i.test(id) || /비교|밸류체인/.test(meta.title);
  if (!manifest[id]) {
    manifest[id] = {
      hero: { ...defaultHero, alt: `${meta.title} — ${defaultHero.alt}` },
      supporting: [
        { ...defaultSignal, alt: `${meta.title} — ${defaultSignal.alt}` },
        { ...defaultFramework, alt: `${meta.title} — ${defaultFramework.alt}` },
        ...(isCompare ? [{ ...defaultCompare, alt: `${meta.title} — ${defaultCompare.alt}` }] : [])
      ]
    };
  }
  const visual = manifest[id];
  const count = visual?.supporting?.length ?? 0;
  const status = visual?.hero?.src && count >= 2 ? 'PASS' : count === 1 ? 'RETRY' : 'FAIL';
  rows.push({ id, title: meta.title, series: meta.series, status, mode: existed ? 'CURATED/EXISTING' : 'AUTO-BASELINE', count });
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const summary = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] ?? 0) + 1;
  acc[row.mode] = (acc[row.mode] ?? 0) + 1;
  return acc;
}, {});
const md = `# Research Image Audit — 2026-09-13\n\n## Scope\n\n- 대상: \`draft: false\` 이고 \`series\`가 있는 전체 published research\n- 기본 계약: Hero 1 + Supporting Visual 2\n- 비교형·밸류체인형: Supporting Visual 최대 3 허용\n- 기존 전용 이미지가 있는 글은 CURATED/EXISTING 유지\n- 누락 글은 JoyLab Research Standard v1.0 AUTO-BASELINE으로 즉시 보충\n\n## Summary\n\n- Total: **${rows.length}**\n- PASS: **${summary.PASS ?? 0}**\n- RETRY: **${summary.RETRY ?? 0}**\n- FAIL: **${summary.FAIL ?? 0}**\n- Curated / Existing: **${summary['CURATED/EXISTING'] ?? 0}**\n- Auto Baseline: **${summary['AUTO-BASELINE'] ?? 0}**\n\n## Audit Table\n\n| Article | Series | Mode | Supporting | Status |\n|---|---|---|---:|---|\n${rows.map((r) => `| \`${r.id}\` | ${r.series} | ${r.mode} | ${r.count} | **${r.status}** |`).join('\n')}\n\n## Editorial Follow-up\n\nAUTO-BASELINE은 이미지 누락을 없애는 최소 품질선입니다. 조회·검색유입·체류시간이 높은 글은 별도 에디토리얼 Hero와 데이터 차트로 순차 승격합니다.\n`;
fs.mkdirSync(path.dirname(auditPath), { recursive: true });
fs.writeFileSync(auditPath, md);
console.log(`Research image manifest synced: ${rows.length} published research articles.`);
console.log(summary);

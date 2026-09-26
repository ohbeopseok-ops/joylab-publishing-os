import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function arg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((v) => v.startsWith(prefix))?.slice(prefix.length) || fallback;
}

function loadProject(projectId) {
  const file = path.join(root, 'data/build-log/projects', `${projectId}.json`);
  if (!fs.existsSync(file)) throw new Error(`Build Log project not found: ${projectId}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function clean(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ');
}

export function generate(project) {
  const chapters = [];
  chapters.push({
    source: 'problemStatement',
    title: '문제를 한 문장으로 정의하다',
    angle: clean(project.problemStatement)
  });
  chapters.push({
    source: 'persona0',
    title: `Persona 0 — ${clean(project.persona0)}에게서 시작하다`,
    angle: '가상의 사용자가 아니라 첫 실제 사용자의 반복 행동과 불편에서 요구사항을 뽑는다.'
  });

  for (const [index, d] of (project.decisions || []).entries()) {
    chapters.push({
      source: `decision:${index + 1}`,
      title: clean(d.decision),
      angle: `결정 이유: ${clean(d.reason)}`,
      alternatives: d.alternatives || [],
      impact: clean(d.impact)
    });
  }

  for (const release of project.releases || []) {
    chapters.push({
      source: `release:${release.version}`,
      title: `${release.version}에서 무엇이 달라졌나`,
      angle: `${release.date} · ${release.status} · ${clean(release.ref)}`
    });
  }

  const articles = [
    {
      title: `${project.title}은 왜 필요했나｜문제 정의부터 MVP까지`,
      intent: '검색형',
      source: 'problemStatement'
    },
    ...(project.decisions || []).map((d) => ({
      title: `${clean(d.decision)}｜실제 프로젝트에서 이 결정을 내린 이유`,
      intent: '사례형',
      source: 'decision'
    }))
  ];

  const socials = [];
  socials.push({
    hook: `서비스는 기능이 아니라 문제 한 문장에서 시작했다.`,
    body: clean(project.problemStatement),
    source: 'problemStatement'
  });
  for (const d of project.decisions || []) {
    socials.push({
      hook: `처음 생각한 답을 버렸다.`,
      body: `${clean(d.decision)} 이유는 ${clean(d.reason)}`,
      source: 'decision'
    });
  }

  return {
    projectId: project.projectId,
    generatedAt: new Date().toISOString(),
    book: project.book,
    chapterCandidates: chapters,
    articleCandidates: articles,
    socialCandidates: socials,
    nextActions: [
      'chapterCandidates에서 실제 장면과 증거가 있는 항목을 우선 집필한다.',
      'evidence가 비어 있는 Chapter 후보는 출간 원고 확정 전에 근거를 추가한다.',
      'Article은 책 본문 복제가 아니라 검색 의도에 맞춰 재구성한다.',
      'Social은 결론 전체보다 하나의 결정 또는 실패 장면만 꺼낸다.'
    ]
  };
}

function markdown(result) {
  const lines = [
    `# Bookify Generator V1 — ${result.projectId}`,
    '',
    `Generated: ${result.generatedAt}`,
    '',
    '## Chapter Candidates',
    ''
  ];
  result.chapterCandidates.forEach((item, i) => {
    lines.push(`${i + 1}. **${item.title}**`, `   - source: ${item.source}`, `   - angle: ${item.angle}`);
    if (item.alternatives?.length) lines.push(`   - alternatives: ${item.alternatives.join(' / ')}`);
    if (item.impact) lines.push(`   - impact: ${item.impact}`);
  });
  lines.push('', '## Article Candidates', '');
  result.articleCandidates.forEach((item, i) => lines.push(`${i + 1}. **${item.title}** · ${item.intent}`));
  lines.push('', '## Social Candidates', '');
  result.socialCandidates.forEach((item, i) => lines.push(`${i + 1}. **${item.hook}**\n   - ${item.body}`));
  lines.push('', '## Next Actions', '');
  result.nextActions.forEach((item) => lines.push(`- ${item}`));
  return lines.join('\n') + '\n';
}

function selfTest() {
  const result = generate({
    projectId:'demo',
    title:'Demo',
    problemStatement:'사용자가 반복적으로 같은 일을 다시 해야 하는 문제를 줄인다.',
    persona0:'현장 사용자',
    decisions:[{decision:'입력 단계를 줄인다',reason:'현장 입력 속도가 중요하다',alternatives:['기능 추가'],impact:'입력 흐름 단순화'}],
    releases:[{version:'0.1',date:'2026-01-01',status:'candidate',ref:'demo'}],
    book:{status:'outline'}
  });
  if (result.chapterCandidates.length !== 4 || result.articleCandidates.length !== 2 || result.socialCandidates.length !== 2) {
    throw new Error('Bookify self-test failed');
  }
  console.log('Bookify Generator V1 self-test passed.');
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const projectId = arg('project', 'leaderdesk');
const outDir = path.resolve(root, arg('out-dir', 'qa-artifacts/bookify'));
const project = loadProject(projectId);
const result = generate(project);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${projectId}.json`), JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, `${projectId}.md`), markdown(result));
console.log(`Bookify Generator V1: ${projectId}`);

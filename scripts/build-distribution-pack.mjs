import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const slug = args[args.indexOf('--slug') + 1];

function field(text, name) {
  const match = text.match(new RegExp(`^${name}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim() || '';
}
function taggedLink(url, source, medium, campaign, content) {
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', campaign);
  u.searchParams.set('utm_content', content);
  return u.toString();
}
function variant(id, title, body, cta, hashtags, url, source, medium, campaign) {
  return { id, title, body, cta, hashtags, utmUrl: taggedLink(url, source, medium, campaign, id), publishedUrl: null, publishedAt: null };
}

if (process.argv.includes('--self-test')) {
  const link = taggedLink('https://aijoylab.kr/articles/demo', 'threads', 'social', 'research_demo', 'threads_hook_a');
  if (!link.includes('utm_source=threads') || !link.includes('utm_content=threads_hook_a')) throw new Error('Distribution UTM self-test failed.');
  console.log('Distribution pack self-test passed.');
  process.exit(0);
}

if (!slug || !/^[A-Za-z0-9_-]+$/.test(slug)) throw new Error('Usage: node scripts/build-distribution-pack.mjs --slug <article-slug>');
const articlePath = path.join(root, 'src/data/articles', `${slug}.md`);
if (!fs.existsSync(articlePath)) throw new Error(`Article not found: ${articlePath}`);
const article = fs.readFileSync(articlePath, 'utf8');
if (/^draft:\s*true\s*$/m.test(article)) throw new Error(`Draft article cannot create distribution pack: ${slug}`);
const title = field(article, 'title');
const description = field(article, 'description');
const category = field(article, 'category');
const publishedAt = field(article, 'publishedAt');
const sourceUrl = `https://aijoylab.kr/articles/${slug}`;
const campaign = `research_${slug}`;
const outDir = path.join(root, 'distribution/generated', slug);
fs.mkdirSync(outDir, { recursive: true });

const channels = {
  threads: { source: 'threads', medium: 'social', variants: ['hook', 'interpretation', 'question'] },
  x: { source: 'x', medium: 'social', variants: ['data', 'debate', 'judgment'] },
  linkedin: { source: 'linkedin', medium: 'social', variants: ['insight'] },
  naver: { source: 'naver', medium: 'blog', variants: ['summary'] }
};

const manifest = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  sourceArticle: { slug, title, description, category, publishedAt, url: sourceUrl },
  campaign,
  channels: Object.fromEntries(Object.entries(channels).map(([name, cfg]) => [name, {
    utmSource: cfg.source,
    utmMedium: cfg.medium,
    publishStatus: 'draft',
    publishedAt: null,
    variants: cfg.variants,
    links: Object.fromEntries(cfg.variants.map((name) => [name, taggedLink(sourceUrl, cfg.source, cfg.medium, campaign, name)]))
  }]))
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const templates = {
  'threads.md': `# Threads — ${title}\n\n## 1. Hook\n${description}\n\n원문: ${manifest.channels.threads.links.hook}\n\n## 2. Interpretation\n사실과 해석을 분리해 이 이슈가 실제 판단에 어떤 의미인지 풀어봅니다.\n\n원문: ${manifest.channels.threads.links.interpretation}\n\n## 3. Question\n당신이라면 이 이슈에서 어떤 지표를 먼저 확인하겠습니까?\n\n원문: ${manifest.channels.threads.links.question}\n`,
  'x.md': `# X — ${title}\n\n## 1. Data\n${description}\n${manifest.channels.x.links.data}\n\n## 2. Debate\n표면적 논쟁보다 실제 숫자와 인센티브를 확인해야 합니다.\n${manifest.channels.x.links.debate}\n\n## 3. Judgment\nJoyLab은 다음 확인 지표까지 연결합니다.\n${manifest.channels.x.links.judgment}\n`,
  'linkedin.md': `# LinkedIn — ${title}\n\n## Problem\n${description}\n\n## Interpretation\n사실 → 해석 → 시나리오 → 실행의 순서로 구조화합니다.\n\n## Practical implication\n리더와 실무자가 다음 판단에서 확인할 조건을 남깁니다.\n\n원문: ${manifest.channels.linkedin.links.insight}\n`,
  'naver.md': `# Naver Summary — ${title}\n\n## 검색 의도\n${description}\n\n## 요약\n핵심 사실과 판단 기준을 검색형 문장으로 재구성합니다. 전체 원문을 복제하지 않고 JoyLab 원문으로 연결합니다.\n\nJoyLab 원문: ${manifest.channels.naver.links.summary}\n`
};
for (const [name, content] of Object.entries(templates)) fs.writeFileSync(path.join(outDir, name), content);

const executionPack = {
  version: '1.0', articleSlug: slug, campaign, state: 'DRAFT', sourceUrl,
  generatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  approval: { approved: false, approvedBy: null, approvedAt: null },
  channels: {
    threads: { status:'DRAFT', variants:[
      variant('threads_hook_a', title, description, '전체 분석은 JoyLab 원문에서 확인하세요.', ['#JoyLab', `#${category.replace(/[^가-힣A-Za-z0-9]/g,'')}`], sourceUrl,'threads','social',campaign),
      variant('threads_insight_b', `${title} — 해석`, '사실을 확인한 뒤 이 이슈가 시장·기술·업무에 어떤 의미인지 JoyLab 관점으로 해석합니다.', '판단 기준까지 원문에 정리했습니다.', ['#JoyLab'], sourceUrl,'threads','social',campaign),
      variant('threads_question_c', `${title} — 질문`, '표면적 결론보다 다음 판단에서 무엇을 확인해야 하는지가 중요합니다. 당신이라면 어떤 지표를 먼저 보시겠습니까?', '원문에서 확인 지표를 확인하세요.', ['#JoyLab'], sourceUrl,'threads','social',campaign)
    ]},
    x: { status:'DRAFT', variants:[
      variant('x_data_a', title, description, '핵심 숫자와 원문 ↓', ['#JoyLab'], sourceUrl,'x','social',campaign),
      variant('x_debate_b', `${title} — debate`, '통념과 실제 데이터가 같은 방향인지 확인해야 합니다. JoyLab은 사실과 해석을 분리해서 봅니다.', '전체 분석 ↓', ['#JoyLab'], sourceUrl,'x','social',campaign),
      variant('x_judgment_c', `${title} — judgment`, '한 문장 결론보다 다음 확인 지표가 중요합니다. 무엇이 바뀌면 판단도 바뀌는지 확인합니다.', '확인 지표 ↓', ['#JoyLab'], sourceUrl,'x','social',campaign)
    ]},
    linkedin: { status:'DRAFT', variants:[
      variant('linkedin_analysis_a', title, `${description}\n\n이 이슈를 Fact → Interpretation → Scenario → Action 구조로 보면, 중요한 것은 정보 자체보다 다음 의사결정 조건입니다.`, '리더와 실무자를 위한 전체 리서치를 확인하세요.', ['#JoyLab', '#Research'], sourceUrl,'linkedin','social',campaign)
    ]},
    naver: { status:'DRAFT', variants:[
      variant('naver_summary_a', title, `${description}\n\n핵심 사실과 판단 기준을 요약했습니다. 전체 원문을 복제하지 않고 세부 근거와 시나리오는 JoyLab 원문으로 연결합니다.`, '전체 분석은 JoyLab 원문에서 확인하세요.', ['#JoyLab'], sourceUrl,'naver','blog',campaign)
    ]}
  },
  publishLog: []
};
fs.writeFileSync(path.join(outDir, 'distribution-pack.json'), `${JSON.stringify(executionPack, null, 2)}\n`);
console.log(`Distribution pack created: distribution/generated/${slug}`);

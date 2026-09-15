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

if (process.argv.includes('--self-test')) {
  const link = taggedLink('https://aijoylab.kr/articles/demo', 'threads', 'social', 'research_demo', 'hook');
  if (!link.includes('utm_source=threads') || !link.includes('utm_content=hook')) throw new Error('Distribution UTM self-test failed.');
  console.log('Distribution pack self-test passed.');
  process.exit(0);
}

if (!slug || !/^[A-Za-z0-9_-]+$/.test(slug)) throw new Error('Usage: node scripts/build-distribution-pack.mjs --slug <article-slug>');
const articlePath = path.join(root, 'src/data/articles', `${slug}.md`);
if (!fs.existsSync(articlePath)) throw new Error(`Article not found: ${articlePath}`);
const article = fs.readFileSync(articlePath, 'utf8');
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
    links: Object.fromEntries(cfg.variants.map((variant) => [variant, taggedLink(sourceUrl, cfg.source, cfg.medium, campaign, variant)]))
  }]))
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const templates = {
  'threads.md': `# Threads — ${title}\n\n## 1. Hook\n- 핵심 충돌/숫자/질문으로 시작\n- 원문 복붙 금지\n- Link: ${manifest.channels.threads.links.hook}\n\n## 2. Interpretation\n- 사실 → JoyLab 해석 → 의미\n- Link: ${manifest.channels.threads.links.interpretation}\n\n## 3. Question\n- 독자가 답하고 싶어지는 질문으로 마무리\n- Link: ${manifest.channels.threads.links.question}\n`,
  'x.md': `# X — ${title}\n\n## 1. Data\n- 핵심 숫자 1~3개 + 한 줄 의미\n- Link: ${manifest.channels.x.links.data}\n\n## 2. Debate\n- 시장의 통념 vs JoyLab 해석\n- Link: ${manifest.channels.x.links.debate}\n\n## 3. Judgment\n- 한 문장 판단 + 다음 확인 지표\n- Link: ${manifest.channels.x.links.judgment}\n`,
  'linkedin.md': `# LinkedIn — ${title}\n\n## Problem\n- 산업/업무 문제 정의\n\n## Interpretation\n- 데이터와 구조적 의미\n\n## Practical implication\n- 리더/실무자가 무엇을 확인할지\n\n원문: ${manifest.channels.linkedin.links.insight}\n`,
  'naver.md': `# Naver Summary — ${title}\n\n## 검색 의도\n- 핵심 키워드와 독자의 질문\n\n## 요약\n- 원문의 30~50% 수준으로 재구성\n- 핵심 수치·판단 기준 포함\n- 전체 원문 복제 금지\n\nJoyLab 원문: ${manifest.channels.naver.links.summary}\n`
};
for (const [name, content] of Object.entries(templates)) fs.writeFileSync(path.join(outDir, name), content);
console.log(`Distribution pack created: distribution/generated/${slug}`);

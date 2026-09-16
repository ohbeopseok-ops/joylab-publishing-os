import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pilotDir = path.join(root, 'video-engine/pilots/ai-power-next-bottleneck');
const fail = (message) => { throw new Error(`[Video Engine GOLD] ${message}`); };
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const mustExist = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) fail(`Missing ${file}`);
  return full;
};

const required = [
  'video-engine/RESEARCH_VIDEO_ENGINE_V0_1.md',
  'video-engine/contracts/source-pack.schema.json',
  'video-engine/VIDEO_GOLD_V0_1.md',
  'video-engine/pilots/ai-power-next-bottleneck/manifest.json',
  'video-engine/pilots/ai-power-next-bottleneck/01_RESEARCH.md',
  'video-engine/pilots/ai-power-next-bottleneck/02_EVIDENCE.md',
  'video-engine/pilots/ai-power-next-bottleneck/03_NUMBERS.json',
  'video-engine/pilots/ai-power-next-bottleneck/04_VIDEO_BRIEF.md',
  'video-engine/pilots/ai-power-next-bottleneck/05_YOUTUBE_PACK.md',
  'src/components/ArticleVideo.astro',
  'src/components/VideoObjectSchema.astro'
];
required.forEach(mustExist);

const manifest = JSON.parse(fs.readFileSync(path.join(pilotDir, 'manifest.json'), 'utf8'));
if (manifest.version !== '0.1') fail('Pilot manifest version must be 0.1');
if (manifest.article?.slug !== 'ai-power-next-bottleneck') fail('Unexpected pilot slug');
if (manifest.article?.canonical !== 'https://aijoylab.kr/articles/ai-power-next-bottleneck') fail('Pilot canonical mismatch');
if (manifest.workflow?.state !== 'SOURCE_READY') fail('Pilot must start at SOURCE_READY');
if (manifest.workflow?.humanApprovalRequired !== true) fail('Human approval must remain mandatory');
if (manifest.activation?.youtubeOfficialChannelEnabled !== false) fail('YouTube official channel must remain disabled');

for (const file of Object.values(manifest.files || {})) {
  if (!fs.existsSync(path.join(pilotDir, file))) fail(`Manifest references missing file: ${file}`);
}

const numbers = JSON.parse(fs.readFileSync(path.join(pilotDir, '03_NUMBERS.json'), 'utf8'));
if (!Array.isArray(numbers.facts) || numbers.facts.length < 2) fail('At least two locked pilot facts required');
for (const fact of numbers.facts) {
  if (fact.status !== 'FACT_LOCK') fail(`Unlocked number: ${fact.id}`);
  if (!fact.sourceUrl?.startsWith('https://')) fail(`Missing sourceUrl: ${fact.id}`);
  if (fact.unit !== 'TWh') fail(`Unexpected unit in pilot number: ${fact.id}`);
}

const brief = fs.readFileSync(path.join(pilotDir, '04_VIDEO_BRIEF.md'), 'utf8');
for (const token of ['MUST INCLUDE', 'DO NOT ADD', 'ENDING CTA', 'NOTEBOOK GENERATION INSTRUCTION']) {
  if (!brief.includes(token)) fail(`Video brief missing ${token}`);
}

const article = read('src/data/articles/ai-power-next-bottleneck.md');
if (!article.includes('video:') || !article.includes('status: "planned"')) fail('Pilot article must declare planned video metadata');
if (!article.includes('sourcePack: "video-engine/pilots/ai-power-next-bottleneck"')) fail('Pilot article sourcePack mismatch');

const contentConfig = read('src/content.config.ts');
for (const token of ['status: z.enum', "'published'", 'youtubeId', 'sourcePack']) {
  if (!contentConfig.includes(token)) fail(`Content video contract missing ${token}`);
}

const articleVideo = read('src/components/ArticleVideo.astro');
if (!articleVideo.includes('youtube-nocookie.com/embed/')) fail('ArticleVideo must use privacy-enhanced YouTube embed');
if (!articleVideo.includes('article_video_click')) fail('ArticleVideo analytics event missing');

const videoSchema = read('src/components/VideoObjectSchema.astro');
for (const token of ["'@type': 'VideoObject'", 'thumbnailUrl', 'uploadDate', 'duration', 'embedUrl', 'contentUrl']) {
  if (!videoSchema.includes(token)) fail(`VideoObject contract missing ${token}`);
}

const articlePage = read('src/pages/articles/[...slug].astro');
if (!articlePage.includes('publishedVideo')) fail('Article page publishedVideo gate missing');
if (!articlePage.includes('<ArticleVideo')) fail('ArticleVideo integration missing');
if (!articlePage.includes('<VideoObjectSchema')) fail('VideoObjectSchema integration missing');

const worker = read('worker/index.js');
if (!worker.includes('article_video_click')) fail('Analytics worker contract missing article_video_click');

for (const file of ['src/components/IdentitySchema.astro', 'src/components/AboutOfficialChannels.astro', 'src/components/SiteFooter.astro']) {
  const text = read(file);
  if (text.includes('https://www.youtube.com/@superhalabe100')) fail(`YouTube official channel was reactivated in ${file}`);
}

console.log('Video Engine GOLD V0.1 passed. Pilot=ai-power-next-bottleneck state=SOURCE_READY youtubeOfficial=OFF');

import fs from 'node:fs/promises';
import path from 'node:path';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: npm run research-guide:scaffold -- <slug>');
  process.exit(1);
}

const title = process.argv.slice(3).join(' ') || slug
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const target = path.join(process.cwd(), 'src', 'pages', 'guides', slug + '.astro');

try {
  await fs.access(target);
  console.error('Refusing to overwrite existing guide: ' + target);
  process.exit(1);
} catch {}

const source = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ResearchGraphMap from '../../components/ResearchGraphMap.astro';
import graph from '../../../config/research-graph-${slug}-v1.json';
import '../../styles/semiconductor-guide-v2.css';
---

<BaseLayout
  title="${title} | JoyLab"
  description="${title} research guide"
  bodyClass="semiconductor-guide-v2"
>
  <section class="sg-hero">
    <div class="sg-wrap sg-hero__inner">
      <div class="sg-hero__top">
        <div class="sg-hero__copy">
          <div class="sg-eyebrow">JOYLAB RESEARCH GUIDE</div>
          <h1>${title}</h1>
          <p class="sg-hero__lead">Research Guide description.</p>
        </div>
        <aside class="sg-lens" aria-label="${title} reading lens">
          <div class="sg-lens__brand">JOYLAB<br /><b>RESEARCH</b></div>
        </aside>
      </div>
    </div>
  </section>

  <main class="sg-main">
    <div class="sg-wrap sg-layout">
      <div class="sg-graph-span">
        <ResearchGraphMap
          graph={graph}
          eyebrow="JOYLAB RESEARCH GRAPH"
          title="${title}"
          description="Graph description."
          primaryFlow={[]}
        />
      </div>

      <section class="sg-content">
        <div class="sg-section-head">
          <div><div class="sg-eyebrow">RESEARCH PATH</div><h2>Research content</h2></div>
          <p>Main research content belongs here.</p>
        </div>
      </section>

      <aside class="sg-rail" aria-label="${title} guide rail">
        <section class="sg-rail-card sg-rail-card--dark">
          <small>START HERE</small>
          <h3>Start with the core question</h3>
          <p>Guide the reader into the research path.</p>
        </section>
      </aside>
    </div>
  </main>
</BaseLayout>
`;

await fs.writeFile(target, source, 'utf8');
console.log('Created ' + target);
console.log('Contract: full-width graph row → content + rail');

# AI Standards & Tech Sovereignty — Implementation Package V1

Status: PR candidate  
Date: 2026-09-27

## 1. Objective

Publish the first JoyLab AI Standards research article, add a reusable AI Standards pillar hub, and connect six research pieces through an interactive Research Graph without creating dead links.

## 2. Production routes

- Article: `/articles/china-ai-token-ciyuan-discourse-power`
- Pillar: `/guides/ai-standards`

## 3. Source files

- Article frontmatter + body: `src/data/articles/china-ai-token-ciyuan-discourse-power.md`
- Pillar page: `src/pages/guides/ai-standards.astro`
- Interactive component: `src/components/AiStandardsResearchGraph.astro`
- Research Graph JSON: `src/data/ai-standards-research-graph.json`

The production content model is Astro Markdown frontmatter, not a separate per-article content JSON file. The graph JSON is the reusable machine-readable contract for this cluster.

## 4. Article registration contract

```yaml
category: "AI·생산성"
publishedAt: 2026-09-27
series: "AI Standards & Tech Sovereignty"
seriesOrder: 1
canonical: "https://aijoylab.kr/articles/china-ai-token-ciyuan-discourse-power"
draft: false
```

Related Research is automatically scored by the article route using:
- shared tag: +3 per tag
- same category: +1
- same series: +2
- investment taxonomy overlap when applicable

This article also receives a dedicated guide CTA to `/guides/ai-standards`.

## 5. Sitemap contract

- Article route: AUTO — all non-draft article collection entries are emitted by `src/pages/sitemap.xml.ts`.
- Pillar route: MANUAL — `/guides/ai-standards` added to `staticPaths`.
- lastmod: `updatedAt ?? publishedAt` according to CONTENT_DATE_CONTRACT_V1.

## 6. Structured data

Article:
- Article
- BreadcrumbList
- ItemList when two or more published same-series articles exist
- FAQPage when optional `faqs` frontmatter is present

Pillar:
- CollectionPage
- BreadcrumbList
- ItemList for live research
- FAQPage

Planned research URLs are intentionally excluded from structured data and anchors until they are published.

## 7. Hero asset

Safe production fallback currently used:
- `/images/research/joylab-research-default-hero.svg`

Prepared dedicated Hero candidate:
- target production path: `/images/research/china-ai-token-ciyuan-discourse-power.webp`
- required dimensions: 1600 × 900
- required format: WebP
- repository size gate: 10KB–256KB
- prepared artifact: 1600 × 900 / 225,566 bytes

When the dedicated binary asset is added, update:
- `heroImage`
- `ogImage`
in the article frontmatter to the target production path.

## 8. Research Graph contract

Six research pieces are represented across five decision layers:

`Language → Measurement → Standard → Governance → Discourse Power`

Live:
1. China Token / 词元 article
2. AI Standards pillar hub

Planned:
3. AI Token economics
4. AI translation gatekeeper
5. AI-era English / Deep Inquiry
6. AI governance standard stack

Planned nodes render as non-clickable PLANNED cards. No dead URL is emitted.

## 9. Acceptance criteria

- Article builds from the articles collection.
- Pillar resolves at `/guides/ai-standards`.
- AI top navigation is active on the new guide.
- Article and guide are present in sitemap according to the rules above.
- No planned Research Graph node produces a broken href.
- FAQPage is emitted only when FAQ data exists.
- 390px viewport has no body-level horizontal overflow.
- Build and relevant CI gates pass before merge.
- Production release is not GOLD until the repository Release Gate and Production Smoke are satisfied.

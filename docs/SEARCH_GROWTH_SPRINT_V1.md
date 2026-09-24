# Search Growth Sprint V1

Date: 2026-09-24

## Baseline

The available 2026-09-24 Search Console export is aggregate-level, not page-level.

- 2026-09-21: indexed 27 / not indexed 55.
- Exclusion reasons in the coverage export:
  - Discovered — currently not indexed: 42
  - Crawled — currently not indexed: 10
  - Page with redirect: 2
  - Alternate page with proper canonical: 1
- Search performance export through 2026-09-21: 131 impressions / 1 click.

The live GSC connector could not be used in this sprint because the connected GSC Wizard subscription is inactive. Therefore the page-level P0/P1 split below is a provisional SEO queue based on content centrality and search intent, not a claim that Google currently classifies each URL as unindexed.

## Sprint order

1. Indexability
2. Internal link graph
3. SERP CTR
4. Conversion path

## P0 — provisional page queue

1. /articles/what-is-hbm
2. /articles/semiconductor-cycle
3. /articles/samsung-electronics-outlook
4. /articles/sk-hynix-outlook
5. /articles/samsung-vs-sk-hynix-ai-memory
6. /articles/ai-power-next-bottleneck
7. /articles/korea-ai-power-companies-compare
8. /articles/doosan-enerbility-ai-power
9. /articles/ls-electric-ai-power
10. /articles/hd-hyundai-electric-ai-power
11. /articles/what-is-ai-agent
12. /articles/ai-workflow-automation
13. /articles/ai-productivity-roi
14. /articles/ai-agent-governance
15. /articles/ai-productivity-platforms-compare
16. /articles/ai-api-key-compute-theft-2026
17. /articles/ai-agent-security-prompt-to-rce-2026
18. /articles/mcp-security-tool-poisoning-2026
19. /articles/us-cpi-fed-nasdaq-guide
20. /articles/us-economic-indicators-guide

## Page-level split when GSC access returns

### Group A — impressions but weak CTR
Priority formula:
- impressions >= 10
- average position <= 20
- CTR below site/query expectation
- then sort by impression opportunity

Action:
- rewrite SEO title
- tighten description
- align search intent in first 100 words
- ensure matching internal anchor text

### Group B — not indexed
Priority formula:
- crawled-not-indexed before discovered-not-indexed
- evergreen hub/core research before newsy articles
- URLs with 3+ relevant internal-link sources first

Action:
- strengthen hub and related-research links
- verify canonical/indexability/sitemap
- refresh thin or duplicative intro
- resubmit only after page-level cause is fixed

## Conversion path

Article → Related Research → Research Hub → JoyLab Books / YouTube → Contact

Implemented by ArticleGrowthPath.astro while the existing ArticleContactCta remains the final collaboration CTA.

## CI

Search Growth Gate V1 blocks:
- missing growth path
- fewer than 2 article-to-article links
- missing Books link
- missing official YouTube link
- missing Contact path
- missing canonical
- accidental noindex

It also reports title/description length opportunities without blocking release.

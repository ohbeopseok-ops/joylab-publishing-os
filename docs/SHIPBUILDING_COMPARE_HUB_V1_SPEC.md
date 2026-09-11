# JoyLab Shipbuilding Compare Hub V1 Spec

Status: Draft for Gold validation  
Updated: 2026-09-11  
Parent standard: `docs/COMPARE_HUB_TEMPLATE_V1.md`

## 1. Purpose

Apply the validated Compare Hub V1 framework to a new sector so the template proves it works beyond semiconductors and AI power.

The first non-AI-power validation sector is Korean shipbuilding.

Primary comparison set:

- HD Hyundai Heavy Industries (HD현대중공업)
- Hanwha Ocean (한화오션)
- Samsung Heavy Industries (삼성중공업)
- HD Korea Shipbuilding & Offshore Engineering (HD한국조선해양)

> Note: HD Korea Shipbuilding & Offshore Engineering is a group-level operating/holding platform rather than a perfectly identical operating peer. The article must explicitly normalize this difference instead of pretending all four have the same business model.

## 2. Canonical Compare Hub Lens

Use the same Compare Hub V1 sequence:

1. VALUE CHAIN POSITION
2. THEME EXPOSURE
3. DEMAND QUALITY / REVENUE VISIBILITY
4. CAPACITY & LEAD TIME
5. MARGIN TRANSMISSION
6. COMPETITIVE EDGE
7. VALUATION & RISK
8. SCENARIO
9. ACTION

For shipbuilding, the generic `Demand Visibility` lens is specialized as:

- Order backlog
- Vessel mix
- Delivery year mix
- New-order pricing / replacement pricing
- LNG carrier, naval, offshore and eco-ship exposure
- Customer / region concentration
- Cancellation and execution risk

## 3. Company-specific research emphasis

### HD현대중공업

Primary angle: premium shipbuilding + naval + engine / high-value vessel execution.

Key variables:

- Commercial ship mix
- Naval / special vessel exposure
- Engine and machinery contribution
- Backlog quality
- Delivery schedule
- Margin conversion

### 한화오션

Primary angle: naval / defense optionality + LNG / offshore recovery.

Key variables:

- Naval and submarine exposure
- U.S. shipyard / defense cooperation optionality
- LNG carrier backlog
- Offshore project execution
- Productivity normalization
- Margin recovery speed

### 삼성중공업

Primary angle: LNG + offshore / FLNG specialization.

Key variables:

- LNG carrier exposure
- FLNG / offshore project mix
- High-value vessel pricing
- Backlog and delivery profile
- One-off project risk
- Operating leverage

### HD한국조선해양

Primary angle: group-level portfolio, order allocation and capital efficiency.

Key variables:

- Consolidated group backlog
- HD현대중공업 / HD현대삼호 / HD현대미포 mix
- Group order allocation
- Consolidated margin structure
- Capital allocation / dividend / holding-company discount
- Valuation normalization vs direct operating peers

## 4. Core comparison tables

At minimum the final article should include the following tables.

### Table A — Positioning

| Company | Core position | Premium exposure | Defense / naval | Offshore | Group structure |
| --- | --- | --- | --- | --- | --- |
| HD현대중공업 | | | | | |
| 한화오션 | | | | | |
| 삼성중공업 | | | | | |
| HD한국조선해양 | | | | | |

### Table B — Demand quality

| Company | Order backlog | Vessel mix | Delivery visibility | Pricing quality | Key risk |
| --- | ---: | --- | --- | --- | --- |
| HD현대중공업 | | | | | |
| 한화오션 | | | | | |
| 삼성중공업 | | | | | |
| HD한국조선해양 | | | | | |

### Table C — Margin transmission

| Company | Current margin | Margin driver | Labor / productivity | Mix upgrade | Execution risk |
| --- | ---: | --- | --- | --- | --- |
| HD현대중공업 | | | | | |
| 한화오션 | | | | | |
| 삼성중공업 | | | | | |
| HD한국조선해양 | | | | | |

### Table D — Valuation / decision map

| Company | Structural strength | Earnings visibility | Optionality | Valuation burden | Best-fit investor |
| --- | --- | --- | --- | --- | --- |
| HD현대중공업 | | | | | |
| 한화오션 | | | | | |
| 삼성중공업 | | | | | |
| HD한국조선해양 | | | | | |

## 5. Data hierarchy

Before writing the article, validate the latest figures from:

1. Company IR presentations / earnings releases
2. DART filings
3. Official order announcements / exchange disclosures
4. Korea Offshore & Shipbuilding Association / Clarksons-derived industry data only when the company source does not provide the required sector context

Do not use press summaries as the primary source when a company filing or IR source exists.

Required date discipline:

- State the earnings reference period explicitly.
- State the valuation price-date explicitly.
- Do not mix backlog dates between companies without labeling the difference.
- Separate consolidated and segment-level figures.

## 6. Gold Case sequence

Recommended execution order:

1. GC-S01 — HD현대중공업 Company Research V1
2. GC-S02 — 한화오션 Company Research V1
3. GC-S03 — 삼성중공업 Company Research V1
4. GC-S04 — HD한국조선해양 Company Research V1
5. GC-S05 — 조선 4사 Compare Hub V1

After GC-S01~04 are stable, publish GC-S05 and link all five as one cluster.

## 7. Proposed slugs

- `/articles/hd-hyundai-heavy-industries-shipbuilding`
- `/articles/hanwha-ocean-shipbuilding`
- `/articles/samsung-heavy-industries-shipbuilding`
- `/articles/hd-ksoe-shipbuilding`
- `/articles/korea-shipbuilding-companies-compare`

Slugs may be adjusted before publishing, but once shipped they should remain stable.

## 8. Gold Gate

The shipbuilding cluster is Gold only when all conditions pass:

- All four company articles use Company Research Template V1.
- Compare article uses Compare Hub Template V1.
- The four companies are compared using the same lenses.
- HD한국조선해양's structural difference is explicitly normalized.
- Latest IR / DART / official order data are verified.
- Valuation reference date is stated.
- Tables use the shared Research V2 table styling.
- V2 Design System compliance is checked.
- PC and 390px mobile layouts have no horizontal page overflow.
- Canonical / sitemap / RSS behavior is preserved.
- Dependency audit and Astro build pass.
- Production deploy and smoke test pass.

## 9. Next execution step

After this spec is merged:

**GC-S01 HD현대중공업 → GC-S02 한화오션 → GC-S03 삼성중공업 → GC-S04 HD한국조선해양 → GC-S05 조선 4사 Compare Hub V1**

Do not create a separate shipbuilding Pillar page until enough cluster content exists to justify it.
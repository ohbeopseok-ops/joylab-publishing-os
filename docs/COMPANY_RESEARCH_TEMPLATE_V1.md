# JoyLab Company Research Template V1

Status: Gold Standard
Scope: listed-company deep-dive research articles
Applies to: AI Power Company Deep Dive and future company research clusters

## Purpose

Company Research Template V1 turns company analysis into a repeatable JoyLab decision structure. New company articles should not invent a new outline unless the research question genuinely requires it.

Core sequence:

**Value Chain → AI/Theme Exposure → Order Quality → Capacity → Margin → Valuation → Scenario → Action**

The goal is not to rank companies by a single multiple or headline. The goal is to connect business position, demand transmission, execution capacity, profitability, valuation risk, and the next observable checkpoint.

## Canonical Article Structure

### 0. Research Hook

Open with one decision question, not a company introduction.

Good pattern:

> The key question is not whether the company benefits from the theme, but whether that demand is already turning into orders, revenue, margin, and repeat business.

Requirements:
- 2–4 short paragraphs
- define why the company matters now
- identify the most important misconception to avoid
- link to the relevant Pillar/Guide and, when useful, the preceding company article

### 1. VALUE CHAIN POSITION

Answer: **Where does the company sit physically and economically in the value chain?**

Required evidence:
- core products/services
- upstream/downstream position
- direct vs indirect exposure
- one-sentence JoyLab interpretation

### 2. AI / THEME EXPOSURE

Answer: **How does the structural theme reach this company?**

Required evidence:
- direct customer/project exposure where available
- indirect infrastructure exposure where relevant
- recent official order/project examples
- separate narrative exposure from contracted exposure

### 3. ORDER QUALITY

Answer: **Is the order book large, durable, profitable, and convertible?**

Check:
- new orders
- order backlog
- customer/region/product mix
- contract duration and delivery timing
- repeat service/aftermarket potential
- concentration risk

Rule: backlog size alone is never the conclusion. Explain the quality of the backlog.

### 4. CAPACITY & LEAD TIME

Answer: **Can the company turn demand into delivered revenue?**

Check:
- current production capacity
- announced expansion and completion timing
- utilization/ramp-up
- key component bottlenecks
- lead time
- local production footprint

Rule: CAPEX is not automatically bullish. Ask whether added capacity can be sold without damaging price and margin.

### 5. MARGIN TRANSMISSION

Answer: **Is demand already becoming better economics?**

Check:
- revenue growth
- operating profit and OPM
- segment profitability where possible
- product/region mix
- pricing power
- raw material/logistics/tariff sensitivity
- service or recurring revenue contribution

Rule: separate consolidated results from the relevant operating segment when the group structure can distort the theme exposure.

### 6. COMPETITIVE ADVANTAGE & WEAKNESS

Use a compact strengths/risks section.

Strengths should focus on structural advantages such as technology, installed base, production footprint, certification, local service, customer references, switching costs, and delivery slots.

Weaknesses should focus on execution, cyclicality, customer concentration, project risk, capacity competition, policy exposure, FX/tariff risk, and non-core segment drag.

### 7. VALUATION & RISK

Answer: **What expectations are already priced in?**

Minimum requirements:
- explicit valuation reference date
- market cap and price context when useful
- PER/PBR/EV-based metrics only when comparable
- explain distortions in EPS or consolidated structure
- identify the variable that must improve to justify the current multiple

Rule: never present one multiple as sufficient evidence of cheap/expensive.

### 8. SCENARIO — Bull / Base / Bear

Each scenario must describe conditions, not price targets.

- **BULL:** what must accelerate or remain scarce?
- **BASE:** what happens if current demand continues but expectations normalize?
- **BEAR:** what breaks first — order growth, price, capacity utilization, margin, timing, or valuation?

### 9. ACTION — JoyLab Checklist

Always close the analytical body with the four-step JoyLab framework:

- **FACT** — which official number/event to verify
- **INTERPRETATION** — what structural meaning to test
- **SCENARIO** — what condition would change the base case
- **ACTION** — what to re-check next quarter or next catalyst

### 10. Conclusion

Write 2–4 short paragraphs.

The conclusion should answer:
1. What is the company’s real exposure?
2. What is the strongest evidence?
3. What is the key risk or re-check condition?
4. What article/guide should the reader open next?

### Sources

Preferred source order:
1. Company IR / earnings presentation
2. DART / regulatory filing
3. Official contract or project announcement
4. Official plant/capacity announcement
5. Market data for valuation, with reference date stated

Do not use secondary news as the sole source for a critical operating number when a primary source exists.

## Frontmatter Standard

Use the existing Astro content schema. Required working pattern:

```yaml
---
title: "[Company] [theme] analysis title"
description: "One-sentence description covering value chain, orders, capacity, margin, and valuation."
category: "투자·경제"
tags:
  - [theme]
  - [company]
  - [product]
  - [region/customer]
  - [industry]
publishedAt: YYYY-MM-DD
author: "JoyLab"
featured: false
draft: false
seoTitle: "[Company] [theme] analysis｜[2–3 key variables]"
series: "[cluster name]"
readingTime: "약 10분"
---
```

## Writing Rules

- Prefer primary-source facts and precise dates.
- Distinguish facts from interpretation.
- Avoid theme-only language such as “beneficiary” without showing order/revenue/margin transmission.
- Use `**bold**` only for a genuinely important number or judgment; avoid over-highlighting.
- Keep headings stable so TOC, related research, and future automation stay predictable.
- Use internal links to the Pillar/Guide, adjacent company articles, and compare hub.
- Do not change URLs, canonical behavior, sitemap logic, or Research Article V2 layout for individual companies.

## Compare Hub Extension

A multi-company comparison article should use the same logic but normalize companies into one table or scorecard.

Recommended comparison lenses:
1. Value Chain Position
2. Theme/AI Directness
3. Order Quality
4. Capacity & Lead Time
5. Margin Quality
6. Valuation & Risk

A comparison table is a decision map, not a buy ranking.

## Gold Gate — Company Research

A company article is Gold only when all of the following are true:

### Research
- latest material numbers are checked against IR/DART/official releases
- valuation has a stated reference date
- backlog and order quality are separated
- consolidated vs segment economics are separated where relevant
- Bull/Base/Bear conditions are explicit
- next-quarter Action checkpoints are explicit

### Editorial
- follows the canonical sequence unless deviation is justified
- Fact and Interpretation are distinguishable
- title and description work on mobile without relying on manual line breaks
- related Guide/Pillar and adjacent research are linked

### Design System V2
- Research Cover uses the existing Research Article V2 system
- desktop sticky TOC works
- mobile uses the BaseLayout hamburger
- no horizontal overflow at 390px
- long company names, descriptions, tags, and tables wrap safely
- contextual START HERE points to the relevant Pillar/Guide

### Engineering / SEO
- content schema passes
- Astro build passes
- dependency audit passes
- canonical and structured data remain intact
- production smoke test passes after merge

## Definition of Done

Company Research Template V1 is established when:
- this standard exists in the repository
- a copy-ready template exists under `docs/templates/`
- future company research PRs state whether they comply with Company Research Template V1
- V2 Design System compliance remains part of the Gold Gate

The existing AI Power company articles — Doosan Enerbility, Hyosung Heavy Industries, HD Hyundai Electric, LS ELECTRIC, and the four-company compare hub — are the first Gold reference set for this template.

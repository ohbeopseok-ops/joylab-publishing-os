# JoyLab Compare Hub Template V1

Status: Gold Standard
Scope: multi-company comparison research hubs
Applies to: semiconductor, AI power, shipbuilding, finance, AI software and future company comparison clusters

## Purpose

Compare Hub Template V1 turns a group of Company Research V1 articles into one normalized decision map. A Compare Hub is not a ranking list and not a price-target article. It exists to answer a narrower question:

**When several companies benefit from the same structural theme, which variables actually make their investment cases different?**

The canonical sequence is:

**Value Chain → Theme Exposure → Demand Visibility → Capacity → Margin → Competitive Edge → Valuation → Scenario → Action**

The same lenses must be applied to every company in the comparison. Company-specific exceptions are allowed only when the business model genuinely requires a different operating metric.

## Relationship to Company Research V1

Compare Hub V1 is an extension of `Company Research Template V1`.

Each compared company should ideally already have a Company Research V1 article. If it does not, the Compare Hub must still use the same source hierarchy and analytical lenses so that a future company deep dive can be created without changing the comparison logic.

Do not introduce a new metric merely because one company looks stronger on it. The comparison must remain symmetrical.

## Canonical Hub Structure

### 0. Comparison Hook

Open with one comparative decision question.

Good pattern:

> The question is not which company is “better,” but which company has the stronger exposure to the variable that matters most in the current cycle.

Requirements:
- identify the common theme
- state why the companies are comparable
- state the main structural difference
- link to the relevant Pillar/Guide and the individual Company Research articles

### 1. VALUE CHAIN POSITION

Compare where each company sits physically and economically.

Required comparison fields:
- core product/service
- upstream/downstream position
- direct vs indirect theme exposure
- breadth vs concentration of portfolio

Output preference:
- compact comparison table first
- short interpretation after the table

### 2. AI / THEME EXPOSURE

Compare how directly the structural theme reaches each company.

Check:
- direct customer/project exposure
- contracted/quantified exposure
- indirect infrastructure exposure
- exposure concentration
- execution stage: announcement / qualification / order / shipment / revenue

Rule: narrative exposure and contracted exposure must be separated.

### 3. DEMAND QUALITY / REVENUE VISIBILITY

Use the operating metric that best represents demand visibility for the sector.

Examples:
- power equipment: orders, backlog, delivery slots
- semiconductors: LTAs, customer orders, product mix, price direction
- shipbuilding: orderbook, vessel mix, delivery years, option exposure
- software: ARR, NRR, committed contracts, backlog/RPO
- banks: loan growth, NIM, fee mix, credit cost trajectory

Rule: all companies in the same Compare Hub should use the same sector-normalized demand lens.

### 4. CAPACITY & LEAD TIME

Compare who can convert demand into delivered revenue faster and with less execution risk.

Check:
- current capacity
- expansion timing
- utilization / ramp-up
- yield or productivity constraints
- critical component bottlenecks
- delivery or qualification lead time

Rule: more CAPEX is not automatically better. Explain whether capacity can be absorbed without damaging price or margin.

### 5. MARGIN TRANSMISSION

Compare how efficiently demand becomes profit and cash flow.

Check:
- revenue growth
- operating margin
- product/region/customer mix
- pricing power
- fixed-cost leverage
- recurring/service revenue
- FCF conversion

Rule: normalize consolidated vs segment economics before comparing.

### 6. COMPETITIVE EDGE

Compare durable strengths and the main weakness that could invalidate the thesis.

Recommended fields:
- technology / product performance
- certifications / installed base / references
- local production / service footprint
- customer lock-in / switching cost
- supply stability / delivery slots
- balance-sheet or capital-allocation flexibility

Output preference:
- concise strengths/risks table
- no long SWOT narrative

### 7. VALUATION & RISK

Compare expectations already priced in.

Minimum requirements:
- one common valuation reference date
- same valuation basis where meaningful
- explicit explanation when PER/PBR/EV metrics are not directly comparable
- identify which operational variable must improve for each company to justify its premium

Rule: never create a cheap-to-expensive ranking from one multiple alone.

### 8. COMPARE SCORECARD

Summarize the prior sections into a decision scorecard.

Recommended lenses:
1. Value Chain Directness
2. Theme Exposure
3. Demand Visibility
4. Capacity / Execution
5. Margin Quality
6. Competitive Edge
7. Valuation Risk

Scoring rules:
- use 1–5 or descriptive labels consistently
- every score requires a visible evidence sentence
- avoid false precision
- total score is optional
- if a total exists, label it as a navigation aid, not an investment recommendation

### 9. Bull / Base / Bear

Write sector-level scenarios first, then explain relative winners/losers under each condition.

- **BULL:** what common bottleneck or demand variable accelerates?
- **BASE:** what continues but normalizes?
- **BEAR:** what common assumption breaks first?

For each scenario, explain which company is most sensitive and why.

### 10. ACTION — JoyLab Checklist

Close with the four-step JoyLab framework.

- **FACT** — common official indicators to verify
- **INTERPRETATION** — what difference between companies matters structurally
- **SCENARIO** — what condition changes relative preference
- **ACTION** — what to re-check at the next earnings/catalyst

### 11. Conclusion

Answer four questions:
1. Which company has the most direct exposure?
2. Which company has the strongest demand visibility/execution evidence?
3. Which company carries the largest valuation or cycle risk?
4. What should the reader open next?

## Comparison Table Rules

Tables must help readers compare faster, not compress entire articles.

Use tables for:
- value-chain position
- demand visibility
- capacity
- margin
- competitive edge
- valuation reference metrics

Avoid:
- paragraphs inside cells
- mixing periods between companies without labels
- comparing consolidated data for one company with segment data for another
- unexplained scores

Mobile rules:
- table may horizontally scroll if needed
- key columns should remain readable at 390px
- use short labels and compact evidence
- do not shrink text to preserve a desktop-width table

## Source Rules

Preferred source order:
1. Company IR / earnings presentation
2. DART / regulatory filing
3. Official order / project / capacity announcement
4. Official shareholder-return or capital-allocation announcement
5. Market data for valuation, with one shared reference date

Every critical comparison number should use comparable periods. If periods differ, mark the date beside each number.

## Frontmatter Standard

```yaml
---
title: "[Theme] [N]사 비교｜[Company A]·[Company B]·[Company C]"
description: "[Theme] 대표 기업을 value chain, demand visibility, capacity, margin, competitive edge, valuation 기준으로 비교합니다."
category: "투자·경제"
tags:
  - [theme]
  - [company A]
  - [company B]
  - [company C]
  - 비교
publishedAt: YYYY-MM-DD
updatedAt: YYYY-MM-DD
author: "JoyLab"
featured: false
draft: false
seoTitle: "[Theme] [N]사 비교｜[2–3 decision variables]"
series: "[cluster name]"
readingTime: "약 12분"
---
```

## Writing Rules

- Compare the same variable across all companies before moving to the next variable.
- Prefer primary-source facts and exact dates.
- Separate fact, interpretation, scenario and action.
- Use one common valuation reference date.
- Use `**bold**` sparingly; avoid emphasis immediately followed by Korean particles when the renderer can expose literal Markdown markers.
- Keep headings stable for TOC and future automation.
- Link every company name to its Company Research V1 article when available.
- Link the relevant Pillar/Guide in the intro and START HERE context.
- Preserve existing URL/canonical/sitemap/Research Article V2 behavior when rebuilding an existing Compare Hub.

## Gold Gate — Compare Hub

A Compare Hub is Gold only when all of the following are true.

### Research
- all companies use comparable periods and definitions
- critical numbers are checked against IR/DART/official releases
- one common valuation reference date is stated
- demand visibility lens is sector-normalized
- consolidated vs segment metrics are normalized
- every scorecard judgment has evidence
- Bull/Base/Bear explains relative sensitivity, not only sector direction

### Editorial
- same lens is applied to every company
- no company receives a custom favorable metric without justification
- facts and interpretation are distinguishable
- individual Company Research V1 links are present
- conclusion answers relative positioning rather than naming a universal winner

### Design System V2
- Research Article V2 cover/layout is preserved
- desktop sticky TOC works
- comparison tables are scannable
- mobile uses BaseLayout hamburger
- no horizontal page overflow at 390px
- table overflow, long company names and tags are handled safely
- contextual START HERE points to the relevant Pillar/Guide

### Engineering / SEO
- content schema passes
- Astro build passes
- dependency audit passes
- canonical and structured data remain intact
- sitemap/RSS behavior remains intact
- production smoke test passes after merge

## Definition of Done

Compare Hub Template V1 is established when:
- this standard exists in the repository
- a copy-ready template exists under `docs/templates/`
- future Compare Hub PRs state whether they comply with Compare Hub Template V1
- V2 Design System compliance remains part of the Gold Gate
- at least one semiconductor and one AI power comparison article act as reference implementations

Gold references:
- `/articles/samsung-vs-sk-hynix-ai-memory`
- `/articles/korea-ai-power-companies-compare`

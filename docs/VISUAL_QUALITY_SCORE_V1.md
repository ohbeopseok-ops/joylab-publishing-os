# JoyLab Visual Quality Score V1

Status: Active candidate  
Parent:
- `docs/JOYLAB_DESIGN_SYSTEM_V3.md`
- `docs/ANTI_AI_SLOP_CONTRACT_V1.md`

Executable gate:
- `scripts/qa-visual-quality-score-v1.mjs`

## Purpose

Provide one inspectable 100-point visual quality score across JoyLab public page families without replacing page-specific GOLD contracts.

The score is evidence, not a substitute for:
- Build
- Responsive Visual Gate V2
- Mobile UI / Books / Article GOLD QA
- Release Gate / Production Smoke

## Score /100

Each category is worth 10 points.

1. Purpose clarity
2. Information hierarchy
3. Brand fit
4. Distinctive composition
5. Typography / readability
6. Evidence / content-integrity presentation
7. Interaction clarity
8. Responsive / mobile quality
9. Accessibility cues
10. Anti-Slop compliance

## Verdict

- 90–100: GOLD
- 80–89: PASS
- 70–79: REWORK
- 0–69: BLOCK

Hard override:
- any Critical failure = BLOCK regardless of score

## Critical failures

- horizontal overflow > 1px
- missing or duplicated primary H1
- critical page-family signature missing
- core interaction has no accessible text/label
- page returns non-2xx/3xx success
- primary content is visually unavailable

## Representative family routes

### Homepage
`/`

Expected signature:
- `.home-hero`
- `.home-pillars`
- `.home-guide`

### Research Article
`/articles/semiconductor-giant-shoulder-flow`

Expected signature:
- `.research-cover`
- `.research-layout`
- `#article-content`

### Guide
`/guides/semiconductor-investing`

Expected signature:
- `.sg-hero`
- `.sg-main`
- JoyLab Method / Fact → Interpretation → Scenario → Action

### Books
`/books`

Expected signature:
- `.books-v2-launch-hero`
- `.books-v2-library`

## Family-specific Anti-Slop Audit

### Research Article
Allowed:
- repeated research modules when they encode real structure
- evidence/citation/Trust blocks
- compact thesis modules

Watch:
- repeated generic Key Takeaways that become boilerplate
- decorative charts without data/source
- too many boxed surfaces between prose
- meaningless 01/02/03 numbering

### Guide
Allowed:
- numbered sequence when order is semantic
- route/map cards that represent real learning paths

Watch:
- every section rendered as the same card
- gradient-heavy hero variations per Guide
- CORE / SPECIALIST badges that do not change navigation
- repeated hover-lift on every tile

### Books
Allowed:
- cover-led editorial composition
- distinct reading/preview CTAs
- shelf/library repetition because it represents a real collection

Watch:
- storefront-template look
- excessive pills/badges
- generic promotional hero
- cover art used as decoration instead of the primary product identity

## Release interpretation

Visual Quality Score is considered healthy when:
- all representative routes score >= 80
- no Critical findings
- family average >= 85
- existing page-family GOLD checks remain GREEN

A score below 80 is not fixed by lowering thresholds.

# Article Detail + Archive GOLD Cases V1

## Purpose
Lock two critical JoyLab reading/discovery surfaces behind deterministic browser QA after Homepage V2.1.1.

## GOLD Case A — Article Detail
Representative URL: `/articles/china-us-treasury-holdings-2026`

Why this page:
- published research article
- dedicated Hero image
- research layout and body content
- representative of JoyLab's long-form research experience

### Viewports
- 390 × 844
- 1366 × 900

### PASS criteria
- HTTP 2xx/3xx
- no horizontal overflow
- all images complete and naturalWidth > 0 after lazy-load traversal
- no browser page/console errors
- article H1 exists
- `.research-cover`, `.research-layout`, `.research-v2-content`, `.research-brief` are visible
- Hero image renders successfully
- full-page screenshot retained

## GOLD Case B — Archive
Surface: `/#archive`

### Viewports
- 390 × 844
- 1366 × 900

### Interaction contract
1. Confirm initial article count is greater than zero.
2. Search `Aside`; result count must narrow but remain non-zero.
3. Clear filters.
4. Select `AI·생산성`; every visible card must have `data-category="AI·생산성"`.
5. Clear filters; initial result count must return.
6. If `콘텐츠 더 보기` is visible, clicking it must increase visible cards or hide the button when exhausted.

### PASS criteria
- interaction contract passes
- no horizontal overflow
- no broken/incomplete images after lazy-load traversal
- no browser page/console errors
- full-page screenshot retained

## CI artifacts
Build uploads:
- `homepage-gold-qa`
- `article-archive-gold-qa`

The Article/Archive artifact contains four screenshots plus `report.json`.

## Promotion rule
A PR that changes the reading/discovery surfaces is not GOLD-ready unless all existing build gates plus Homepage QA and Article/Archive GOLD QA pass.

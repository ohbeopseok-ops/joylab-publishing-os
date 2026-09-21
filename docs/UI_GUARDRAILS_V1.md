# UI Guardrails V1

Status: Active

UI Guardrails V1 turns JOYLAB Design System V3 from documentation into enforceable CI contracts.

## Design Drift Gate — 15 rules

1. V3 design-system document exists.
2. BaseLayout imports the canonical mobile layer.
3. Canonical mobile breakpoint remains 640px.
4. Mobile header remains 68px.
5. Hamburger remains 44×44px minimum.
6. Mobile navigation remains fullscreen below the header.
7. Menu-open body scroll locking remains enabled.
8. Current location uses aria-current and active styling.
9. Shared mobile touch token remains at least 48px.
10. Contact form control token remains at least 48px and is wired into controls.
11. Mobile form text remains at least 16px.
12. Footer link target remains at least 44px and tokenized.
13. Mobile book covers remain object-fit: contain.
14. Books Reader controls retain at least 44px targets.
15. Books Reader keeps noindex + canonical SEO contract.

Source: `scripts/check-design-drift.mjs`

## GOLD Screen Registry V1

The registry fixes ten representative screens as the minimum visual regression surface:

- Home desktop/mobile
- Research Article desktop/mobile
- Books desktop/mobile
- About desktop/mobile
- Contact desktop/mobile

Each registered screen must return a healthy HTTP status, preserve the global header, show its H1, avoid horizontal overflow, and generate a CI screenshot artifact.

Registry: `docs/qa/GOLD_SCREEN_REGISTRY_V1.json`  
Runner: `scripts/qa-gold-screen-registry.mjs`

This is a structural visual-regression gate. Pixel-diff baselines may be added later without changing the registry contract.

## Reader V2 dependency guard

Current external runtime dependency groups:

1. Tailwind CDN
2. Pretendard via jsDelivr
3. Google Fonts
4. Phosphor Icons via unpkg

V2 target: **0 external runtime dependency groups**.

Until the dedicated Reader V2 migration PR, CI enforces:

- no new external hosts,
- no increase above the four current dependency groups,
- explicit approved-host list.

Runner: `scripts/check-reader-dependencies.mjs`

## Definition of Done

UI Guardrails V1 is healthy when:

- Design Drift Gate is 15/15 PASS,
- GOLD Screen Registry is 10/10 PASS,
- Reader dependency audit reports <=4 current groups and no unknown hosts,
- existing Build / mobile / article / books QA remain green.

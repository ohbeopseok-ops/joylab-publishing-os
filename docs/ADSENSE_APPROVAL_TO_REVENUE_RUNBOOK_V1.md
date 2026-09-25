# JoyLab AdSense Approval-to-Revenue Runbook V1

## Goal
Move from AdSense site approval to a controlled monetization rollout without degrading JoyLab research credibility, mobile usability, or analytics quality.

## Phase 0 — Approval gate
Start only when:
- AdSense Sites shows `aijoylab.kr = Ready / 준비됨`;
- ads.txt is Authorized;
- Production Release Gate is GOLD;
- AdSense Policy Audit has HOLD = 0;
- Privacy / Terms / Advertising Disclosure remain consistent with implementation.

Do not turn on ad slots before these conditions are met.

## Phase 1 — CMP and privacy
1. AdSense → Privacy & messaging.
2. Open European regulations.
3. Configure a Google-certified CMP for `aijoylab.kr`.
4. Ensure consent/refusal and change/revoke choices are available as required by the selected Google flow.
5. Verify the same AdSense publisher identity is used.
6. Confirm JoyLab privacy notice accurately describes AdSense, consent, analytics, and external services.
7. Test the consent flow before enabling broad ad delivery.

Acceptance:
- no consent UI blocks navigation;
- no content becomes unreadable;
- no ad request that requires consent is fired before the applicable consent state permits it.

## Phase 2 — Create real ad units
Create separate ad units so performance can be measured by placement.

Recommended unit names:
- `joylab_article_mid30`
- `joylab_article_mid65`
- `joylab_article_end`
- `joylab_archive_infeed`

Record only the actual AdSense slot IDs in `src/config/adPlacement.ts`.
Never invent slot IDs.

Before enabling a placement, confirm it is actually mounted in the target page/layout:
- `article-end` is pre-wired in the article template and remains dormant until approval + slot ID + global enable.
- `article-mid30`, `article-mid65`, and `archive-in-feed` are contract-defined but must be integrated and QA-tested in a separate placement change before they can be enabled.
- A configured slot ID without a mounted `<AdSlot>` is not considered release-ready.

Keep:
- anchor/sticky ads OFF initially;
- vignette/interstitial-style auto formats OFF initially;
- Hero and CTA zones excluded.

## Phase 3 — Limited rollout
Rollout order:
1. article-end only (already pre-wired);
2. integrate + QA article-mid65, then enable article-mid65 + article-end;
3. integrate + QA article-mid30, then enable article-mid30 + article-mid65 + article-end;
4. integrate + QA optional archive in-feed after at least six organic cards.

Do not activate all slots in one release.

Each stage must pass:
- 390px mobile;
- 430px mobile;
- 820px tablet;
- 1440px desktop;
- no horizontal overflow;
- no broken CTA/navigation;
- no ad/interactive-control ambiguity.

## Phase 4 — UX guardrails
Hard exclusions:
- Hero and title-adjacent zone;
- Research Brief;
- Key Takeaways;
- tables/charts;
- scorecards and sliders;
- investment scenario controls;
- Book CTA;
- Contact CTA;
- next/previous navigation;
- menu/search.

Initial UX acceptance targets:
- no visible layout jump that obscures reading;
- no ad touching a primary CTA or interactive control;
- no mobile sticky ad during initial test;
- article body remains the dominant visual element.

If any condition fails, disable the newest slot first.

## Phase 5 — Revenue and quality measurement
Measure by placement, not only site total.

Track:
- page RPM;
- ad impressions;
- viewability;
- CTR as a safety signal, not a target to maximize;
- pages/session;
- engaged reading depth;
- CTA conversion;
- bounce/exit changes;
- Core Web Vitals / CLS;
- mobile complaint or accidental-click signals.

Decision window:
- minimum 7 days for first directional review;
- prefer 14–28 days before materially expanding density unless traffic is too low for stable comparison.

## Phase 6 — Expansion rule
Expand only when:
- Production GOLD remains green;
- no policy warning appears;
- CMP works;
- content engagement does not materially deteriorate;
- ad density does not dominate the research;
- no suspicious CTR spike or accidental-click pattern appears.

If engagement falls after a new slot:
1. remove the latest slot;
2. compare 7-day pre/post metrics;
3. retest with larger spacing or later placement;
4. do not compensate by adding more ads elsewhere.

## Phase 7 — Rollback
Immediate rollback triggers:
- AdSense policy warning;
- consent flow failure;
- navigation obstruction;
- mobile overflow;
- ad overlapping a table, chart, scorecard, CTA, or menu;
- unexplained CTR spike;
- significant CLS regression.

Rollback action:
- set `AD_PLACEMENT.enabled=false` for global stop, or clear only the affected slot ID;
- deploy;
- rerun Production GOLD QA;
- record the incident in release notes.

## Ownership
- AdSense identity: `src/config/siteIdentity.ts`
- Ad placement contract: `src/config/adPlacement.ts`
- Responsive component: `src/components/AdSlot.astro`
- Policy audit: `scripts/audit-adsense-policy-v1.mjs`
- Placement rules: `docs/ADSENSE_AD_PLACEMENT_CONTRACT_V1.md`
- Activation checklist: `docs/ADSENSE_ACTIVATION_GOLD_CHECKLIST.md`

## Final activation sequence
`Approval → CMP → real slot IDs → article-end pilot → GOLD QA → 7-day review → mid65 pilot → GOLD QA → revenue/UX review → controlled expansion`

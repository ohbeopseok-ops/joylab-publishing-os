# JoyLab Ad Placement Contract V1

## Release state
- Ads are **disabled by default**.
- Do not set `AD_PLACEMENT.enabled=true` until AdSense shows `aijoylab.kr = 준비됨/Ready`, CMP requirements are satisfied, and real ad-unit slot IDs exist.
- Never invent or reuse unrelated AdSense slot IDs.

## Article placements

### Desktop
1. **article-mid-30** — around 30–35% of long-form body.
2. **article-mid-65** — around 60–70% of long-form body.
3. **article-end** — after article body, before related-content/primary CTA flow.

### Mobile
1. **article-mid-30** — first eligible break after roughly 30%.
2. **article-mid-65** — second eligible break after roughly 65%.
3. **article-end** — after body.
4. Sticky/anchor advertising stays OFF for initial rollout.

## Hard exclusions
Do not place ads:
- in Hero or immediately below the title;
- inside Research Brief or Key Takeaways;
- directly adjacent to tables, charts, scorecards or interactive controls;
- next to Buy/Sell scenario controls or investment scorecards;
- around Contact CTA, Books CTA, next/previous navigation, menu or search controls.

## Archive
- Optional `archive-in-feed` only after at least six organic cards.
- It must be visually labelled and must not mimic a research card.

## Activation sequence
1. AdSense site status Ready.
2. ads.txt Authorized.
3. Privacy & Messaging / CMP complete where required.
4. Create real ad units in AdSense and record their slot IDs.
5. Populate slot IDs in `src/config/adPlacement.ts`.
6. Enable one placement at a time.
7. Run 390 / 430 / 820 / 1440 Production GOLD QA.
8. Verify CLS, accidental-click risk, readability and CTA separation.
9. Expand only after metrics remain healthy.

# JoyLab Monetization Layout Contract V2

## Scope

One common monetization layout contract for **Article · Guide · Books · Archive**.

Archive remains inactive until a real `archive-in-feed` slot ID is configured and the placement is inserted after at least six organic research cards. V2 defines its activation rule now so it cannot bypass the same layout constraints later.

## Hard rules

### Filled ad

- Outer spacing above: **32–48px**
- Outer spacing below: **32–48px**
- Responsive slot max width: **970px**
- Parent/content-column width overrun: **0px**
- Horizontal page overflow: **0px**
- CLS: **≤ 0.10**

### Unfilled ad

- Reserved outer height: **≤ 48px**
- Preferred behavior: collapse completely with `display:none`
- It must not create a visually dominant blank section between organic content blocks.

## CI matrix

The common gate runs at:

- 390px
- 1280px
- 1440px

for deterministic:

- filled
- unfilled

states.

Active regression targets:

1. Article · `/articles/samsung-vs-sk-hynix-ai-memory` · `article-end`
2. Guide · `/guides/ai-productivity` · `guide-end`
3. Books · `/books/ax-customer-center` · `book-end`

## Production GOLD measurement

After Cloudflare deploy, Production Smoke records the real deployed DOM/CSS geometry for:

`Author → book-end Ad → Research Graph`

at 390 / 1280 / 1440.

The artifact must retain:

- `authorToAdPx`
- `adToGraphPx`
- `adMarginTopPx`
- `adMarginBottomPx`
- `adWidthPx`
- `adHeightPx`
- `pageOverflowPx`

plus full-page screenshots for all three viewports.

The production measurement uses a deterministic synthetic filled state while loading the **actual deployed page**, so AdSense fill-rate variance or headless ad blocking cannot make the geometry test flaky.

## GOLD rule

`JoyLab Monetization Layout Contract V2 · GOLD` requires:

1. PR common layout gate GREEN.
2. Existing Books Visual QA and mobile monetization-order gates GREEN.
3. Cloudflare deploy GREEN.
4. Production 390 / 1280 / 1440 measurement GREEN.
5. No regression in max-width, overflow, spacing, or CLS gates.


## Vertical Density KPI

Production GOLD records page-height impact with the same deployed page rendered in deterministic unfilled and filled states.

Required fields:

- `pageHeightUnfilledPx`
- `pageHeightFilledPx`
- `pageHeightDeltaPx`
- `pageHeightDeltaPct`

This is initially an observational KPI, not a release blocker. The blocking gates remain spacing, overflow, width and CLS. A hard density threshold should be introduced only after enough production samples establish a stable baseline.

## Guide production spacing

`/guides/ai-productivity` is a dedicated production regression target at:

- 390px
- 1440px

The report records:

- `contentToAdPx`
- `adToFooterPx`
- `adMarginTopPx`
- `adMarginBottomPx`
- page height filled/unfilled KPI

The same 32–48px ad margin contract applies.

## Archive In-feed Activation Gate

The Research archive is prewired for `archive-in-feed`, but the real ad remains inactive while the slot ID is empty.

Activation rules:

1. Exactly six organic article cards must precede the in-feed ad shell.
2. The ad is inserted between `articles.slice(0, archiveMinCards)` and `articles.slice(archiveMinCards)`.
3. `archiveMinCards` must come from `AD_PLACEMENT.slots.archiveInFeed.minCardsBefore`.
4. With an empty slot ID, no actual ad unit may render.
5. Once a real slot ID is configured, the unit must render only at that pre-approved position.

CI enforces both the source contract and the runtime DOM order.

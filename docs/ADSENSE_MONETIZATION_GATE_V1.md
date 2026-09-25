# JoyLab AdSense Monetization Gate V1

## Why this gate exists

The biggest unknown after AdSense approval is not whether the code works. It is the **observed JoyLab effective page RPM after real traffic begins**.

RPM matters for revenue planning, but it must not be the first expansion criterion. The first 7-day pilot should protect UX and policy compliance before optimizing revenue.

## Decision order

1. **Policy / consent / layout safety**
2. **UX stability**
3. **Minimum evidence volume**
4. **Revenue quality**
5. **Expansion**

Revenue alone can never override a hard stop.

## Hard stop conditions

Immediate rollback of the newest placement if any of these occur:

- AdSense policy warning
- consent/CMP failure
- ad overlapping content or controls
- horizontal overflow
- navigation obstruction

## UX stop thresholds

These are **JoyLab internal operating thresholds**, not Google policy limits.

- CLS p75 > 0.10
- CLS increase vs pre-ad baseline > 0.03
- reading depth drop > 10%
- CTA conversion drop > 15%
- exit rate increase > 15%
- pages/session drop > 10%
- CTR > 5% or > 3× baseline: treat as an accidental-click/safety investigation signal

## Evidence minimum

Do not advance a placement before both are satisfied:

- at least 7 calendar days
- at least 2,000 ad impressions

If evidence is below the minimum and no hard/UX stop is present, decision = `COLLECT`.

## Decisions

### ROLLBACK
Disable the newest placement. Re-run Production GOLD QA and investigate.

### COLLECT
Keep the current placement only. Do not add another slot yet.

### ADVANCE
Current placement may remain active. The next slot can enter a **separate integration + QA change**. ADVANCE does not auto-enable another ad.

## Stage sequence

`article-end → article-mid65 → article-mid30`

`archive-in-feed` remains optional and separate.

## Required snapshot

Copy:

`ops/adsense/monetization-snapshot.example.json`

to:

`ops/adsense/monetization-snapshot.json`

and populate only observed production data.

## Run

Local:

`node scripts/evaluate-adsense-monetization-v1.mjs`

GitHub:

Actions → **AdSense Monetization Gate V1** → Run workflow

## Interpretation

The revenue model should be updated with observed JoyLab RPM after approval. Until then, the existing KRW 500 / 1,500 / 3,000 RPM table remains a sensitivity model only.

For the first 7-day pilot, the preferred stopping order is:

`Policy/Consent → Layout → CLS → Reading Depth → CTA Conversion → Exit/Session → CTR anomaly → Revenue`

This keeps the research experience and accidental-click safety ahead of short-term monetization.

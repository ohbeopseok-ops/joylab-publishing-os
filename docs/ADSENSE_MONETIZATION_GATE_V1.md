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

`Policy/Consent → Layout → CLS → Reading Depth → CTA Conversion → Exit → CTR anomaly → Revenue`

This keeps the research experience and accidental-click safety ahead of short-term monetization.


## Live automation setup after approval

Keep the scheduled workflow disabled until AdSense shows `aijoylab.kr = READY`.

Repository variable:
- `ADSENSE_MONETIZATION_ENABLED=true` — turns on the daily 09:30 KST scheduled evaluation.
- optional `ADSENSE_ACCOUNT_RESOURCE=accounts/...` — only needed when the OAuth identity can access more than one active AdSense account.

GitHub Actions secrets:
- `ADSENSE_OAUTH_CLIENT_ID`
- `ADSENSE_OAUTH_CLIENT_SECRET`
- `ADSENSE_OAUTH_REFRESH_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ANALYTICS_READ_TOKEN`

The AdSense adapter requests read/report access only and filters reporting to:
- owned site: `aijoylab.kr`
- article URLs containing `aijoylab.kr/articles/`

It collects:
- page views
- ad impressions
- estimated earnings
- page RPM
- Active View viewability
- ad request coverage
- page-view CTR
- site state and site-specific policy issues

The Cloudflare adapter compares the most recent seven completed days against the preceding seven completed days.

JoyLab article UX definitions:
- Reading Depth = percentage of article views reaching at least 50% scroll depth.
- Read 90 = percentage reaching 90% depth, retained as supporting evidence.
- CTA Conversion = article contact CTA clicks / article views.
- Early Exit = exit before 25% scroll depth and before 30 visible seconds / article views.
- CLS p75 = weighted 75th percentile of client-reported layout-shift values.

Privacy:
- no user identifier, session ID, email, account ID, or precise location is written to `joylab_events_v1`;
- Global Privacy Control and Do Not Track opt-outs continue to bypass client analytics;
- synthetic Production QA continues to intercept the analytics endpoint so QA traffic is not counted.

## Dashboard

The workflow uploads:

`qa-artifacts/adsense-monetization-gate-v1/dashboard/index.html`

The dashboard intentionally emphasizes one decision:

- `ADVANCE`
- `COLLECT`
- `ROLLBACK`

Supporting evidence remains in the workflow artifact JSON rather than turning the dashboard into a dense analytics console.

# JoyLab AdSense Monetization Automation Setup V1

## Purpose
After AdSense approves `aijoylab.kr`, this automation combines Google AdSense Management API v2 performance data with JoyLab Cloudflare Analytics Engine UX data and produces a single Monetization Gate decision.

## AdSense API
Enable **AdSense Management API** in Google Cloud and authorize with the read-only scope:

`https://www.googleapis.com/auth/adsense.readonly`

GitHub Actions secrets:
- `ADSENSE_OAUTH_CLIENT_ID`
- `ADSENSE_OAUTH_CLIENT_SECRET`
- `ADSENSE_OAUTH_REFRESH_TOKEN`

Optional repository variable:
- `ADSENSE_ACCOUNT_RESOURCE` — example `accounts/pub-xxxxxxxxxxxxxxxx`

If omitted, the adapter lists active accounts and uses the account automatically only when exactly one active account is accessible.

The live adapter collects article-level:
- Page Views
- Impressions
- Estimated Earnings
- Page RPM
- Active View viewability
- Ad request coverage
- Page-view CTR
- site state
- site-specific policy issues

## Cloudflare Analytics Engine
Required GitHub Actions secrets:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ANALYTICS_READ_TOKEN`

Dataset:
`joylab_events_v1`

Automated UX metrics:
- Reading Depth = `article_read_50 / article_view`
- Deep Read = `article_read_90 / article_view`
- CTA Conversion = `article_contact_click / article_view`
- Early Exit = `article_exit:early_exit / article_view`
- CLS p75 = weighted p75 from `article_cls`

The most recent 7 completed days are compared with the preceding 7 completed days.

## Enable schedule
Do not enable the schedule before:
1. AdSense site status is Ready.
2. CMP is configured where required.
3. The real `article-end` ad unit is live.
4. Production GOLD remains green.

Then set repository variable:

`ADSENSE_MONETIZATION_ENABLED=true`

The scheduled workflow runs daily at 09:30 KST.

## Workflow
GitHub Actions → **AdSense Monetization Gate V1**

Modes:
- `live`: fetch AdSense + Cloudflare, compose snapshot, evaluate, render dashboard.
- `snapshot`: evaluate an existing repository JSON without external API calls.

## Artifact
`adsense-monetization-gate-v1`

Contains:
- `adsense.json`
- `cloudflare-ux.json`
- `snapshot.json`
- `result.json`
- `dashboard/index.html`
- `dashboard/decision.txt`
- `dashboard/summary.json`

The dashboard intentionally shows only:
- ADVANCE
- COLLECT
- ROLLBACK

No workflow automatically enables the next ad slot.

# JoyLab AdSense Monetization Automation Setup V1

## Purpose
After AdSense approves `aijoylab.kr`, this automation combines:
- Google AdSense Management API v2 revenue/performance data;
- JoyLab Cloudflare Analytics Engine reading/CTA/exit/CLS data;
- AdSense policy issue status;
- Monetization Gate V1 decision logic;
- a one-screen ADVANCE / COLLECT / ROLLBACK dashboard.

## Google AdSense API setup
Enable **AdSense Management API** in the Google Cloud project used for JoyLab automation.

Use OAuth with the read-only scope:
`https://www.googleapis.com/auth/adsense.readonly`

The live workflow supports either a short-lived access token for manual testing or a refresh-token setup for scheduled runs.

GitHub Actions secrets:
- `ADSENSE_OAUTH_CLIENT_ID`
- `ADSENSE_OAUTH_CLIENT_SECRET`
- `ADSENSE_OAUTH_REFRESH_TOKEN`

Optional repository variable:
- `ADSENSE_ACCOUNT_RESOURCE` — example: `accounts/pub-xxxxxxxxxxxxxxxx`

If the variable is omitted, the adapter calls the AdSense accounts list endpoint and accepts the account automatically only when exactly one active account is available.

## Cloudflare setup
The repository already writes JoyLab events into Analytics Engine dataset:
`joylab_events_v1`

Required GitHub Actions secrets:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ANALYTICS_READ_TOKEN`

The adapter calculates:
- Reading Depth = `article_read_50 / article_view`
- Deep Read = `article_read_90 / article_view`
- CTA Conversion = `article_contact_click / article_view`
- Early Exit Rate = `article_exit:early_exit / article_view`
- CLS p75 = weighted percentile from `article_cls`

The previous equal-length window is used as the UX baseline.

## Enable scheduled automation
Do not enable the daily schedule before AdSense approval and the first live article-end ad unit.

Repository variable:
`ADSENSE_MONETIZATION_ENABLED=true`

The workflow schedule runs once per day. Before that variable is true, scheduled runs are skipped. Manual workflow dispatch remains available for testing.

## Workflow
GitHub Actions → **AdSense Monetization Gate V1**

Modes:
- `live`: fetch AdSense + Cloudflare, compose the snapshot, evaluate, render dashboard.
- `snapshot`: evaluate a supplied repository JSON without calling external APIs.

## Output
Artifact:
`adsense-monetization-gate-v1`

Contains:
- `adsense.json`
- `cloudflare-ux.json`
- `snapshot.json`
- `result.json`
- `dashboard/index.html`
- `dashboard/decision.txt`
- `dashboard/summary.json`

## Safety
The workflow never enables or moves an ad slot automatically. An `ADVANCE` result only means the next placement is eligible for a separate code integration and Production GOLD QA.

A `ROLLBACK` result fails the workflow so it cannot be mistaken for a green monetization state.

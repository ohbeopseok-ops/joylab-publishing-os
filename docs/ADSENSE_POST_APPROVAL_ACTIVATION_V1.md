# JoyLab AdSense Post-Approval Activation V1

## Status
AdSense site approval is complete and the real `article-end` slot is registered as `1843494813`.

Do not enable JoyLab ad placement until **all** pre-activation gates pass:
- ads.txt is Authorized;
- Production Release Gate is GOLD;
- AdSense Policy Audit has HOLD = 0;
- Privacy / Terms / Advertising Disclosure still match the implementation;
- CMP is configured and tested where required;
- Auto Ads / Auto Optimize remain OFF for the controlled pilot.

Only after these gates pass may `AD_PLACEMENT.enabled` be changed from `false` to `true`.

## Phase 1 — Google CMP
AdSense → Privacy & messaging → European regulations.

Recommended rollout:
- use Google CMP;
- keep the standard three-choice flow available: Consent / Do not consent / Manage options;
- keep commonly used ad technology providers unless there is a legal/business reason to customize;
- provide a way for users to reopen privacy choices later;
- test EEA/UK/Switzerland consent behavior before ad rollout.

## Phase 2 — Create the first ad unit
AdSense → Ads → By ad unit → Display ads.

Create:
- name: `joylab_article_end`
- size: Responsive

Registered production slot:
- `joylab_article_end`
- `data-ad-slot="1843494813"`

The slot ID is stored in `src/config/adPlacement.ts`. Do not copy another site's slot ID and do not invent an ID.

## Phase 3 — First rollout
Enable only `article-end`.

Keep OFF:
- article-mid65
- article-mid30
- archive-in-feed
- sticky/anchor ads
- vignette/interstitial formats

Run 390 / 430 / 820 / 1440 Production GOLD QA.

## Phase 4 — Monetization automation
After the real article-end ad is live:
- configure AdSense Management API read-only OAuth;
- confirm Cloudflare Analytics Engine read access;
- set repository variable `ADSENSE_MONETIZATION_ENABLED=true`.

The daily workflow evaluates the most recent 7 completed days.

## Secrets
- ADSENSE_OAUTH_CLIENT_ID
- ADSENSE_OAUTH_CLIENT_SECRET
- ADSENSE_OAUTH_REFRESH_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_ANALYTICS_READ_TOKEN

Optional variable:
- ADSENSE_ACCOUNT_RESOURCE

## Decision
The dashboard must emit exactly one:
- ADVANCE
- COLLECT
- ROLLBACK

No workflow may automatically enable the next ad slot.

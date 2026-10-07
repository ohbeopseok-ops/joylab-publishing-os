# AdSense PRE-GOLD Static Audit V1

## Purpose
GitHub Actions quota is currently exhausted, so automated Build / Mobile / AdSense / Visual evidence is deferred. This document records the static and live checks that can still be completed safely before the quota resets.

## Current release state
**PRE-GOLD / CI-DEFERRED**

Content Trust rollout is complete:
- Wave 1: 20 / 20 READY
- Wave 2: 48 / 48 READY
- Wave 3: 55 / 55 READY
- Total: 123 / 123 CONTENT READY

## Contract drift corrected
`src/config/adPlacement.ts` had `enabled: true` while the AdSense activation contract requires placements to remain disabled until the pre-activation gates pass.

It is now restored to:
`enabled: false`

The real `article-end` slot remains registered as `1843494813`; mid30, mid65, and archive in-feed remain dormant.

## Static preflight
Run locally:
`node scripts/check-adsense-pre-gold-static-v1.mjs`

The script verifies:
- publisher/client identity
- ads.txt record binding
- global ad placement remains disabled
- real article-end slot is registered
- later-stage ad slots remain empty
- Trust rollout is 123/123
- CI-DEFERRED is explicit
- Privacy / Advertising Disclosure / Terms / Contact routes exist
- ads.txt route exists

## Live public checks completed
The public site currently exposes:
- Privacy Policy
- Advertising Disclosure
- Terms
- Contact/footer legal navigation

The Privacy Policy discloses AdSense, Google processing, and CMP use where required.
The Advertising Disclosure states editorial independence and the no-ad zones around Hero, title, tables/charts, CTA, and Contact.

## Still pending
These must not be marked PASS without direct evidence:
- AdSense console: site Ready/준비됨 confirmation
- ads.txt Authorized status in AdSense
- Google-certified CMP configuration and live consent test
- Auto Ads / Auto Optimize OFF confirmation
- latest-head Build
- Mobile 390 / 430 / 820
- Responsive Visual / 1440
- AdSense Policy Audit HOLD = 0

## Activation rule
Do not set `AD_PLACEMENT.enabled=true` until all required activation gates are evidenced.

After GitHub Actions quota resets:
1. run Build / Mobile / AdSense / Visual on the exact latest HEAD;
2. verify CMP and AdSense console state;
3. enable only `article-end`;
4. run production GOLD QA;
5. expand placements only through the existing approval-to-revenue runbook.

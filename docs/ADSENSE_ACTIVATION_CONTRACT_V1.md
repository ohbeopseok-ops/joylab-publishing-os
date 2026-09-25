# JoyLab AdSense Activation Contract V1.0

## Purpose
Connect `https://aijoylab.kr` to Google AdSense without allowing approval work to degrade reading UX or editorial trust.

## Account
- Publisher ID: `pub-6938956176929357`
- Client ID: `ca-pub-6938956176929357`
- Root ads.txt: `google.com, pub-6938956176929357, DIRECT, f08c47fec0942fa0`

## Phase A — Site verification / review
- Always expose `google-adsense-account` meta tag.
- Always expose root `/ads.txt`.
- Load the official AdSense verification script in `<head>` so the AdSense code snippet check can succeed.
- Privacy, Terms, Advertising Disclosure and Contact must be publicly reachable.
- Keep Auto Ads / Anchor / Vignette disabled in the AdSense account during review.
- Do not create manual ad slots during this phase.

## Phase B — Post-approval activation
Initial placement rules:
- Article: first ad only after approximately 30–35% of body content.
- Standard research article: 1–2 ads maximum initially.
- Search-intent long article: up to 2–3 only when content length supports it.
- Do not place ads in Hero, immediately under H1/title, inside key tables/charts, beside primary CTA, or on Contact.
- Keep Auto Ads, Anchor and Vignette OFF at initial launch; enable only after separate UX review.

## Consent gate
Before serving personalized ads to EEA/UK/Switzerland traffic, configure a Google-certified CMP that supports the required TCF flow. Verify the live consent behavior before activation.

## Release checks
- `/ads.txt` returns HTTP 200 and exact publisher record.
- Home HTML contains `google-adsense-account=ca-pub-6938956176929357`.
- AdSense JS is present exactly once in `<head>` using client `ca-pub-6938956176929357`.
- Footer exposes Privacy / Terms / Advertising Disclosure.
- Sitemap includes the legal pages.
- Production smoke test must be performed on `https://aijoylab.kr` after deploy.

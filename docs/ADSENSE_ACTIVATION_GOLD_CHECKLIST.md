# AdSense Activation GOLD Checklist

Use this checklist when Google AdSense changes `aijoylab.kr` from **준비 중** to **준비됨**.

## 1. Approval confirmation
- [ ] AdSense → Sites → `aijoylab.kr` shows **준비됨 / Ready**
- [ ] `https://aijoylab.kr/ads.txt` returns HTTP 200 and exactly:
  `google.com, pub-6938956176929357, DIRECT, f08c47fec0942fa0`
- [ ] Homepage contains `google-adsense-account=ca-pub-6938956176929357`
- [ ] AdSense loader is present exactly once

## 2. Privacy & Messaging
- [ ] AdSense → Privacy & messaging
- [ ] Open **European regulations**
- [ ] Create/publish a message for `aijoylab.kr`
- [ ] Use a **Google-certified CMP**
- [ ] Provide consent and refusal choices required by the selected Google flow
- [ ] Provide a path for users to revoke/change privacy choices
- [ ] Confirm the CMP account/site matches the same AdSense publisher

## 3. Consent / advertising behavior
- [ ] Confirm advertising consent signals are enabled as required by the Google message configuration
- [ ] Confirm analytics consent behavior is consistent with JoyLab's privacy notice
- [ ] Verify no ad placement is shown before the applicable consent state allows it
- [ ] Test from an EEA/UK/Switzerland-relevant consent scenario before broad rollout

## 4. JoyLab policy consistency
- [ ] `/privacy` accurately describes Google AdSense and consent behavior
- [ ] `/advertising-disclosure` matches actual loader/ad behavior
- [ ] `/terms` links to Advertising Disclosure
- [ ] Footer exposes Privacy, Terms and Advertising Disclosure
- [ ] Contact path remains available

## 5. First ad rollout
- [ ] Start with limited placements; do not place ads in Hero, immediately below the title, inside key tables/charts, or around primary CTAs
- [ ] Verify mobile at 390, 430 and 820 widths
- [ ] Verify desktop at 1440 width
- [ ] Check CLS/layout shift and accidental-click risk
- [ ] Confirm content remains readable without ads obscuring navigation or research

## 6. Production GOLD verification
- [ ] `/ads.txt` PASS
- [ ] AdSense meta PASS
- [ ] AdSense loader PASS
- [ ] `/robots.txt` PASS
- [ ] `/sitemap.xml` PASS
- [ ] `/privacy` PASS
- [ ] `/advertising-disclosure` PASS
- [ ] Mobile Visual Regression PASS
- [ ] Responsive Visual Gate PASS
- [ ] Build PASS

## Release rule
Do not enable broad ad placement until all mandatory checks above pass. A site-level AdSense approval is necessary but does not replace privacy/CMP and production UX verification.

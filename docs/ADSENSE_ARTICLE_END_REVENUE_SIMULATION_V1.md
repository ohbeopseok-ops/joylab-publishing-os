# JoyLab AdSense article-end Revenue Simulation V1

## Purpose
Estimate the first `article-end` pilot without treating RPM as a forecast.

Google defines Page RPM as:

`Page RPM = (Estimated earnings / Page views) × 1,000`

Therefore the simulation formula is:

`Monthly estimated earnings = Monthly page views ÷ 1,000 × assumed Page RPM`

The RPM values below are **JoyLab planning scenarios, not market benchmarks or guaranteed AdSense results**. Replace them with actual AdSense Page RPM after the pilot starts.

## Scenario assumptions
- First rollout: article-end only
- No sticky/anchor ad
- No Hero/CTA/scorecard ad
- Page RPM scenarios: KRW 500 / 1,500 / 3,000 / 5,000

| Monthly page views | RPM ₩500 | RPM ₩1,500 | RPM ₩3,000 | RPM ₩5,000 |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | ₩500 | ₩1,500 | ₩3,000 | ₩5,000 |
| 5,000 | ₩2,500 | ₩7,500 | ₩15,000 | ₩25,000 |
| 10,000 | ₩5,000 | ₩15,000 | ₩30,000 | ₩50,000 |
| 30,000 | ₩15,000 | ₩45,000 | ₩90,000 | ₩150,000 |
| 50,000 | ₩25,000 | ₩75,000 | ₩150,000 | ₩250,000 |
| 100,000 | ₩50,000 | ₩150,000 | ₩300,000 | ₩500,000 |
| 300,000 | ₩150,000 | ₩450,000 | ₩900,000 | ₩1,500,000 |

## Pilot interpretation
Do not optimize toward the highest RPM assumption. The first goal is to establish JoyLab's actual baseline with one low-risk placement.

### 7-day directional review
Capture:
- Page views
- Estimated earnings
- Page RPM
- Ad impressions
- Ad RPM
- Viewability
- CTR
- CLS
- Engaged reading depth
- Article → CTA conversion
- Mobile exit rate

### 14–28 day decision
Use the observed Page RPM to recalculate the table.

Example:
- 30,000 monthly page views
- observed Page RPM = ₩2,200
- estimated monthly earnings = `30,000 ÷ 1,000 × 2,200 = ₩66,000`

## Expansion gate
Add `article-mid65` only if:
- AdSense has no policy warning
- CMP is working
- Production GOLD is green
- article-end does not degrade mobile UX
- engagement/CTA metrics remain acceptable
- CTR shows no accidental-click pattern

Then compare:
- article-end only
- article-mid65 + article-end

Do not add `article-mid30` until the two-slot variant is stable.

## Revenue dashboard template

| Metric | Baseline before ads | 7-day article-end | 14-day article-end | After mid65 |
| --- | ---: | ---: | ---: | ---: |
| Page views |  |  |  |  |
| Estimated earnings |  |  |  |  |
| Page RPM |  |  |  |  |
| Ad impressions |  |  |  |  |
| Ad RPM |  |  |  |  |
| Viewability |  |  |  |  |
| CTR |  |  |  |  |
| CLS |  |  |  |  |
| Engaged reading depth |  |  |  |  |
| CTA conversion |  |  |  |  |

## Source
- Google AdSense Help — Page RPM definition: https://support.google.com/adsense/answer/112030?hl=ko

# JoyLab AdSense article-end Pilot Simulation V1

## Purpose
Estimate a conservative revenue range for the first AdSense pilot using only the pre-wired `article-end` placement.

This is a planning model, not an earnings forecast. Actual RPM depends on geography, device mix, advertiser demand, content topic, seasonality, consent state, viewability, invalid-traffic filtering, and fill.

## Formula
`Estimated monthly revenue = monthly pageviews / 1,000 × effective page RPM`

## Scenario assumptions
- Low: KRW 500 effective page RPM
- Base: KRW 1,500 effective page RPM
- High: KRW 3,000 effective page RPM

These are internal sensitivity assumptions for the limited one-slot pilot. Replace them with observed AdSense data after at least 7 days of live traffic.

## Monthly sensitivity

| Monthly pageviews | Low · ₩500 RPM | Base · ₩1,500 RPM | High · ₩3,000 RPM |
| ---: | ---: | ---: | ---: |
| 10,000 | ₩5,000 | ₩15,000 | ₩30,000 |
| 50,000 | ₩25,000 | ₩75,000 | ₩150,000 |
| 100,000 | ₩50,000 | ₩150,000 | ₩300,000 |
| 300,000 | ₩150,000 | ₩450,000 | ₩900,000 |
| 500,000 | ₩250,000 | ₩750,000 | ₩1,500,000 |

## Pilot KPI
Do not judge the pilot by revenue alone.

Track:
- article-end impressions
- effective page RPM
- ad viewability
- fill rate
- CTR as a safety signal, not a target
- article read depth
- CTA conversion
- pages/session
- mobile CLS
- accidental-click or layout complaints

## Decision rule after launch

### Day 0–7
- confirm ad delivery and consent behavior;
- verify no policy warning;
- confirm 390 / 430 / 820 / 1440 GOLD;
- collect enough data for a directional RPM range.

### Day 8–14
Compare pilot pages against the pre-ad baseline:
- revenue per 1,000 pageviews;
- reading depth;
- CTA conversion;
- exits;
- CLS.

### Expansion gate
Only consider `article-mid65` when:
- `article-end` remains visually separated from CTA/navigation;
- no material engagement deterioration is observed;
- no abnormal CTR signal appears;
- CMP and production QA remain healthy.

## Break-even planning examples
At the Base assumption of ₩1,500 effective page RPM:
- ₩100,000/month requires about 66,667 monthly pageviews.
- ₩300,000/month requires about 200,000 monthly pageviews.
- ₩1,000,000/month requires about 666,667 monthly pageviews.

These values are sensitivity math only. Replace the assumed RPM with the observed JoyLab RPM after the pilot.

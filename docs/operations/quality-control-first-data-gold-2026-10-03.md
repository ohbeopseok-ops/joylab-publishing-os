# JoyLab Quality Control · First Data GOLD · 2026-10-03

## Status

- Quality Control Center V1: **SUCCESS**
- Overall: **COLLECT**
- Visual Asset Contract V4: **PASS**
- First Content Entry: **PASS**
- Mobile Lab: **PASS**
- Production RUM: **COLLECT**

## First RUM sample state

| Metric | Samples | p75 | Budget | State |
| --- | ---: | ---: | ---: | --- |
| LCP | 0 | — | 2,500ms | COLLECT |
| CLS | 0 | — | 0.10 | COLLECT |
| INP | 0 | — | 200ms | COLLECT |

RUM은 각 metric 20 samples 이상부터 GOLD p75 판정에 사용합니다.

## First business-impact data

### GSC 7-day

- Window: 2026-09-25 ~ 2026-10-01
- Clicks: **12**
- Impressions: **309**
- CTR: **3.88%**
- Average position: **9.09**
- Previous clicks: 1
- Previous impressions: 118

### Cloudflare page-view signal

- Article paths with combined business signals: **66**
- High observed page-view group:
  - /articles/hanwha-ocean-shipbuilding: 97
  - /articles/samsung-heavy-industries-shipbuilding: 97
  - /articles/hd-hyundai-heavy-industries-shipbuilding: 97
  - /articles/samsung-electronics-outlook: 97
  - /articles/hyosung-heavy-industries-ai-power: 97

### AdSense

- Site state: **GETTING_READY**
- Page-level AdSense rows: **0**
- Revenue signal weight remains zero until AdSense starts returning page-level metrics.

## First Content Debt

- Articles above 3,200px: **9**
- Current TOP5:
  1. hd-hyundai-electric-ai-power — 3,273px
  2. samsung-hbm4-memory-outlook-2026-09-20 — 3,260px
  3. ai-data-center-interconnect-dci — 3,259px
  4. compounder-roic-reinvestment-moat — 3,256px
  5. hyosung-heavy-industries-ai-power — 3,241px

## Ranking GOLD rule

RUM이 READY가 되기 전에는 **BOOTSTRAP_FIRST_CONTENT** 모드로 공식 실행 큐를 생성합니다.

Bootstrap:
- Debt = First H2 position / 3,200px
- Business Impact = SEO clicks 35% + page views 35% + AdSense earnings 30% (log-normalized)
- Effort = visual complexity based 1~5
- Execution Value = Debt × (1 + Business Impact) / Effort

RUM이 PASS되고 page-level Experience Debt가 생성되면 자동으로 **RUM_GOLD** 모드로 전환합니다.

## GOLD transition

`BOOTSTRAP_FIRST_CONTENT → RUM 5/10/20 → RUM_GOLD → Debt × Impact × Effort → Official Execution Queue`


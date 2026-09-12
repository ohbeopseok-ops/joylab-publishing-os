# Semiconductor Cluster Refresh Audit — 2026-09-12

Status: PASS / no forced article rewrite required
Lane: REFRESH
Cluster: Semiconductor
Research Map: HBM → Cycle → Flow → Samsung → SK hynix → Compare

## Purpose

Research Media Operating System V1의 첫 REFRESH로 반도체 Cluster 6개 핵심 글의 최신성을 다시 검증한다.

검증 기준:
- 숫자·실적·제품 단계가 최신 공식자료와 충돌하는가
- 기존 투자 판단을 바꿀 새로운 사실이 생겼는가
- Company / Compare의 기준일이 명시돼 있는가
- 구조 글을 억지로 수정해야 하는가

## Source Hierarchy Applied

1. Samsung Electronics IR / Global Newsroom
2. Samsung Semiconductor / FMS 2026 official material
3. SK hynix Newsroom / quarterly earnings
4. Existing article valuation-date labels

## Official Evidence Checked

### Samsung Electronics

- 2026-07-30 2Q26 Results
  - Consolidated revenue: KRW 171.5tn
  - Operating profit: KRW 89.5tn
  - DS revenue: KRW 127.5tn
  - DS operating profit: KRW 89.2tn
  - Source: https://news.samsung.com/global/samsung-electronics-announces-second-quarter-2026-results

- 2026-05-29 HBM4E sample shipment
  - 12-layer HBM4E samples shipped to major global customers
  - Source: https://news.samsung.com/global/samsung-electronics-begins-shipment-of-industry-first-hbm4e-samples

- FMS 2026
  - HBM4E / HBM5 / AI storage roadmap and next-gen memory portfolio remain consistent with current JoyLab narrative
  - Source: https://news.samsung.com/global/samsung-unveils-next-gen-3d-memory-vision-at-fms-2026-charting-the-future-of-ai-infrastructure

### SK hynix

- 2026-07-29 2Q26 Results
  - Revenue: KRW 79.3187tn
  - Operating profit: KRW 60.5426tn
  - HBM4 mass shipments began in 2Q and production expansion planned for H2
  - Long-Term Agreements with around 10 key customers
  - Source: https://news.skhynix.com/en/q2-2026-business-results/

- 2026-06-18 HBM4E sample shipment
  - 12-layer HBM4E samples shipped to major customers
  - Source: https://news.skhynix.com/en/sk-hynix-ships-samples-of-12-layer-next-gen-hbm4e-2/

## Article-by-Article Audit

### 1. `what-is-hbm.md`

Status: PASS

Reason:
- Structural explainer; no hard market-price dependency.
- HBM3E → HBM4 transition description remains valid.
- Current official materials reinforce rather than overturn the article's core logic.

Next trigger:
- HBM4E mass-production transition
- materially changed JEDEC/interface assumptions
- HBM5 commercialization milestone

### 2. `semiconductor-cycle.md`

Status: PASS

Reason:
- Structural cycle framework, not a point-in-time price table.
- No forced rewrite unless memory price / inventory / CAPEX regime changes the interpretation materially.

Next trigger:
- quarterly DRAM/NAND pricing regime shift
- inventory inflection
- broad CAPEX acceleration or cut

### 3. `foreign-investor-flow.md`

Status: PASS — monitor

Reason:
- Method article remains valid.
- Flow is inherently time-sensitive, but the article explains how to read the variable rather than presenting a permanent single-day conclusion.

Next trigger:
- article adds fixed dated flow numbers
- major foreign-flow regime reversal becomes part of the thesis

### 4. `samsung-electronics-outlook.md`

Status: PASS

Verified:
- 2Q26 consolidated and DS figures match Samsung official results.
- HBM4 shipment / HBM4E sampling / FMS roadmap narrative remains consistent with official releases.
- Valuation section explicitly states base date `2026-09-10`.

No update required on 2026-09-12 because the factual base is current and the valuation date is only two days old.

Next trigger:
- 3Q26 guidance/results
- HBM4E mass-production/customer qualification update
- material foundry profitability shift
- valuation base date becomes stale for an editorial re-feature

### 5. `sk-hynix-outlook.md`

Status: PASS

Verified:
- 2Q26 revenue / operating profit match official SK hynix release.
- HBM4 mass shipment and H2 production expansion remain current.
- around 10 customer LTAs remain supported by official 2Q26 release.
- HBM4E sample shipment is supported by official June release.
- valuation date is explicitly stated `2026-09-10`.

Next trigger:
- HBM4E mass-production update
- additional LTA disclosure
- Y2 / M17 capacity-timing change
- 3Q26 earnings / margin normalization evidence

### 6. `samsung-vs-sk-hynix-ai-memory.md`

Status: PASS

Reason:
- Compare Hub uses the same current 2Q26 facts as the two Company Research pages.
- relative thesis remains coherent:
  - Samsung = portfolio normalization / discount compression
  - SK hynix = HBM leadership / growth premium
- valuation base date is explicitly shown `2026-09-10`.

Next trigger:
- one company changes HBM4E commercialization stage materially ahead of the other
- 3Q26 EPS/margin direction diverges
- Compare Hub is re-featured after valuation base becomes stale

## Refresh Decision

**No article rewrite is forced in this pass.**

The first operating-system principle applies:

> 구조적 판단이 바뀌지 않았다면 억지로 수정하지 않는다.

Current Semiconductor Cluster remains internally consistent and source-aligned as of 2026-09-12.

## Next REFRESH Queue

1. AI Power — Company Compare / order backlog / margin / capacity
2. Shipbuilding — orderbook / ship mix / delivery year / margin conversion
3. AI Productivity — platform feature / governance / Compare Hub

## Re-open Conditions

Semiconductor Cluster is reopened immediately if any of the following occurs:

- 3Q26 Samsung Electronics or SK hynix earnings/guidance
- HBM4E mass-production milestone
- material memory-price regime change
- major CAPEX / capacity revision
- customer qualification or LTA disclosure that changes relative positioning

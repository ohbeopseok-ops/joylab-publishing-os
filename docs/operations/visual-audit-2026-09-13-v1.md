# JoyLab Visual Audit — 2026-09-13 v1

## Executive Summary

- Published articles: **41**
- Published research: **41**
- GOOD: **6**
- REPLACE: **21**
- REPOSITION: **14**
- MISSING: **0**
- Effective CURATED/EXISTING: **5**
- Effective CURATED/OVERLAY: **15**
- AUTO-BASELINE: **21**

판정 우선순위는 `MISSING → REPLACE → REPOSITION → GOOD`이다.

- `REPLACE`: 공용 default Hero 또는 generic support가 남아 있어 글의 개별성이 부족함.
- `REPOSITION`: 전용 비주얼은 있으나 supporting visual이 의미상 대응하는 Heading에 아직 anchor되지 않음.
- `GOOD`: 전용 Hero와 semantic placement가 모두 완료됨.
- `MISSING`: Hero/supporting/alt 계약 자체가 불완전함.

## 1. Homepage Top 4 — Immediate Review

현재 홈페이지 `majorResearch = articles.slice(0, 4)` 기준 최신 4개다.

| Priority | Article | Hero Mode | Hero Verdict | Article Verdict | Action |
|---|---|---|---|---|---|
| P0 | `money-basics-7-economic-terms` | AUTO-BASELINE | **REPLACE** | **REPLACE** | 홈 노출 즉시 교체. 경제 기초 7개 개념을 한눈에 인식시키는 전용 Hero 생성 |
| P0 | `openai-data-agent-chatgpt-work` | AUTO-BASELINE | **REPLACE** | **REPLACE** | 홈 노출 즉시 교체. Data agent → 분석 → 대시보드 → 액션 흐름을 시각화 |
| P0 Review | `china-us-treasury-holdings-2026` | CURATED_EXISTING | **GOOD** | **GOOD** | 유지. 홈 카드 crop만 QA |
| P0 Review | `how-to-read-us-treasury-auctions-2026` | CURATED_EXISTING | **GOOD** | **GOOD** | 유지. 홈 카드 crop만 QA |

### Immediate Decision

첫 실제 ImageGen 교체 대상은 다음 두 글이다.

1. `money-basics-7-economic-terms`
2. `openai-data-agent-chatgpt-work`

홈에 보이는 4장을 모두 새로 만들 필요는 없다. 이미 GOOD인 미국 금리 2편은 유지하고, REPLACE 2편만 교체하는 것이 비용 대비 효과가 가장 높다.

## 2. Default Hero REPLACE Queue

### P0 — Homepage

1. `money-basics-7-economic-terms`
2. `openai-data-agent-chatgpt-work`

### P1 — Featured / Strategic

3. `ai-agent-governance`
4. `ai-productivity-operating-model`
5. `ai-productivity-platforms-compare`
6. `ai-productivity-roi`
7. `ai-workflow-automation`
8. `fairness-system-explainable-standards`
9. `feedback-system-behavior-change`
10. `growth-leadership-operating-system`
11. `hanwha-ocean-shipbuilding`
12. `hd-ksoe-shipbuilding`
13. `korea-shipbuilding-companies-compare`
14. `learning-system-reexecution-loop`
15. `performance-system-leading-indicators`
16. `recognition-system-fair-performance`
17. `samsung-heavy-industries-shipbuilding`
18. `what-is-ai-agent`
19. `samsung-vs-sk-hynix-ai-memory`

### P2 — Replace After P1

20. `hd-hyundai-heavy-industries-shipbuilding`
21. `foreign-investor-flow`

## 3. Full Visual Audit

| Article | Mode | Verdict | Supporting | Placed | Primary Action |
|---|---|---|---:|---:|---|
| `china-us-treasury-holdings-2026` | CURATED_EXISTING | **GOOD** | 2 | 2 | 유지 |
| `how-to-read-us-treasury-auctions-2026` | CURATED_EXISTING | **GOOD** | 2 | 2 | 유지 |
| `money-basics-7-economic-terms` | AUTO-BASELINE | **REPLACE** | 2 | 0 | P0 Hero/Support 교체 |
| `openai-data-agent-chatgpt-work` | AUTO-BASELINE | **REPLACE** | 2 | 0 | P0 Hero/Support 교체 |
| `us-30y-treasury-5-percent-risk-2026` | CURATED_EXISTING | **REPOSITION** | 2 | 0 | supporting anchor 지정 |
| `us-rates-korea-semiconductor-transmission-2026` | CURATED_EXISTING | **GOOD** | 2 | 2 | 유지 |
| `who-buys-us-treasuries-2026` | CURATED_EXISTING | **REPOSITION** | 2 | 0 | supporting anchor 지정 |
| `ai-agent-governance` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 전용 Hero 생성 |
| `ai-productivity-operating-model` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 전용 Hero 생성 |
| `ai-productivity-platforms-compare` | AUTO-BASELINE | **REPLACE** | 3 | 0 | 비교형 Hero + 비교 visual |
| `ai-productivity-roi` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 전용 Hero 생성 |
| `ai-workflow-automation` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 전용 Hero 생성 |
| `fairness-system-explainable-standards` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 성장·리더십 전용 Hero |
| `feedback-system-behavior-change` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 성장·리더십 전용 Hero |
| `growth-leadership-operating-system` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 성장·리더십 전용 Hero |
| `hanwha-ocean-shipbuilding` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 조선 전용 Hero |
| `hd-ksoe-shipbuilding` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 조선 전용 Hero |
| `korea-shipbuilding-companies-compare` | AUTO-BASELINE | **REPLACE** | 3 | 0 | 조선 4사 비교 Hero |
| `learning-system-reexecution-loop` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 성장·리더십 전용 Hero |
| `performance-system-leading-indicators` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 성장·리더십 전용 Hero |
| `recognition-system-fair-performance` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 성장·리더십 전용 Hero |
| `samsung-heavy-industries-shipbuilding` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 조선 전용 Hero |
| `what-is-ai-agent` | AUTO-BASELINE | **REPLACE** | 2 | 0 | AI Agent 전용 Hero |
| `ai-data-center-cooling-bottleneck` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `ai-power-gas-turbine-return` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `ai-power-value-chain-compare` | CURATED_OVERLAY | **REPOSITION** | 3 | 0 | semantic anchors |
| `doosan-enerbility-ai-power` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `hd-hyundai-electric-ai-power` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `hd-hyundai-heavy-industries-shipbuilding` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 조선 전용 Hero |
| `hyosung-heavy-industries-ai-power` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `korea-ai-power-companies-compare` | CURATED_OVERLAY | **REPOSITION** | 3 | 0 | semantic anchors |
| `ls-electric-ai-power` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `ai-power-grid-transformer-distribution` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `ai-power-next-bottleneck` | CURATED_OVERLAY | **GOOD** | 2 | 2 | 유지 |
| `bess-ups-bbu-data-center` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `foreign-investor-flow` | AUTO-BASELINE | **REPLACE** | 2 | 0 | 외국인 수급 전용 Hero |
| `samsung-electronics-outlook` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `samsung-vs-sk-hynix-ai-memory` | AUTO-BASELINE | **REPLACE** | 3 | 3 | Hero만 우선 교체 |
| `semiconductor-cycle` | CURATED_OVERLAY | **GOOD** | 2 | 2 | 유지 |
| `sk-hynix-outlook` | CURATED_OVERLAY | **REPOSITION** | 2 | 0 | semantic anchors |
| `what-is-hbm` | CURATED_OVERLAY | **GOOD** | 2 | 2 | 유지 |

## 4. Key Findings

### Finding A — Homepage 문제는 4개가 아니라 2개다

홈 최신 4개 중 미국 금리 2개는 이미 전용 Hero와 semantic placement까지 완료됐다. 지금 바로 생성해야 할 것은 `money-basics-7-economic-terms`, `openai-data-agent-chatgpt-work` 두 장이다.

### Finding B — 이미지 생성보다 배치 수정이 먼저인 글이 14개다

AI Power와 일부 반도체/미국 금리 글은 이미 전용 Hero/Supporting을 갖고 있다. 이 14개는 새 이미지를 만들기보다 `afterHeading` anchor를 지정하는 편이 효율적이다.

### Finding C — 실제 신규 생성 Queue는 21개다

공용 `joylab-research-default-hero.svg`가 남은 21개가 진짜 REPLACE 대상이다. 이 중 P0 2개를 먼저 처리하고 P1 Featured 그룹을 Pillar 단위로 묶어 생성한다.

## 5. Next Execution Order

1. **P0 ImageGen:** `money-basics-7-economic-terms`, `openai-data-agent-chatgpt-work`
2. **REPOSITION Sprint:** 14개 curated article의 supporting anchors 지정
3. **P1 ImageGen:** AI·생산성 → 조선 → 성장·리더십 순으로 전용 Hero 생성
4. **P2 ImageGen:** `hd-hyundai-heavy-industries-shipbuilding`, `foreign-investor-flow`
5. 변경 후 Visual Audit Runtime 재실행

## Done Rule

Visual Audit의 목표는 모든 글을 억지로 GOOD으로 만드는 것이 아니다. 홈·허브·검색 유입 글부터 우선 처리하고, `REPLACE`와 `REPOSITION`을 구분해 불필요한 신규 이미지 생성을 줄이는 것이 목표다.

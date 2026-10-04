---
title: "PEG<1 이후 S&P500은 얼마나 올랐나｜30년 백테스트를 시작하기 전에 확인한 것"
description: "S&P500 PEG가 1 아래로 내려간 시점을 어떻게 정의하고 검증해야 하는지, Yardeni PEG 데이터 구조와 신호 중복 문제를 기준으로 백테스트 설계를 공개합니다."
cardTitle: "PEG<1은 정말 매수 신호였을까"
cardDescription: "차트 몇 장이 아니라 재현 가능한 신호·수익률·MDD 규칙으로 PEG의 예측력을 검증합니다."
category: "투자·경제"
tags:
  - S&P500
  - PEG
  - 백테스트
  - 미국증시
  - 밸류에이션
  - EPSRevision
  - 투자리서치
publishedAt: 2026-10-05
author: "JoyLab"
featured: false
draft: true
seoTitle: "PEG<1 이후 S&P500 수익률｜30년 백테스트 설계"
series: "US Market Valuation"
seriesOrder: 2
readingTime: "약 9분"
investmentTheses:
  - macro-liquidity
investmentValueChains:
  - "PEG Signal → Forward Return → Drawdown → Confirmation"
investmentKpis:
  - "PEG Crossing"
  - "3M Forward Return"
  - "6M Forward Return"
  - "12M Forward Return"
  - "12M Maximum Drawdown"
  - "EPS Revision"
  - "US 10Y"
investmentResearchType: "macro"
heroImage: "/images/research/joylab-research-default-hero.svg"
heroAlt: "PEG 1 이하 진입 이후 S&P500의 미래 수익률을 검증하는 JoyLab 백테스트 연구"
---

## Research Status

**Evidence Level: SILVER / Draft**

이 글은 공개 가능한 Yardeni PEG 차트와 데이터 정의를 바탕으로 백테스트 규칙을 먼저 고정한 연구 초안입니다.

PEG 원시 시계열은 I/B/E/S by Refinitiv 기반이므로, 공개 차트에서 읽은 좌표만으로 정밀한 30년 수익률 통계를 확정하지 않습니다.

> **차트에서 좋아 보이는 패턴과 재현 가능한 백테스트는 다릅니다.**

GOLD 버전은 동일한 PEG 원시 시계열 또는 재현 가능한 숫자 데이터가 확보된 뒤 업데이트합니다.

---

## Key Takeaways

1. PEG<1을 매주 새로운 신호로 세면 동일한 저평가 구간이 중복 집계된다.
2. 따라서 **PEG가 1 이상에서 1 아래로 처음 진입한 시점**만 이벤트로 정의해야 한다.
3. 신호 이후 3·6·12개월 수익률뿐 아니라 최대낙폭(MDD)을 함께 봐야 한다.
4. PEG 단독 Model A와 EPS Revision을 추가한 Model B, 금리까지 추가한 Model C를 비교해야 한다.
5. 현재 공개 차트만으로는 후보 구간을 식별할 수 있지만 통계적 확정은 GOLD 데이터 전까지 보류한다.

---

## 1. 먼저 PEG 데이터가 무엇인지부터 확인해야 한다

Yardeni의 S&P500 PEG는 다음과 같이 정의됩니다.

**PEG = Forward P/E ÷ 5-year LTEG**

여기서 LTEG는 5년 Forward Consensus Expected Annual Earnings Growth입니다.

Yardeni는 이 시계열이 2005년까지 월간, 이후 주간이며 I/B/E/S by Refinitiv를 원자료로 사용한다고 명시합니다.

이 사실이 중요한 이유는 단순 trailing P/E와 과거 EPS 성장률로 같은 PEG를 재구성하면 **다른 지표를 백테스트하게 되기 때문**입니다.

---

## 2. 가장 먼저 막아야 할 오류｜신호 중복

PEG가 0.9인 상태로 20주 동안 유지됐다고 가정해봅시다.

매주를 독립 신호로 세면 한 번의 저PEG regime이 20개의 성공 사례처럼 보일 수 있습니다.

그래서 JoyLab은 이벤트를 다음처럼 정의합니다.

**직전 관측치 PEG >= 1.0 AND 현재 PEG < 1.0**

그리고 같은 regime의 중복을 막기 위해 **12개월 cooldown**을 둡니다.

이 규칙은 표본 수를 줄이지만 결과의 독립성을 높입니다.

---

## 3. 무엇을 측정할 것인가

각 이벤트마다 다음을 계산합니다.

| Metric | 목적 |
| --- | --- |
| 3M Forward Return | 단기 반응 |
| 6M Forward Return | 중기 반응 |
| 12M Forward Return | 핵심 평가 |
| 24M Forward Return | 장기 regime 검증 |
| 12M Maximum Drawdown | 실제 체감 리스크 |
| Positive Return Rate | 방향성 |
| Median Return | 이상치 완화 |
| Sample N | 통계적 신뢰도 |

수익률이 높더라도 중간에 -25%가 발생했다면 같은 전략으로 볼 수 없습니다.

따라서 **Return과 MDD를 반드시 함께 봅니다.**

---

## 4. PEG를 하나의 임계값으로만 보면 안 된다

최종 연구에서는 다음 bucket을 비교합니다.

- PEG < 0.75
- 0.75 <= PEG < 1.00
- 1.00 <= PEG < 1.25
- 1.25 <= PEG < 1.50
- 1.50 <= PEG < 2.00
- PEG >= 2.00

핵심 질문은 단순히 "PEG<1이면 올랐는가"가 아닙니다.

> **PEG가 낮아질수록 미래 수익률이 점진적으로 좋아지는가?**

이 관계가 없다면 1.0이라는 숫자는 편리한 기준일 뿐 강한 예측 변수는 아닐 수 있습니다.

---

## 5. 공개 차트에서 확인되는 후보 regime

현재 공개된 장기 PEG 차트에서는 PEG가 1 아래로 내려간 몇몇 구간을 시각적으로 확인할 수 있습니다.

대표적으로 글로벌 금융위기 이후, 2011년 조정기, 2018년 조정기, 최근 구간 등이 후보로 보입니다.

하지만 이 단계에서는 정확한 진입 주차와 PEG 값 자체를 확정하지 않습니다.

차트 픽셀을 날짜와 값으로 변환한 데이터는 **SILVER Evidence**로만 취급하고, 최종 통계는 원시 숫자 시계열에서 다시 계산해야 합니다.

---

## 6. 세 가지 모델을 비교한다

### Model A｜PEG Only

**PEG < 1**

가장 단순한 모델입니다.

### Model B｜PEG + Earnings

**PEG < 1 AND EPS Revision > 0**

낮은 PEG의 분모인 성장 기대가 실제로 상향되고 있는지 확인합니다.

### Model C｜PEG + Earnings + Rates

**PEG < 1 AND EPS Revision > 0 AND 금리 regime 비우호 아님**

현재처럼 10년물이 5%를 넘는 시장에서는 같은 PEG라도 의미가 달라질 수 있기 때문에 할인율을 추가합니다.

---

## 7. 왜 현재 시장에서는 Model B와 C가 중요해졌나

2026년 8월 Yardeni의 S&P500 NERI는 8.3%로 57개월 고점이었고 13개월 연속 플러스였습니다.

또한 11개 섹터의 NERI가 모두 플러스였습니다.

즉 현재 이익 Revision은 PEG의 낮은 수준을 일정 부분 확인해주고 있습니다.

반면 FRED DGS10 기준 미국 10년물은 2026년 10월 1일 5.24%였습니다.

따라서 현재 시장은 다음 조합입니다.

**PEG 우호 + Earnings Revision 우호 + Rates 비우호**

이런 환경에서는 PEG만으로 결론 내리는 것보다 Model C가 더 유용한지 검증할 가치가 큽니다.

---

## 8. GOLD Backtest의 통과 조건

다음 조건을 모두 만족해야 결과를 GOLD로 올립니다.

1. PEG 숫자 원시 시계열의 출처와 날짜가 재현 가능하다.
2. S&P500 수익률은 하나의 일관된 Price 또는 Total Return 시계열을 사용한다.
3. 미래 데이터를 신호 계산에 사용하지 않는다.
4. Crossing rule과 12개월 cooldown을 고정한다.
5. MDD 계산에 시작 자산가치 1.0을 포함한다.
6. Model A/B/C의 표본 수를 함께 공개한다.
7. 평균뿐 아니라 중앙값과 Hit Rate를 공개한다.
8. PEG bucket별 결과를 공개한다.
9. 데이터가 없는 구간은 보간해 만들지 않는다.
10. raw → signal → result 과정이 다시 실행 가능하다.

---

## 9. 이번 단계의 결론

공개 차트만으로도 PEG<1이 드문 regime이라는 점은 확인할 수 있습니다.

하지만 드문 신호는 오히려 더 조심해서 다뤄야 합니다.

표본이 작으면 몇 번의 우연한 성공이 매우 강력한 전략처럼 보일 수 있기 때문입니다.

따라서 현재 JoyLab의 판정은 다음입니다.

### PEG<1

**PROMISING REGIME SIGNAL**

### PEG<1 = 자동 매수

**NOT PROVEN**

### 다음 검증

**PEG + NERI + US10Y Model C**

이 연구의 목적은 낮은 PEG를 홍보하는 것이 아니라 **PEG가 언제 실제 투자 우위로 연결됐는지를 분리하는 것**입니다.

---

## 다음 편

다음 연구에서는 현재 PEG의 분모를 구성하는 핵심 변수인 **S&P500 EPS 성장과 Revision**을 집중적으로 분석합니다.

→ S&P500 EPS 전망이 꺾이면 어떻게 될까｜2026 AI 이익 사이클 분석

→ [Pillar｜S&P500 PEG 0.70, 정말 저평가일까](/articles/sp500-peg-valuation-2026)

---

## Sources

- Yardeni Research, S&P 500 valuation and PEG methodology: https://archive.yardeni.com/pub/stockmktperatio.pdf
- Yardeni Research, 2026 Morning Briefing archive: https://archive.yardeni.com/morning-briefing-2026/
- FRED, DGS10: https://fred.stlouisfed.org/series/DGS10
- Reuters, 2026-10-01, Investors wary of slowdown in US corporate profit boom: https://www.reuters.com/legal/transactional/investors-wary-slowdown-us-corporate-profit-boom-2026-10-01/

**Signal → Evidence → Backtest → Risk → Decision**

복잡한 정보를 실행 가능한 판단으로.

**JoyLab**

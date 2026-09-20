# JoyLab Observed Performance Score V1.0

## 1. 목적

사전 `Content Quality Score`와 실제 검색 성과를 비교하기 위한 D28 관측 점수다.

이 점수는 Google의 공식 평가 점수가 아니라 JoyLab 내부 운영 지표다.

## 2. 총점

```text
Discovery / Impressions   30
CTR Quality               25
Rank Momentum             25
Query Expansion           20
────────────────────────────
Observed Performance     100
```

## 3. 입력 JSON Contract

```json
{
  "slug": "what-is-hbm",
  "category": "투자·경제",
  "publishedAt": "2026-09-09",
  "quality": {
    "seo": 24,
    "geo": 23,
    "eeat": 17,
    "discover": 19,
    "total": 83
  },
  "d7": {
    "impressions": 120,
    "clicks": 5,
    "ctr": 0.0417,
    "averagePosition": 22.4,
    "uniqueQueries": 8,
    "top20Queries": 2,
    "top10Queries": 0
  },
  "d28": {
    "impressions": 980,
    "clicks": 61,
    "ctr": 0.0622,
    "expectedCtrAtPosition": 0.047,
    "averagePosition": 11.7,
    "uniqueQueries": 31,
    "top20Queries": 14,
    "top10Queries": 5
  },
  "cohort": {
    "name": "투자·경제-2026Q3",
    "size": 18,
    "impressionPercentile": 0.78
  }
}
```

필수 입력은 D7, D28, cohort다.

`expectedCtrAtPosition`은 별도 CTR benchmark 계층에서 공급한다. OPS 계산기가 임의의 CTR 곡선을 내장하지 않는다.

## 4. Discovery / 30

같은 카테고리와 유사한 발행 시점의 cohort 안에서 D28 노출 백분위를 사용한다.

```text
Discovery Score
= round(30 × impressionPercentile)
```

범위:

```text
0 ≤ percentile ≤ 1
0 ≤ score ≤ 30
```

예:

```text
percentile = 0.78

30 × 0.78
= 23.4
→ 23점
```

cohort가 10개 미만이면 이 항목은 `N/A`로 처리한다.

## 5. CTR Quality / 25

단순 CTR 절댓값을 사용하지 않는다.

```text
CTR Efficiency
= Actual CTR / Expected CTR at current position
```

점수:

| Efficiency | Score |
| ---: | ---: |
| ≥ 1.40 | 25 |
| 1.20–1.39 | 22 |
| 1.00–1.19 | 18 |
| 0.80–0.99 | 12 |
| 0.60–0.79 | 6 |
| < 0.60 | 0 |

D28 impressions가 50 미만이면 `N/A`다.

## 6. Rank Momentum / 25

구성:

```text
Average Position Improvement 15
Top20 Presence                5
Top10 Presence                5
```

평균순위 개선:

```text
improvement
= D7 averagePosition - D28 averagePosition
```

양수면 개선이다.

```text
Improvement Score
= clamp(round(improvement / 10 × 15), 0, 15)
```

10위 이상 개선하면 15점 만점이다.

추가:

```text
D28 Top20 query ≥ 1 → +5
D28 Top10 query ≥ 1 → +5
```

D7에서 순위 데이터가 없으면 improvement 항목은 `N/A`로 둔다.

## 7. Query Expansion / 20

구성:

```text
Unique Query Growth   10
Top20 Query Growth     5
Top10 Query Growth     5
```

각 성장률:

```text
growthRatio
= D28 count / max(D7 count, 1)
```

3배 성장 시 만점으로 한다.

```text
Unique Score
= clamp(round(uniqueGrowthRatio / 3 × 10), 0, 10)

Top20 Score
= clamp(round(top20GrowthRatio / 3 × 5), 0, 5)

Top10 Score
= clamp(round(top10GrowthRatio / 3 × 5), 0, 5)
```

D7이 0이고 D28이 0이면 해당 항목은 0점이다.

D7이 0이고 D28이 1 이상이면 분모를 1로 둔다.

## 8. N/A 처리

데이터 부족을 0점으로 처리하지 않는다.

예:

```text
Discovery      23 / 30
CTR            N/A
Rank           20 / 25
Query          17 / 20
```

사용 가능 최대점:

```text
30 + 25 + 20 = 75
```

정규화:

```text
Observed Performance Score
= round(
    availableScore
    / availableMaximum
    × 100
  )
```

위 예:

```text
60 / 75 × 100
= 80
```

보고서에는 반드시:

```json
{
  "observedPerformance": 80,
  "availableMaximum": 75,
  "missingDimensions": ["ctrQuality"]
}
```

를 함께 기록한다.

## 9. Confidence

### HIGH

- D28 impressions ≥ 300
- cohort size ≥ 20
- 4개 dimension 모두 사용 가능

### MEDIUM

- D28 impressions ≥ 100
- cohort size ≥ 10

### LOW

그 외.

낮은 confidence의 OPS는 가중치 보정 학습에 사용하지 않는다.

## 10. 출력 Contract

```json
{
  "version": "1.0",
  "slug": "what-is-hbm",
  "window": "D28",
  "dimensions": {
    "discovery": {
      "score": 23,
      "max": 30,
      "status": "AVAILABLE"
    },
    "ctrQuality": {
      "score": 22,
      "max": 25,
      "status": "AVAILABLE",
      "efficiency": 1.32
    },
    "rankMomentum": {
      "score": 25,
      "max": 25,
      "status": "AVAILABLE",
      "positionImprovement": 10.7
    },
    "queryExpansion": {
      "score": 20,
      "max": 20,
      "status": "AVAILABLE"
    }
  },
  "rawScore": 90,
  "availableMaximum": 100,
  "observedPerformance": 90,
  "confidence": "MEDIUM",
  "predictionError": 7
}
```

`predictionError`:

```text
Observed Performance
-
Pre-Publish Quality Total
```

예:

```text
90 - 83 = +7
```

## 11. Learning Loop 사용 규칙

초기:

```text
<30 articles
→ 기록만 수행

30–49
→ 상관관계 관찰

≥50
→ Weight Recommendation 허용

≥100
→ 카테고리별 가중치 검토
```

자동 가중치 변경은 금지한다.

추천값만 생성하고 사람 승인 후 적용한다.

## 12. 핵심 원칙

```text
Quality Score
= 발행 전 예측 신호

Observed Performance Score
= 발행 후 관측 신호

Prediction Error
= 두 신호의 차이
```

OPS는 콘텐츠의 절대적 가치 점수가 아니라 Search Console에서 관측된 검색 성과를 표준화한 운영 지표다.

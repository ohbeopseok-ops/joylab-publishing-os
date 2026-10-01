# JoyLab CTR Benchmark V1

## 목적

Observed Performance Score의 CTR Quality에 사용할 `Expected CTR by Position`을 외부 업계 평균이 아니라 JoyLab Search Console 실데이터로 만든다.

이 기준은 Google 공식 CTR 기준이 아니다. JoyLab 내부 운영 benchmark다.

## 1. 기본 원칙

- 데이터 원천: JoyLab GSC only
- 기본 학습창: 최근 90일
- 재학습 주기: 주 1회
- 브랜드 검색어는 기본 제외
- 최소 표본 미달 시 외부 평균으로 보정하지 않는다
- 표본이 부족하면 상위 position bucket으로 fallback한다
- 상위 bucket도 부족하면 `N/A` 처리한다

## 2. 학습 입력

query-page 단위 Search Console row를 사용한다.

필수 필드:

```json
{
  "query": "hbm 뜻",
  "page": "https://aijoylab.kr/articles/what-is-hbm",
  "clicks": 12,
  "impressions": 240,
  "ctr": 0.05,
  "position": 4.7
}
```

## 3. 브랜드 쿼리 제외

기본 제외 패턴:

```text
joylab
aijoylab
오법석
```

브랜드 검색은 CTR이 구조적으로 높을 수 있어 일반 검색 CTR benchmark를 왜곡할 수 있다.

## 4. Position bucket

세부 bucket:

| ID | Position |
| --- | --- |
| p1 | 1.00–1.99 |
| p2 | 2.00–2.99 |
| p3 | 3.00–3.99 |
| p4 | 4.00–4.99 |
| p5 | 5.00–5.99 |
| p6_10 | 6.00–10.99 |
| p11_20 | 11.00–20.99 |
| p21_50 | 21.00–50.99 |

상위 fallback bucket:

| ID | Position |
| --- | --- |
| top3 | 1.00–3.99 |
| top10 | 4.00–10.99 |
| top20 | 11.00–20.99 |
| deep | 21.00–50.99 |

## 5. Raw CTR

```text
Raw CTR
= sum(clicks) / sum(impressions)
```

단순 row 평균을 사용하지 않는다.

노출이 많은 row가 실제 benchmark에 더 큰 비중을 갖도록 impression-weighted aggregate를 사용한다.

## 6. Internal smoothing

세부 bucket의 표본이 작을 때 자체 parent bucket을 prior로 사용한다.

```text
Expected CTR
=
(bucketClicks + priorStrength × parentCTR)
/
(bucketImpressions + priorStrength)
```

기본:

```text
priorStrength = 100 impressions
```

예:

```text
p4

clicks = 20
impressions = 400
parent CTR = 4.0%

Expected CTR
=
(20 + 100 × 0.04)
/
(400 + 100)

= 24 / 500
= 4.8%
```

외부 CTR 곡선을 prior로 사용하지 않는다.

## 7. 표본 기준

Fine bucket 사용 가능:

```text
impressions >= 300
rows >= 10
```

HIGH confidence:

```text
impressions >= 1000
rows >= 30
```

Fine bucket이 부족하면 parent bucket을 사용한다.

Parent도 부족하면:

```text
expectedCtr = null
status = INSUFFICIENT_DATA
```

OPS에서는 CTR Quality dimension을 N/A 처리한다.

## 8. Benchmark 출력 Contract

```json
{
  "version": "1.0",
  "generatedAt": "2026-12-01T00:00:00.000Z",
  "window": {
    "start": "2026-09-02",
    "end": "2026-11-30"
  },
  "source": "joylab_gsc_only",
  "excludeBrandedQueries": true,
  "buckets": [
    {
      "id": "p4",
      "positionMin": 4,
      "positionMax": 4.99,
      "clicks": 120,
      "impressions": 2400,
      "rows": 42,
      "rawCtr": 0.05,
      "parentCtr": 0.047,
      "expectedCtr": 0.0499,
      "confidence": "HIGH",
      "status": "AVAILABLE"
    }
  ]
}
```

## 9. OPS 연결

글의 D28 평균순위가 4.7이면:

```text
position 4.7
→ p4
→ expectedCtr 4.99%
```

실제 CTR이 6.2%라면:

```text
CTR Efficiency
=
6.2 / 4.99
=
1.24
```

Observed Performance Score V1 기준:

```text
1.20–1.39
→ CTR Quality 22 / 25
```

## 10. 중요한 제한

페이지의 평균순위 하나를 position bucket에 대입하는 방식은 근사치다.

장기적으로는 더 정확한:

```text
query × page × position bucket
```

단위의 expected CTR과 actual CTR을 직접 비교하는 V2가 적합하다.

V1은 구현 복잡성과 데이터량을 고려해 page D28 average position 기반으로 시작한다.

## 11. Learning 단계

```text
Warm-up
< 300 impressions / bucket
→ CTR Quality N/A

Stable
>= 300 impressions + >= 10 rows
→ benchmark 사용

High Confidence
>= 1000 impressions + >= 30 rows
→ learning-loop calibration 허용
```

## 12. 운영 원칙

CTR Benchmark는 시간이 지남에 따라 바뀐다.

검색결과 구성, 브랜드 인지도, 콘텐츠 유형, JoyLab의 검색 노출 위치가 변하기 때문이다.

따라서 benchmark version과 생성 기간을 반드시 함께 저장한다.

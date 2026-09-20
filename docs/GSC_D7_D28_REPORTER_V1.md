# JoyLab GSC D7 / D28 Reporter V1

## 목적

각 게시글의 발행일을 기준으로 D7과 D28 검색 성과를 동일한 구조로 생성한다.

## 데이터 기준

Search Console final data만 사용하고 현재 날짜 기준 2일 전을 마지막 확정일로 본다.

각 글에 대해:

- D7: publishedAt ~ publishedAt + 6일
- D28: publishedAt ~ publishedAt + 27일

아직 전체 기간이 지나지 않은 글은 partial window로 기록한다.

## 출력

`qa-artifacts/gsc-28d/gsc-28d.json`

각 article:

```json
{
  "slug": "what-is-hbm",
  "publishedAt": "2026-09-09",
  "d7": {
    "window": {
      "start": "2026-09-09",
      "end": "2026-09-15",
      "availableDays": 7,
      "complete": true
    },
    "clicks": 0,
    "impressions": 0,
    "ctr": 0,
    "averagePosition": 0,
    "uniqueQueries": 0,
    "top20Queries": 0,
    "top10Queries": 0
  },
  "d28": {
    "window": {
      "start": "2026-09-09",
      "end": "2026-10-06",
      "availableDays": 28,
      "complete": true
    }
  }
}
```

## OPS 연결

D28가 `complete: true`인 글만 기본 OPS 계산 후보로 사용한다.

D7은 초기 discovery와 rank baseline 역할을 한다.

D28은 Observed Performance Score의 기본 관측창이다.

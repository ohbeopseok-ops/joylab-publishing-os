# Home Content Slot Contract V1.0

## 목적

JoyLab 홈의 `에디터 추천 3선 / 주요 리서치 / 최신 업데이트 / Research Guide / 전체 리서치`가 서로 다른 역할을 갖도록 콘텐츠 선발 규칙을 데이터로 고정한다.

이번 V1.0은 **스키마와 운영 규칙만 도입**한다. 기존 GOLD 홈의 실제 콘텐츠 배치는 즉시 바꾸지 않는다. Homepage Analytics V3의 7일 데이터를 확인한 뒤 Pass 03에서 슬롯 선발 로직을 활성화한다.

## Frontmatter 필드

### `homeFeatured: boolean`

- 기본값: `false`
- `true`이면 `주요 리서치` 후보군에 포함한다.
- 단순 최신 글이 아니라 JoyLab이 일정 기간 대표 분석으로 유지할 글에만 사용한다.

### `homePriority: integer`

- 허용 범위: `1~999`
- 숫자가 작을수록 우선순위가 높다.
- `homeFeatured: true`인 글에만 의미가 있다.
- 권장값: `10, 20, 30, 40`처럼 간격을 두고 부여한다.

### `excludeFromLatest: boolean`

- 기본값: `false`
- `true`이면 `최신 업데이트`에서 제외한다.
- 홈 상단에서 충분히 반복 노출되는 대표 글, 상시 공지 성격 글, 최신 피드에 중복 노출할 필요가 없는 글에 사용한다.

## 슬롯 역할

### 1. 에디터 추천 3선

- 목적: 지금 방문자가 가장 먼저 읽어야 할 3개.
- 편집 원칙: 투자·경제 / AI·생산성 / 성장·리더십의 시야를 균형 있게 유지한다.
- 시간 민감도가 가장 높다.
- `homeFeatured`와는 별도 개념이다.

### 2. 주요 리서치

- 목적: JoyLab의 깊이와 관점을 대표하는 분석.
- Pass 03 활성화 후 선발 규칙:
  1. `homeFeatured === true`
  2. `homePriority` 오름차순
  3. 동일 우선순위일 경우 `publishedAt` 내림차순
  4. 최대 4개
- 후보가 4개 미만이면 기존 최신 글로 fallback하되 중복을 최소화한다.

### 3. 최신 업데이트

- 목적: 최근 발행 흐름을 빠르게 확인하는 시간순 피드.
- Pass 03 활성화 후 선발 규칙:
  1. `draft === false`
  2. `excludeFromLatest !== true`
  3. `publishedAt` 내림차순
  4. 가능하면 `에디터 추천 3선` 및 `주요 리서치`와 중복 제거
  5. 최대 5개

### 4. Research Guide

- 목적: 주제를 처음 탐색하는 방문자의 시작점.
- 기사 frontmatter가 아니라 고정 Guide IA가 관리한다.
- Homepage Analytics V3에서는 `guide` placement로 계측한다.

### 5. 전체 리서치

- 목적: 검색·필터 기반 아카이브.
- 모든 공개 글을 포함한다.
- Home Slot 필드는 검색 결과 포함 여부에 영향을 주지 않는다.

## Analytics V3 연결

Homepage Analytics V3는 다음 네 placement를 구분한다.

- `editorial`
- `major`
- `latest`
- `guide`

각 placement에 대해 `home_section_impression`과 `home_section_click`을 집계한다.

CTR은 다음으로 계산한다.

`CTR = section clicks / section impressions`

Relative CTR Index는 전체 Home section의 가중 CTR을 100으로 두고 계산한다.

`Relative Index = section CTR / weighted home CTR × 100`

## Pass 03 판정 원칙

7일 롤링 데이터에서 각 섹션 노출이 충분하지 않으면 `WAIT_MORE_DATA`로 둔다. 자동 판정은 UI를 자동 변경하지 않고 리포트에서 권고만 생성한다.

- `KEEP_SEPARATE`: 주요 리서치와 최신 업데이트가 모두 의미 있는 클릭을 만든다.
- `REDUCE_MAJOR`: 주요 리서치 CTR이 최신 업데이트의 60% 미만이며 표본이 충분하다.
- `COMPRESS_LATEST`: 최신 업데이트 CTR이 주요 리서치의 60% 미만이며 표본이 충분하다.
- `REVIEW_OVERLAP`: 두 섹션 모두 낮고 에디터 추천 또는 Guide가 상대적으로 강하다.
- `WAIT_MORE_DATA`: 최소 표본에 도달하지 않았다.

기본 최소 표본은 섹션별 100 impressions이다. 이 값은 리포트 스크립트 인자로 조정할 수 있다.

## 운영 원칙

- 홈 디자인 변경보다 슬롯 역할과 선발 규칙을 먼저 검증한다.
- 한 글을 여러 슬롯에 반복 노출하는 것은 의도적일 때만 허용한다.
- `homeFeatured`는 SEO, Article Detail, Archive 노출 여부를 바꾸지 않는다.
- Analytics V3는 쿠키·사용자 ID 없이 집계 이벤트만 기록한다.
- 7일 데이터가 모이기 전에는 기존 GOLD 배치를 유지한다.

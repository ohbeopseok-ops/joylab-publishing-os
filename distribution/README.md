# JoyLab Distribution OS V1.0

한 편의 JoyLab Research를 채널별 콘텐츠로 전환하고, 사람이 승인한 뒤 게시 결과와 성과까지 추적하는 배포 계약입니다.

## Execution state

`DRAFT → REVIEW → APPROVED → PUBLISHED → MEASURED`

- `DRAFT`: 자동 생성 직후. 외부 게시 불가.
- `REVIEW`: 사람이 문안·수치·링크를 검토하는 상태.
- `APPROVED`: 승인자와 승인 시각이 기록된 상태. 이때만 Publish handoff 생성 가능.
- `PUBLISHED`: 실제 외부 게시 URL과 게시 시각이 기록된 상태.
- `MEASURED`: 24시간/7일 성과가 Scorecard에 반영된 상태.

**자동 게시 API는 V1에서 OFF입니다.** Adapter는 외부 API를 호출하지 않고 `MANUAL_HANDOFF` 파일만 생성합니다.

## New article flow

새 공개 Article이 main에 반영되면 `.github/workflows/distribution-pack.yml`이 자동으로 review pack artifact를 생성합니다. `draft: true` 문서는 제외합니다.

수동 생성:

```bash
npm run distribution:build -- --slug anthropic-ipo-ai-safety-2026
```

생성 결과:

- `distribution/generated/<slug>/distribution-pack.json`
- `threads.md` — Hook / Interpretation / Question
- `x.md` — Data / Debate / Judgment
- `linkedin.md` — Problem → Interpretation → Practical Implication
- `naver.md` — 검색형 요약 + 원문 연결
- `manifest.json` — Foundation V1 호환 manifest

## JoyLab Distribution Review Mobile V1

`npm run build`가 끝나면 모든 published article에 대해 모바일 Review 페이지가 같이 생성됩니다.

- URL: `https://aijoylab.kr/ops/distribution/<article-slug>`
- 예: `https://aijoylab.kr/ops/distribution/anthropic-ipo-ai-safety-2026`
- `draft: true` 문서는 생성하지 않습니다.
- 검색 노출 방지를 위해 각 페이지는 `noindex,nofollow,noarchive`를 사용하고 robots.txt에서 `/ops/distribution/`을 차단합니다.
- 승인·게시 URL은 해당 휴대폰 브라우저의 `localStorage`에 저장합니다.
- 저장 키는 `generatedAt`이 아니라 문안·CTA·해시태그·UTM의 content fingerprint를 사용합니다. 내용이 같으면 재배포 후에도 상태가 유지되고, 실제 문안이 바뀌면 새 검토 버전으로 분리됩니다.
- 모바일 화면에는 채널 필터, REVIEW, APPROVE, 문안+링크 복사, 게시 URL 기록을 제공합니다.
- 외부 소셜 API 호출은 하지 않습니다.

기존 artifact `review.html`과 로컬 Review UI는 비상용·백업 운영 경로로 계속 유지합니다.

## Local Review UI

```bash
npm run distribution:review -- --manifest distribution/gold/anthropic-ipo-ai-safety-2026/distribution-pack.json
```

기본 주소: `http://127.0.0.1:4178`

Review 화면에서 `DRAFT → REVIEW → APPROVED`로 전환할 수 있으며, APPROVED 이후에만 `Publish handoff 생성` 버튼이 나타납니다.

## Manual publish handoff

```bash
npm run distribution:handoff -- \
  --manifest <distribution-pack.json> \
  --channel x \
  --variant x_data_a \
  --out /tmp/x-handoff.json
```

APPROVED 이전에는 실패해야 정상입니다. handoff의 `autoPublish` 값은 항상 `false`입니다.

실제 게시가 끝난 뒤 URL을 기록합니다.

```bash
npm run distribution:published -- \
  --manifest <distribution-pack.json> \
  --channel x \
  --variant x_data_a \
  --url https://x.com/.../status/...
```

기록 필드: `publishedUrl / publishedAt / channel / campaign / articleSlug / variantId`.

## UTM contract

- `utm_source`: `threads | x | linkedin | naver`
- `utm_medium`: `social` (Threads/X/LinkedIn), `blog` (Naver)
- `utm_campaign`: `research_<slug>`
- `utm_content`: 게시물 variant ID
  - 예: `x_data_a`, `threads_insight_b`, `linkedin_analysis_a`, `naver_summary_a`

## Scorecard

Analytics 집계 결과를 metrics JSON으로 넘겨 24시간·7일 리포트를 동일 계약으로 생성합니다.

필수 지표:

- impressions
- clicks / CTR
- siteSessions
- dwell60
- internalLinkClicks
- articleCta
- Qualified Research Visit = `dwell60 + internalLinkClicks`

```bash
npm run distribution:scorecard -- --input <metrics.json> --out <scorecard.json>
```

데이터가 아직 없으면 `WAITING_FOR_DATA`, 데이터가 있으면 `MEASURED`를 반환합니다.

## GOLD Case

첫 GOLD Case는 `anthropic-ipo-ai-safety-2026`입니다.

- Threads 3안
- X 3안
- LinkedIn 1안
- Naver 1안
- 모든 variant별 UTM
- 초기 상태 `DRAFT`
- `APPROVED` 이전 handoff 차단
- 실제 게시 URL 입력 전 `publishedUrl = null`

GOLD Gate: `.github/workflows/distribution-execution-gold.yml`.

## V1 guardrails

1. 사이트 Article이 canonical source입니다.
2. 채널별 문구를 동일 복사하지 않습니다.
3. 숫자는 원문에서 검증된 값만 사용합니다.
4. APPROVED 없이는 publish handoff도 만들 수 없습니다.
5. 외부 소셜 API 자동 게시 코드는 포함하지 않습니다.
6. 게시 완료는 외부 URL이 기록돼야만 인정합니다.
7. 성과 판단은 단순 클릭보다 Qualified Research Visit을 우선합니다.
8. Mobile V1의 브라우저 승인 상태는 서버 기록이 아니라 기기 로컬 운영 상태입니다.

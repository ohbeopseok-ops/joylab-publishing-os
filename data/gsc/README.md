# JoyLab GSC Manual Import

목표는 **Google Search Console 유료 커넥터 없이도 CSV 한 번으로 검색 성과를 Evidence Priority에 자동 반영**하는 것입니다.

## 가장 짧은 운영법

1. Search Console → 검색 결과 → **페이지** 탭으로 이동합니다.
2. 원하는 기간(권장: 최근 28일)을 선택하고 CSV를 내보냅니다.
3. 페이지 성과 CSV를 `data/gsc/inbox/`에 넣습니다.
4. GitHub에 push하면 `GSC Manual Import` workflow가 자동 실행됩니다.
5. 파이프라인이 URL을 정규화하고 `data/gsc/latest.json`을 만들며, Evidence Priority TOP20을 재계산합니다.

지원 헤더는 영어/한국어 모두 포함합니다.

- Page / Top pages / 페이지 / 인기 페이지
- Clicks / 클릭수
- Impressions / 노출수
- CTR
- Position / 평균 게재순위

## 기간 메타데이터

Search Console의 Pages CSV 자체에 날짜 구간이 없는 경우가 있습니다. 이때 숫자를 추정하지 않고 `UNKNOWN`으로 둡니다.

정확한 기간까지 남기려면 같은 inbox에 `import.json`을 추가합니다.

```json
{
  "startDate": "2026-08-27",
  "endDate": "2026-09-23"
}
```

## 자동화되는 것

```text
GSC Pages CSV
→ Header 자동감지
→ URL 정규화
→ 중복 URL 병합
→ Clicks / Impressions / CTR / Position
→ Traffic Score 0~10
→ data/gsc/latest.json
→ history snapshot
→ Claim↔Source Corpus Audit
→ P0/P1/P2 재점수
→ TOP20 리포트
→ GitHub Actions artifact
```

Traffic Score V1은 해당 CSV 안에서 상대순위를 사용합니다.

```text
Clicks percentile × 6
+ Impressions percentile × 4
= 0~10
```

원본 CSV는 Evidence로 보존하고, 날짜나 값이 없는 항목을 임의 보정하지 않습니다.


## 완전 자동화 모드 — Google Search Console 공식 API

CSV 방식은 fallback입니다. 최종 운영은 Google 공식 Search Console API를 GitHub Actions가 매일 직접 조회할 수 있습니다.

필요한 설정은 최초 1회입니다.

1. Google Cloud에서 Search Console API 활성화
2. Service Account 생성
3. 해당 Service Account 이메일을 Search Console의 `aijoylab.kr` 속성 사용자로 추가
4. GitHub Repository Secret에 `GSC_SERVICE_ACCOUNT_JSON` 등록
5. GitHub Repository Variable에 `GSC_SITE_URL=sc-domain:aijoylab.kr` 등록

그 뒤 `GSC Direct API Sync`가 매일 **06:30 KST**에 실행됩니다.

데이터 지연을 고려해 기본 조회구간은 **오늘-3일을 종료일로 하는 최근 28일 final 데이터**입니다.

```text
Google Search Console API
→ page dimension / web
→ 최근 28 settled days
→ clicks / impressions / CTR / position
→ Traffic Score
→ data/gsc/latest.json
→ Evidence Priority 재점수
→ TOP20 artifact
→ Git commit
```

Secret이 없거나 API 설정이 아직 안 된 경우 workflow는 실패하지 않고 CSV fallback을 유지합니다.

장기적으로는 Service Account JSON Key 대신 GitHub OIDC + Google Workload Identity Federation으로 바꾸면 장기 키도 없앨 수 있습니다.

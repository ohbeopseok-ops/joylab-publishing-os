---
name: distribution
description: Build and review JoyLab channel distribution packs from a published Article. Use for Threads, X, LinkedIn, and Naver variants with UTM tracking and human approval gates.
---

# JoyLab Distribution Skill

## Goal

JoyLab Article을 canonical source로 유지하면서 채널별 review pack을 생성합니다.

## Input

- published or publish-ready article slug
- optional channel priority
- optional editorial overrides

## Process

1. Article frontmatter와 canonical을 확인합니다.
2. Distribution pack을 생성합니다.

```bash
npm run distribution:build -- --slug <article-slug>
```

3. 생성 결과를 확인합니다.

기본 경로:

```text
distribution/generated/<slug>/
├── distribution-pack.json
├── manifest.json
├── threads.md
├── x.md
├── linkedin.md
└── naver.md
```

4. 필요하면 모바일/로컬 Review UI 계약을 확인합니다.
5. 채널별 문구가 원문 전체 복사가 아닌지 검토합니다.
6. UTM과 canonical을 검증합니다.

## State model

`DRAFT → REVIEW → APPROVED → PUBLISHED → MEASURED`

V0.1 기본 상태는 **DRAFT**입니다.

## Quality Gate

- 원문 Article이 canonical source
- 숫자 임의 변경 금지
- Threads/X/LinkedIn/Naver 문구를 동일 복사하지 않음
- UTM 포함
- publishedUrl은 실제 게시 전 null
- APPROVED 전 publish handoff 차단
- 외부 소셜 API 자동 게시 금지

## Human approval

사람의 검토가 필요한 항목:

- 제목/Hook의 과장 여부
- 숫자와 사실 정확성
- 채널 문체
- 최종 게시 여부

## Output

- 생성된 pack 경로
- 채널별 variant 요약
- DRAFT/REVIEW/APPROVED 상태
- 사람이 확인할 항목
- 게시 후 기록해야 할 URL/성과 지표

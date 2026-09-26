# JOYLAB BUILD LOG V1

## 목적
프로젝트가 **Project → Service → Book → Content**로 확장되는 전 과정을 진행 중에 구조적으로 남긴다.

## Stage
discover → define → build → validate → ship → bookify → publish → distribute → measure → learn

## 필수 필드
- projectId
- title
- problemStatement
- persona0
- stage
- status
- startedAt
- decisions[]
- evidence[]
- releases[]
- book
- content[]
- metrics

## Decision Record
- date
- decision
- reason
- alternatives[]
- impact

## Evidence Record
- kind: file | url | commit | pr | screenshot | release | note
- ref
- label

## 운영 원칙
1. 사실과 해석을 분리한다.
2. 결정에는 이유를 남긴다.
3. 실패·롤백도 삭제하지 않는다.
4. 확정 산출물의 위치를 기록한다.
5. 개인식별정보나 원문 고객데이터는 Build Log에 저장하지 않는다.
6. 책은 프로젝트 종료 후 기억으로 복원하지 않고 Build Log에서 파생한다.

## 폴더
```text
data/build-log/
├─ schema-v1.json
└─ projects/
   ├─ problem-to-service.json
   └─ leaderdesk.json

docs/build-series/
└─ series-02-work-to-system.md

docs/books/
└─ books-funnel-dashboard-v1.md

scripts/
└─ check-build-log-v1.mjs
```

## Bookify
- problemStatement → 문제정의/프롤로그
- persona0 → 사용자 장
- decisions → 판단 장
- evidence → 실제 사례·그림
- releases → 제작 연대기
- 실패 기록 → 실패와 수정 장
- metrics → 운영·성과 장

## Content Expansion
책 1권을 기준으로 최소 다음 파생 자산을 목표로 한다.
- 검색형 Article 2편
- 제작 비하인드 Article 1편
- Social 5개
- 관련 Guide/Pillar 역링크 1개

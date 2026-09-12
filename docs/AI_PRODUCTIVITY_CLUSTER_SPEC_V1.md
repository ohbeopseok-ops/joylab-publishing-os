# JoyLab AI Productivity Cluster Spec V1

Status: Gold Candidate
Updated: 2026-09-12

## Purpose

AI·생산성 Pillar는 AI 제품 기능을 나열하는 카테고리가 아니다. JoyLab은 AI가 실제 업무를 어떻게 바꾸는지 **Capability → Workflow → Control → Measurement → Operating Model**의 연결 구조로 읽는다.

핵심 질문은 하나다.

> AI를 더 많이 쓰는 것이 아니라, 어떤 일을 어떤 구조로 위임하고 어떤 기준으로 성과와 위험을 관리할 것인가?

## Research Map

1. **Model / Capability** — 무엇을 할 수 있는가
2. **Agent** — 무엇을 위임할 수 있는가
3. **Workflow** — 사람·도구·시스템과 어떻게 연결되는가
4. **Governance** — 권한·승인·보안·로그·실패 복구를 어떻게 관리하는가
5. **Measurement** — 시간 절감이 아니라 실제 완료된 일과 품질·비용을 어떻게 측정하는가
6. **Operating Model** — 개인 활용을 팀과 조직의 운영 방식으로 어떻게 확장하는가

## Gold Case Roadmap

- **GC-A01** AI 에이전트란 무엇인가 — 챗봇과 에이전트의 차이
- **GC-A02** AI 업무자동화 구조 — Model → Tool → Workflow → Human Approval
- **GC-A03** AI 도입 ROI 보는 법 — Task Completion → Quality → Cost → Rework
- **GC-A04** Agent Governance — 권한·보안·승인·로그·실패 복구
- **GC-A05** AI Productivity Operating Model — 개인 생산성에서 팀·조직 운영으로
- **GC-A06** Compare Hub — 주요 AI 업무 플랫폼을 업무 구조 기준으로 비교

## Publication Gate

빈 Pillar를 먼저 만들지 않는다.

- GC-A01~A03이 발행된 뒤 `/guides/ai-productivity` Pillar V2 구현
- 이후 GC-A04~A06을 추가해 Research Map 완성
- 새 글은 아래 Research Template을 따른다

## AI Productivity Research Template V1

1. **Problem** — 어떤 업무 문제를 해결하려는가
2. **Capability** — 모델/에이전트가 실제로 할 수 있는 범위는 어디까지인가
3. **Workflow Fit** — 기존 프로세스 어느 단계에 들어가는가
4. **Human Control** — 승인·검토·예외처리는 어디에 남겨야 하는가
5. **Measurement** — 완료율·품질·비용·시간·재작업을 어떻게 측정하는가
6. **Risk** — 보안·권한·환각·데이터·운영 리스크는 무엇인가
7. **Scenario** — 도입 성공/부분 성공/실패 조건은 무엇인가
8. **Action** — 다음에 무엇을 설계·측정·검증할 것인가

## Editorial Rules

- AI 기능 소개보다 **업무 구조와 결과**를 우선한다.
- 제품 발표는 Fact, 업무 영향은 Interpretation으로 분리한다.
- 사용량·좌석수만으로 ROI를 판단하지 않는다.
- 자동화 대상 업무는 시작조건·완료조건·예외조건을 명시한다.
- 위험이 큰 업무는 Human Approval과 rollback/fallback을 기본값으로 둔다.
- 제품 비교는 기능 개수 대신 Workflow Fit·Control·Measurement 기준으로 비교한다.

## Source Priority

1. 공식 제품/기술 문서
2. 공식 연구·경제·보안 자료
3. NIST 등 표준/프레임워크
4. 기업 고객사 공식 사례
5. 보조적 2차 자료

## V2 Design System Gold Gate

- Research Article V2 구조 유지
- Research Brief / Key Takeaways / JoyLab Framework 유지
- Fact → Interpretation → Scenario → Action 시각 언어 유지
- 390px 모바일 안전성
- markdown table 공통 스타일 사용
- URL/canonical/sitemap/RSS 회귀 없음
- CI dependency audit / Astro build 통과
- 배포 후 smoke test 통과

## Pillar V2 Definition of Done

`/guides/ai-productivity`는 최소 3개 Gold Case가 존재한 뒤에만 구현한다.

초기 Pillar Research Map:

**Agent → Workflow → ROI → Governance → Operating Model → Compare**

이 구조를 통해 JoyLab의 두 번째 비투자 핵심 축을 만든다.

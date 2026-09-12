# JoyLab Research Media Operating System V1

Status: Gold
Updated: 2026-09-12

## Purpose

JoyLab을 더 이상 페이지를 추가하는 프로젝트가 아니라 **Research Media를 반복 운영하는 시스템**으로 전환한다.

핵심 운영 원칙은 다음과 같다.

> 새 글을 많이 쓰는 것보다, 어떤 Cluster를 왜 업데이트하고 무엇을 비교하며 어떤 판단을 남길지 먼저 정한다.

## 1. Operating Lanes

모든 콘텐츠 작업은 아래 4개 Lane 중 하나로 분류한다.

### REFRESH
기존 글의 숫자·공시·제품·수주·가격·정책·기능 변화를 최신화한다.

### EXPAND
기존 Research Map에서 아직 비어 있는 NEXT 단계를 채운다.

### COMPARE
같은 구조적 테마 안의 기업·플랫폼·대안을 동일한 Lens로 비교한다.

### PILLAR
3개 이상의 Gold Case가 확보된 Cluster를 하나의 Research Map으로 묶거나, 기존 Pillar의 지도·링크·순서를 유지보수한다.

## 2. Cluster Portfolio

### Semiconductor — REFRESH Lane
Research Map:
HBM → Cycle → Flow → Samsung → SK hynix → Compare

Current status:
- 2026-09-12 freshness audit PASS
- Company / Compare official fact base remains current
- valuation base date 2026-09-10 retained

Re-open triggers:
- 3Q26 earnings/guidance
- HBM4E mass-production milestone
- material memory-price regime change
- major CAPEX / capacity revision

### AI Power — REFRESH Lane
Research Map:
Generation → Grid → Resilience → Gas Turbine → Cooling → Compare

Current status:
- 2026-09-12 freshness audit PASS
- Doosan / Grid / Resilience / Gas Turbine / Cooling / 4-company Compare reviewed
- no forced article rewrite required
- valuation base date 2026-09-10 retained for the 4-company Compare

Re-open triggers:
- 3Q26 earnings from major AI Power companies
- material order / backlog revision
- production-capacity completion or delay
- transformer / turbine lead-time normalization
- liquid-cooling architecture or attachment-rate inflection
- margin inflection large enough to change relative ranking

### Shipbuilding — REFRESH Lane
Research Map:
HD HHI → Hanwha Ocean → Samsung Heavy → HD KSOE → Compare

우선 점검:
- 수주잔고·선종 믹스·인도연도
- 신조선가와 고선가 물량의 마진 전환
- LNG·함정·해양플랜트 노출
- 각사 CAPEX/생산성/밸류에이션

### AI Productivity — REFRESH Lane
Research Map:
Agent → Workflow → ROI → Governance → Operating Model → Compare

우선 점검:
- 플랫폼 기능·권한·거버넌스 변화
- 에이전트 실행/승인/로그/복구 구조
- Outcome ROI / Task Completion 관련 공식 프레임 변화
- ChatGPT·Claude·Gemini·Copilot Compare Hub 최신성

### Growth & Leadership — Gold / Maintenance Lane
Research Map:
Performance → Feedback → Recognition → Fairness → Learning → Operating System

현재:
- GC-G01 Performance — published
- GC-G02 Feedback — published
- GC-G03 Recognition — published
- GC-G04 Fairness — published
- GC-G05 Learning — published
- GC-G06 Operating System — published
- `/guides/growth-leadership` 6단 Map complete

다음부터는 신규 확장보다 분기 Evidence 보강과 운영 사례 업데이트를 우선한다.

## 3. Freshness Policy

콘텐츠 종류에 따라 재점검 주기를 다르게 둔다.

### Data-sensitive Company Research / Compare Hub
- 실적 발표, IR, DART 중요 공시, 대형 수주, 증설, 자본정책 발생 시 즉시 후보 등록
- 최소 분기 1회 데이터 기준일 재점검
- 밸류에이션 수치는 반드시 기준일 표시

### Industry / Pillar Structural Research
- 월 1회 변화 여부 스캔
- 분기 1회 Research Map 구조 재검토
- 구조적 판단이 바뀌지 않았다면 억지로 수정하지 않는다

### AI Productivity
- 월 1회 플랫폼·정책·거버넌스 변화 점검
- 대형 제품/에이전트 기능 변경 시 Compare Hub 우선 재검토

### Growth & Leadership
- 구조적 콘텐츠는 분기 단위 재검토
- 실무 사례·측정 규칙·운영 데이터가 누적될 때 Evidence를 보강

## 4. Source Hierarchy

### 기업·투자 Research
1. DART / KRX 공시
2. 회사 IR / Earnings / 공식 보도자료
3. 정부·규제기관·산업 공식 자료
4. 신뢰도 높은 데이터/뉴스 소스
5. 2차 해설 자료

### AI·생산성
1. 공식 제품 문서 / 보안·관리 문서
2. 공식 연구·가이드
3. 개발자 문서 / Release Notes
4. 신뢰도 높은 기술 분석

### 성장·리더십
1. 운영 데이터와 명시된 평가 기준
2. 검증 가능한 실제 사례
3. 조직행동·관리 연구
4. 프레임워크/전문가 해설

## 5. Template Routing

콘텐츠 유형마다 기존 공식 Template를 우선 사용한다.

- 단일 기업 → `Company Research Template V1`
- 기업/플랫폼 상대 비교 → `Compare Hub Template V1`
- AI 업무/생산성 → `AI Productivity Research Template V1`
- 성장·리더십 → `Growth Leadership Research V1`
- 새로운 Cluster → Gold Case 최소 3개 후 Pillar V2

새 Template를 만들기 전에 기존 Template로 해결할 수 없는 이유를 먼저 확인한다.

## 6. Editorial Publication Gate

발행 전 다음 질문을 통과해야 한다.

1. 무엇이 새로 바뀌었는가?
2. 이 변화가 기존 판단을 바꾸는가?
3. Fact와 Interpretation이 분리돼 있는가?
4. 비교 대상에는 동일 Lens를 적용했는가?
5. 독자가 다음에 확인할 조건이 남아 있는가?
6. 기존 Cluster 어디에 연결되는가?

단순 뉴스 요약만으로는 Gold Research로 승격하지 않는다.

## 7. Gold Gate

모든 신규·업데이트 작업에 공통 적용한다.

### Editorial
- Fact → Interpretation → Scenario → Action 유지
- 공식/1차 자료 우선
- 수치 기준일 명시
- 과장된 확정 표현 금지
- 기존 Research와 내부링크 연결

### Design
- JoyLab Design System V2 준수
- 기존 Gold Screen 문법 우선 재사용
- PC / 390px 모바일 회귀
- 가로 overflow 금지
- 긴 제목/기업명 안전 줄바꿈

### Platform
- URL / canonical 불필요한 변경 금지
- sitemap / RSS 보존
- dependency audit success
- Astro build success
- Cloudflare deploy + production smoke success

## 8. Editorial Top 3 Rule

Homepage의 `EDITORIAL TOP 3`는 단순 최신 3개가 아니다.

기본 규칙:
- 투자·경제 최신 Gold Research 1개
- AI·생산성 최신 Gold Research 1개
- 성장·리더십 최신 Gold Research 1개

해당 Pillar에 발행 글이 없을 때만 전체 최신 글로 fallback한다.

따라서 한 Cluster를 연속 발행해도 Homepage는 JoyLab의 3 Pillar 균형을 유지한다.

## 9. Recommended Sprint Unit

한 번의 운영 Sprint는 원칙적으로 다음 조합을 사용한다.

- 1 Refresh — 가장 데이터 민감한 기존 글
- 1 Expand — NEXT Research Map 단계
- 1 Compare 또는 Pillar Maintenance — 상대 판단 또는 내부링크 정리

모든 Sprint에서 세 작업을 반드시 할 필요는 없지만, 신규 글만 계속 쌓는 방식은 피한다.

Growth·Leadership 6단 Map 완성 이후에는 EXPAND보다 기존 Cluster의 REFRESH / COMPARE 품질을 우선한다.

## 10. Active Queue

완료:
1. Growth·Leadership GC-G04 Fairness
2. Growth·Leadership GC-G05 Learning
3. Growth·Leadership GC-G06 Operating System
4. Semiconductor Company / Compare freshness audit — PASS 2026-09-12
5. AI Power cluster freshness audit — PASS 2026-09-12

다음 실행:
1. Shipbuilding orderbook·mix·margin 점검
2. AI Productivity Platform Compare 기능·거버넌스 점검

## 11. Definition of Operating System Done

JoyLab Research Media Operating System V1은 다음 상태를 의미한다.

- 3개 Pillar가 실제 Guide URL을 가진다
- 최소 5개 Research Cluster가 운영된다
- 신규 글은 Cluster 또는 Template에 소속된다
- Homepage는 Editorial Top 3로 Pillar 균형을 유지한다
- 기존 콘텐츠가 Freshness Policy에 따라 재점검된다
- Gold Gate에 V2 Design System과 production smoke가 항상 포함된다

현재 이 정의를 충족한다. 이후 JoyLab의 핵심 산출물은 **페이지 수가 아니라 갱신 가능한 Research Cluster**다.

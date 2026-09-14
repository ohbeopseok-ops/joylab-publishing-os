# Aside × JoyLab Factory Workflow Map V1.0

## 설계 원칙

Aside를 JoyLab 전체 운영체계의 중심으로 두지 않는다.

Aside는 교체 가능한 Browser Execution Layer로 둔다. 리서치 판단, 코드, QA, 배포의 Source of Truth는 기존 시스템에 남긴다.

## Target Architecture

```text
[Signal / Topic]
      ↓
[Browser Acquire]
Aside
- 웹 탐색
- 로그인 세션 활용
- 자료 다운로드
- 관리자 화면 확인
- 반복 웹 조작
      ↓ evidence package
[Research / Reason]
ChatGPT Work
- 출처 검증
- Fact / Claim / Interpretation 분리
- 비교·분석
- 전략 인사이트
- 완성 초안
      ↓ research contract
[Spec / Plan]
JoyLab Factory
- /spec
- /plan-eng-review
- Article Contract
- Frontmatter / Schema
      ↓ implementation plan
[Build]
Codex / Repo tooling
- 코드·콘텐츠 반영
- 테스트 추가
- PR 생성
      ↓ candidate
[Review / QA]
Playwright + QA Runtime
- deterministic checks
- visual audit
- regression
- screenshot evidence
- /review
- /qa-only
      ↓ PASS
[GOLD_CASE]
Human approval
- 품질 기준 충족
- 재사용 가능성
- 회귀 기준 확정
      ↓
[Ship]
GitHub Actions → Cloudflare
- merge gate
- build
- deploy
- production smoke
```

## 1. Aside에 넘길 업무

### A. Browser-native research

- 검색 결과와 공식 사이트 직접 방문
- 로그인 후에만 볼 수 있는 화면 탐색
- 다수 탭의 항목 수집
- 변경된 가격·정책·기능 페이지 확인
- 웹페이지에서 필요한 증거 위치 찾기

### B. Evidence collection

- 원문 URL 수집
- 다운로드 가능한 PDF·CSV 확보
- 페이지 상태 확인
- 필요한 경우 스크린샷 후보 확보
- 확인 일시 기록

### C. Repetitive web operations

- CMS 초안 입력
- 관리자 화면 반복 조회
- 공개 전 단계까지 폼 입력
- 여러 사이트에 반복되는 동일 조회

## 2. Aside에 넘기지 않을 업무

### Deterministic QA

Playwright 유지.

이유: PASS/FAIL 조건과 재현성이 핵심이기 때문.

### Git merge gate / CI

GitHub Actions 유지.

이유: 사람 또는 에이전트의 브라우저 상태에 의존하면 안 됨.

### Production deploy

Cloudflare workflow 유지.

이유: 배포는 코드로 기록되고 되돌릴 수 있어야 함.

### Final factual synthesis

ChatGPT Work + JoyLab Research Standard 유지.

이유: 웹을 잘 조작하는 능력과 출처를 논리적으로 평가하는 능력은 다름.

### GOLD_CASE 승인

사람 유지.

이유: GOLD는 기술 PASS뿐 아니라 제품 기준·사용자 경험·재사용 가능성을 포함한 운영 판단임.

## 3. 기존 수작업에서 Aside로 이동할 후보

| 기존 작업 | 현재 문제 | Aside 역할 | 최종 책임 |
| --- | --- | --- | --- |
| 최신 자료 탐색 | 탭 전환·복붙 반복 | 여러 사이트 순회·수집 | Work |
| 로그인 자료 확인 | 세션 전환 번거로움 | 로그인 브라우저에서 조회 | 사람/Work |
| PDF 다운로드 | 파일명·출처 정리 반복 | 다운로드·출처 패키징 | Work |
| CMS 초안 입력 | 단순 반복 | 발행 직전까지 입력 | 사람 |
| GitHub 상태 확인 | 여러 화면 이동 | PR/Actions 화면 수집 | CI가 Source of Truth |
| Cloudflare 상태 확인 | 대시보드 이동 | 상태 확인 보조 | Deploy workflow |

## 4. Evidence Package Contract

Aside에서 Work로 넘길 때 자유형 메모가 아니라 아래 구조로 넘긴다.

```json
{
  "task_id": "YYYYMMDD-topic-001",
  "query": "original research question",
  "collected_at": "ISO-8601",
  "sources": [
    {
      "title": "",
      "url": "",
      "publisher": "",
      "published_at": "",
      "source_type": "primary|secondary|community",
      "claim": "",
      "evidence": "",
      "local_file": "",
      "notes": ""
    }
  ],
  "browser_actions": [],
  "warnings": [],
  "human_approval_required": false
}
```

핵심은 Aside의 대화 기록이 Source of Truth가 되지 않도록 하는 것이다.

## 5. Failure Routing

### Aside 실패

웹사이트 탐색·로그인·수집 실패 → 사람 takeover 또는 Work cloud browser 대체 → 원문 확보.

### Work 실패

근거 부족·출처 충돌 → Acquire 단계로 되돌려 추가 소스 확보.

### Build 실패

Codex 수정 → PR 재실행.

### QA 실패

Repair Runtime은 확정된 GOLD 기준에 한해서 수정. 아직 확정되지 않은 화면을 자동 반복 수정하지 않음.

### Deploy 실패

Cloudflare/GitHub 로그 기준으로 rollback 또는 재배포. Aside로 우회 배포하지 않음.

## 6. Human Approval Gates

반드시 사람이 승인하는 지점:

1. 공개 게시
2. 유료 결제
3. 파일·데이터 삭제
4. 계정·권한 변경
5. 외부 메시지 발송
6. PR merge 중 제품·정책 판단이 필요한 변경
7. GOLD_CASE 승격

## 7. 성공지표

Aside 도입 성과는 사용시간이 아니라 아래로 본다.

- Research Acquire Lead Time
- Source Capture Completeness
- Human Click Reduction
- Rework Rate
- Evidence Missing Rate
- Browser Task Completion Rate
- Critical Fail Count

## 8. 도입 단계

### Phase 1 — Shadow

10개 Benchmark 수행. 기존 프로세스는 바꾸지 않는다.

### Phase 2 — Assist

로그인 조회·자료 수집·다운로드만 Aside 사용. 발행·수정은 기존 방식.

### Phase 3 — Controlled Action

CMS 초안 입력, 관리자 반복 업무 등 저위험 액션 추가. Human Approval 유지.

### Phase 4 — Standard Layer

Benchmark 85점+, Critical Fail 0, 반복 성공률 90% 이상일 때 Browser Execution Layer의 표준 후보로 승격.

## 최종 원칙

JoyLab은 AI 도구에 종속되지 않고 **계층에 종속**되어야 한다.

- Browser Execution Layer는 Aside 또는 다른 브라우저 에이전트로 교체 가능
- Research & Orchestration Layer는 Work 중심
- Engineering Layer는 Codex 중심
- Verification Layer는 Playwright/QA Runtime 중심
- Delivery Layer는 GitHub/Cloudflare 중심

이렇게 설계하면 Aside가 좋아져도 시스템을 갈아엎을 필요가 없고, 더 좋은 브라우저 에이전트가 나오면 해당 레이어만 교체하면 된다.

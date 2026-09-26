# Series 02 Interactive Map V1
## 업무를 시스템으로 바꾸는 법

### 목표
Series 02를 단순 웹 리더가 아니라 **읽기 → 질문 → 직접 만들기 → 결과 저장**이 이어지는 인터랙티브 전자책으로 설계한다.

### Chapter Mode
- **READ** — 사례와 원리를 이해하는 장. 본문 집중이 우선이며 인터랙션은 최소화한다.
- **ASK** — 독자의 현재 업무를 돌아보게 하는 장. 선택형 질문·자가진단·Reflection을 사용한다.
- **BUILD** — 독자가 직접 구조·흐름·데이터를 만들어보는 장. Canvas·Builder·Checklist를 사용한다.
- **SAVE** — 장의 결과를 `내 기록`에 남겨 다음 장에서 재사용하는 장. 산출물 저장이 완료 조건에 포함된다.

> 한 장은 Primary Mode 1개를 가지며, 필요하면 Secondary Mode를 함께 가진다.

## Chapter 1–15 Map

| Ch | Chapter | Primary | Secondary | 핵심 인터랙션 | 저장 결과 | 완료 조건 |
|---:|---|---|---|---|---|---|
| 1 | 기록은 많은데 왜 다시 찾게 될까 | ASK | SAVE | **기억 부채 찾기** — 머릿속으로 기억하고 있어서 굴러가는 업무 3개 작성 | `memoryDebt[]` | 기억 부채 1개 이상 저장 |
| 2 | 리더의 기억을 시스템 밖에 두지 않는다 | ASK | SAVE | **시스템 밖 기억 점검** 4문항 + 위험 신호 카운트 | `memoryRiskScore` | 체크리스트 완료 |
| 3 | Persona 0는 현장의 리더였다 | BUILD | SAVE | **Persona 0 Moment Canvas** — 누가/언제/어디서/무엇이 급한가/다음 행동 | `persona0Moment` | 5칸 중 4칸 이상 작성 |
| 4 | 말 한마디를 데이터로 만들 수 있을까 | BUILD | SAVE | **원문 vs 요약** — STT 원문을 붙이고 한 줄 요약 작성, 원문 보존 선택 | `sourceSummaryPair` | 원문 + 요약 모두 존재 |
| 5 | 기억파편이라는 단위를 만들다 | BUILD | SAVE | **기억파편 1건 만들기** — 대상/관찰 사실/Follow-up/날짜 | `memoryFragment` | 관찰 가능한 사실 1문장 + 대상 저장 |
| 6 | Core Data Contract를 먼저 만든 이유 | BUILD | SAVE | **Mini Data Contract Builder** — Object 3~5개 선택, 관계 연결 | `miniDataContract` | Object 3개 이상 + 관계 2개 이상 |
| 7 | KPI 숫자보다 변경이력이 중요했다 | ASK | BUILD · SAVE | **KPI Change Scenario** — 회사기준/팀목표/오입력/기타를 분류하고 과거 재계산 여부 선택 | `kpiChangePolicy` | 변경 사유 규칙 + 과거 처리 원칙 저장 |
| 8 | 첫 화면에서 무엇 하나만 할 수 있어야 할까 | ASK | SAVE | **First Screen Decision** — 첫 행동 하나를 선택하고 버릴 기능 2개 지정 | `firstScreenDecision` | 핵심 행동 1개 선택 |
| 9 | 말로 기록하고 한 줄로 정리하다 | BUILD | SAVE | **One-line Capture Lab** — 긴 기록을 30자 안팎 핵심 문장으로 줄이기 | `oneLineCapture` | 원문과 한 줄 포착 모두 저장 |
| 10 | 저장 다음 행동을 설계하다 | BUILD | SAVE | **Post-save Flow Builder** — 저장 후 다음 행동 2개만 남기기 | `postSaveFlow` | 다음 행동 정확히 2개 선택 |
| 11 | 최근 5건만 보여준 이유 | ASK | BUILD | **Information Density Test** — 최근 기록 3/5/10/전체 중 선택 후 이유 비교 | `densityDecision` | 노출 개수 + 이유 저장 |
| 12 | 하나의 앱에 모든 기능을 넣지 않기로 했다 | BUILD | SAVE | **Context Split Canvas** — 같은 데이터지만 사용 순간이 다른 업무 2개 비교 | `contextSplit` | 두 사용 순간의 목적·기기·시간 제약 작성 |
| 13 | LeaderDesk Coaching | BUILD | SAVE | **Mobile 3-Tab Builder** — 기록/오늘/더보기 안에 기능 배치 | `coachingNav` | 핵심 기능을 3탭에 모두 분류 |
| 14 | LeaderDesk Ops | BUILD | SAVE | **Daily Ops Board** — 회수/비교/판단 기능을 PC 운영판에 배치 | `opsBoard` | 오늘 판단에 필요한 카드 4개 이상 선택 |
| 15 | 같은 데이터, 다른 인터페이스 | BUILD | SAVE | **Same Data, Different UI** — 공통 Object와 모바일/PC View를 연결 | `crossInterfaceContract` | 공통 Object 3개 이상 + 양쪽 View 연결 |

## Learning Arc

### 1–3 · 문제를 자기 업무로 가져오기
독자는 LeaderDesk 이야기를 읽는 것이 아니라 자신의 업무에서 **기억 부채와 Persona 0**를 발견한다.

**Checkpoint A**
- 기억 부채 목록
- 기억 위험 신호
- Persona 0 Moment

### 4–7 · 업무를 데이터로 바꾸기
원문 → 기억파편 → Data Contract → 변경이력까지 직접 만든다.

**Checkpoint B**
- Source/Summary Pair
- Memory Fragment
- Mini Data Contract
- KPI Change Policy

### 8–11 · 가장 작은 흐름 만들기
기능을 늘리지 않고 **첫 행동 → 한 줄 기록 → 저장 후 행동 → 최근 정보량**을 결정한다.

**Checkpoint C**
- First Screen Decision
- One-line Capture
- Post-save Flow
- Density Decision

### 12–15 · 하나의 시스템, 두 인터페이스
모바일과 PC를 분리하되 같은 데이터 계약으로 연결한다.

**Checkpoint D**
- Context Split
- Coaching 3-Tab
- Ops Board
- Cross-interface Contract

## 최종 결과물 · My Operating OS Draft V1

Chapter 15가 끝나면 지금까지 저장한 결과를 한 화면에 합친다.

1. **Problem**
   - Memory Debt
   - Persona 0 Moment
2. **Data**
   - Memory Fragment
   - Mini Data Contract
   - KPI Change Policy
3. **Capture Flow**
   - First Screen
   - One-line Capture
   - Post-save Flow
   - Density Rule
4. **Interface Split**
   - Coaching Navigation
   - Ops Board
   - Shared Objects

최종 CTA:
**“내 업무 OS 초안 보기”**

출력 형태:
- 브라우저 내 결과 카드
- Copy as Markdown
- Print / PDF 저장
- V2에서 JSON export 검토

## Interaction Density Rule

모든 장에 인터랙션을 억지로 넣지 않는다.

- 한 Chapter당 **Primary Interaction 1개**
- 보조 인터랙션은 최대 1개
- 본문 중간보다 **장 후반**에 배치
- 입력 예상 시간 **2~5분**
- 저장 결과는 다음 Chapter에서 재사용 가능해야 함
- 입력하지 않아도 본문 읽기는 막지 않음
- 정답형 퀴즈보다 **자기 업무를 구조화하는 상호작용**을 우선

## Persistence Contract V1

모든 결과는 브라우저 `localStorage`에 저장한다.

Key namespace:
```
joylab-book-work-to-system-interactive-*
```

서버로 전송하지 않는 데이터:
- Reflection 원문
- 개인 메모
- Canvas 작성 내용
- 독자 자체 업무 데이터

Analytics로 전송 가능한 최소 행동 이벤트:
- `book_chapter_complete`
- `book_chapter_bookmark`
- `book_interaction_check`
- `book_interaction_choice`
- `book_interaction_action`

**독자가 작성한 텍스트 내용 자체는 Analytics에 보내지 않는다.**

## V1 → V2 확장 후보

- Drag & Drop 기반 Coaching 3-Tab Builder
- Object 관계선을 직접 그리는 Data Contract Canvas
- Chapter 4 STT 샘플을 실제 MemoryFragment JSON으로 변환하는 체험
- 09:30 / 10 / 12 / 16 / 18 Daily Routine Builder
- Chapter 18 TOP3 Priority Simulator
- Chapter 19 Follow-up Calendar
- 최종 `My Operating OS` 결과 PDF 생성

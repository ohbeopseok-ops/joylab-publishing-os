# JoyLab Books Reader Pack V2 Standard

Status: ACTIVE
Version: 2.0
Target site: https://aijoylab.kr/
Target repo: ohbeopseok-ops/joylab-publishing-os
Supersedes: `JOYLAB_BOOKS_WEB_READER_SPEC_V1.md` at the package/experience layer

## 1. Goal

Reader Pack V2는 JoyLab Books 한 권을 단일 전자책이 아니라 다음의 순환형 지식 경험으로 만든다.

**Book Detail → Web Reader → Interactive Mindmap → Related Research → Book Detail / Next Book**

핵심 목표는 다음 네 가지다.

1. 책의 발견성과 SEO를 높인다.
2. 읽기 경험을 끊기지 않게 연결한다.
3. 책의 핵심 개념을 관련 리서치로 확장한다.
4. 각 단계의 전환과 완독을 측정해 다음 출간에 학습한다.

## 2. Core route contract

필수 route:

- `/books/{slug}` — 도서 상세/SEO landing
- `/books/{slug}/read` 또는 `readerPath` — 웹 리더
- `/books/{slug}/mindmap.html` — 인터랙티브 마인드맵
- `/articles/{research-1}`
- `/articles/{research-2}`
- `/articles/{research-3}`
- `/books` — JoyLab Books Hub

외부 정적 Reader를 쓰는 책도 상세페이지 canonical은 도서 상세 URL을 유지한다.

## 3. Reader Pack V2 required assets

### 3.1 Brand assets

필수:
- Cover 2:3
- OG 16:9
- cover alt
- OG alt
- 최소 1개의 책 대표 문장

권장:
- SNS 1:1
- 4:5 카드
- 서점/전자책 상세용 1600×2400 원본

### 3.2 Book Detail

필수 섹션 순서:

1. Hero
2. 핵심 문장
3. 책 소개
4. 이 책이 필요한 사람
5. 핵심 포인트
6. 전체 목차
7. 웹 리더 CTA
8. 마인드맵 CTA
9. 관련 리서치 3편
10. 저자 소개
11. 서지 정보
12. 다음 책 / Books Hub CTA

### 3.3 Web Reader

필수:
- TOC
- current chapter
- reading progress
- font size
- font family
- line height
- light/warm/dark theme
- previous/next chapter
- saved reading position

Reader Pack V2 종료 CTA:

1. **이 책의 구조를 마인드맵으로 보기 →**
2. **책에서 확장된 리서치 읽기 →**
3. **JoyLab Books 전체 보기 →**

### 3.4 Interactive Mindmap

필수 노드:
- 핵심 상징
- 부/장 구조
- 장별 1문장
- 핵심 문장
- 관련 리서치

필수 CTA:
- **웹 리더로 돌아가기**
- **책 소개 보기**
- **관련 리서치 읽기**

## 4. CTA language contract

사용자에게 같은 목적을 다른 문구로 반복 노출하지 않는다.

표준 CTA:

| Intent | Standard copy |
| --- | --- |
| 상세 이동 | 책 소개 보기 → |
| Reader 시작 | 웹 리더로 읽기 → |
| Mindmap | 마인드맵으로 보기 → |
| Research | 관련 리서치 읽기 → |
| Hub | JoyLab Books 전체 보기 → |
| Next | 다음 글 읽기 → |

Hero Primary:
**웹 리더로 읽기 →**

Hero Secondary:
**마인드맵으로 보기 →**

Research Cluster:
**책에서 이어 읽기 →**

Reader Complete:
**읽은 생각을 마인드맵으로 정리하기 →**

## 5. Related Research contract

Reader Pack V2의 기본값은 관련 리서치 3편이다.

권장 역할:
1. Problem — 책이 제기한 문제를 외부 연구와 데이터로 확장
2. Concept — 책의 핵심 개념을 이론/구조로 확장
3. Action — 독자가 일상과 업무에 적용할 행동으로 번역

각 리서치에는 반드시 아래 내부링크를 둔다.

- 책 상세페이지
- 웹 리더
- 시리즈 이전/다음 글
- 마인드맵 또는 Research Hub 중 하나

Research footer 권장 구조:

**이 글은 JoyLab Books 『{book}』 Reader Pack V2의 관련 리서치입니다.**

- 책 소개 보기 →
- 웹 리더로 읽기 →
- 마인드맵으로 보기 →
- 다음 리서치 →

## 6. SEO contract

Book Detail:
- index,follow
- self canonical
- Book schema
- OG 16:9
- breadcrumb
- sitemap include

Reader:
- 기본 noindex,follow
- canonical → Book Detail

Mindmap:
- 기본 noindex,follow 권장
- canonical → Book Detail 또는 별도 interactive canonical 정책을 명시

Research:
- index,follow
- self canonical
- Article schema
- Book Detail 양방향 internal link

FAQ 권장 3~5개:
- 이 책은 누구에게 맞는가?
- 웹 리더와 전자책은 무엇이 다른가?
- 마인드맵에서는 무엇을 볼 수 있는가?
- 관련 리서치는 왜 함께 읽는가?
- 책의 핵심 개념은 무엇인가?

## 7. Analytics contract

필수 events:

- `book_detail_view`
- `book_reader_start`
- `book_reader_progress_25`
- `book_reader_progress_50`
- `book_reader_progress_75`
- `book_reader_complete`
- `book_mindmap_open`
- `book_related_research_click`
- `book_books_hub_click`

필수 dimensions:
- target: book slug
- placement
- path

핵심 KPI:
- Detail → Reader conversion
- Reader 50% retention
- Reader completion rate
- Reader → Mindmap conversion
- Detail/Reader → Research CTR
- Research → Book return CTR

## 8. GOLD release gate

### Required

- [ ] Cover 2:3 exists
- [ ] OG 16:9 exists
- [ ] Book Detail 200
- [ ] Reader 200
- [ ] Mindmap 200
- [ ] Research 3편 200
- [ ] 모든 내부링크 정상
- [ ] Book schema valid
- [ ] sitemap includes Book Detail + Research
- [ ] PC 1440 visual QA
- [ ] Mobile 390 visual QA
- [ ] Build GREEN
- [ ] Production Deploy GREEN
- [ ] Production Smoke GREEN

### Recommended

- [ ] SNS 1:1
- [ ] FAQ
- [ ] Reader completion CTA
- [ ] Research reciprocal links
- [ ] analytics dashboard
- [ ] Reader Pack launch card

## 9. Weight of Silence V2 reference implementation

Book:
**『악보의 쉼표 사이에 고여 있는 침묵의 무게』**

Slug:
`weight-of-silence`

Flow:

`/books/weight-of-silence`
→ `/books/weight-of-silence/interactive.html`
→ `/books/weight-of-silence/mindmap.html`
→ Research Cluster
→ `/books/weight-of-silence`

Research Cluster:

1. `/articles/why-we-cannot-tolerate-silence`
2. `/articles/bach-counterpoint-order-in-complexity`
3. `/articles/burnout-recovery-starts-with-stopping`

Series:
**침묵의 기술**

## 10. Weight of Silence CTA map

### Book Hero
Primary:
**웹 리더로 읽기 →**

Secondary:
**마인드맵으로 보기 →**

### About section
**책의 핵심 구조를 먼저 보고 싶다면 마인드맵으로 보기 →**

### Related Research
Heading:
**책 밖에서 더 깊이 생각하기**

Subcopy:
**『악보의 쉼표 사이에 고여 있는 침묵의 무게』가 던진 질문을 심리학·음악인지·직무회복 연구로 확장합니다.**

### Reader Complete
1. **읽은 생각을 마인드맵으로 정리하기 →**
2. **침묵의 기술 리서치 3편 읽기 →**
3. **책 소개로 돌아가기 →**

### Research Footer
**이 글은 JoyLab Books 『악보의 쉼표 사이에 고여 있는 침묵의 무게』 Reader Pack V2의 관련 리서치입니다.**

## 11. Definition of Done

Reader Pack V2는 파일이 존재한다고 완료가 아니다.

다음 흐름이 실제 Production에서 끊김 없이 동작해야 한다.

**Discover → Understand → Read → Explore → Research → Return**

그리고 각 전환을 Analytics로 확인할 수 있어야 한다.

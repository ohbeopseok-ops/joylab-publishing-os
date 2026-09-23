# JoyLab Books Reader Pack V2

> Version: 2.0  
> Status: STANDARD  
> Owner: JoyLab Books  
> Purpose: 책 한 권을 단일 전자책이 아니라 상세페이지 → 웹 리더 → 마인드맵 → 관련 리서치 → Books Hub로 순환하는 지식 패키지로 운영한다.

## 1. 목표

Reader Pack V2의 완료 조건은 파일 보유가 아니라 **독자가 다음 행동으로 자연스럽게 이동하는 연결 구조**다.

핵심 여정:

```
Book Detail
  ↓
Web Reader
  ↓
Interactive Mindmap
  ↓
Research Cluster (3+)
  ↓
Book Detail / Next Research / Books Hub
```

## 2. 필수 구성

### A. Book Detail
필수:
- 2:3 Cover
- 16:9 OG
- 제목 / 부제 / 저자 / 발행 정보
- 한 줄 가치 제안
- 추천 독자
- 핵심 포인트
- 전체 목차
- 책 속 문장
- 저자 소개
- Web Reader CTA
- Mindmap CTA
- Related Research 3편

표준 CTA:
- `웹 리더로 읽기`
- `마인드맵으로 보기`
- `관련 리서치 읽기`
- `JoyLab Books 전체 보기`

### B. Web Reader
필수:
- 목차 탐색
- 읽기 진행률
- 글자 크기
- 명조/고딕
- 줄간격
- 화면 테마
- 이전/다음 장
- 마지막 읽은 위치 저장
- 완료 시 다음 행동 CTA

종료 CTA 우선순위:
1. `이 책의 구조를 마인드맵으로 보기`
2. `관련 리서치로 생각 확장하기`
3. `책 소개로 돌아가기`

### C. Interactive Mindmap
필수:
- 핵심 개념
- 부/장 구조
- 장별 1문장 요약
- 확대/축소
- 펼치기/접기
- 검색
- Web Reader 복귀
- Book Detail 복귀
- Related Research 진입

### D. Research Cluster
기본 3편:
1. Problem Definition — 책이 제기한 문제를 외부 세계로 확장
2. Concept Expansion — 책의 개념·비유·이론을 깊게 해석
3. Action Translation — 독자가 일상과 업무에 적용할 실행 구조 제공

각 글 하단 필수 링크:
- 이 책 만나보기
- 웹 리더로 읽기
- 같은 클러스터의 다음 글

## 3. 데이터 계약

Books content frontmatter optional fields:

```yaml
mindmapPath: "/books/<slug>/mindmap.html"
relatedArticleIds:
  - "article-slug-1"
  - "article-slug-2"
  - "article-slug-3"
```

규칙:
- `relatedArticleIds`가 있으면 지정 순서대로 상세페이지에 노출한다.
- 없으면 기존 category 최신글 3편 fallback을 유지한다.
- `mindmapPath`가 있으면 Hero와 탭에 Mindmap CTA를 자동 노출한다.

## 4. Analytics Contract

필수 이벤트:
- `book_detail_view`
- `book_reader_start`
- `book_reader_progress_25`
- `book_reader_progress_50`
- `book_reader_progress_75`
- `book_reader_complete`
- `book_mindmap_open`
- `book_related_research_click`

모든 CTA는 가능하면:
- event
- target
- placement
를 함께 기록한다.

핵심 KPI:
- Detail → Reader CTR
- Reader 50% 도달률
- Reader Completion Rate
- Reader → Mindmap CTR
- Detail/Reader → Research CTR
- Research → Book Return CTR

## 5. SEO Contract

필수:
- SEO title
- meta description
- canonical
- cover alt
- OG 16:9
- Book schema
- breadcrumb
- sitemap
- 내부링크
- 관련 리서치 3편

권장:
- FAQ 3~5개
- Research Cluster series name
- 관련 리서치 간 Previous / Next

## 6. Visual Asset Standard

| Asset | Ratio | Recommended |
|---|---:|---:|
| Cover | 2:3 | 1600×2400 |
| OG | 16:9 | 1200×675 |
| SNS Square | 1:1 | 1200×1200 |
| Social Portrait | 4:5 | 1080×1350 |

원칙:
- 썸네일에서도 제목을 읽을 수 있어야 한다.
- Cover와 OG는 동일한 상징 체계를 유지한다.
- 이미지 안 텍스트와 HTML title을 이중 검수한다.

## 6.1 Image Immutable Path Gate

Reader Pack의 Cover, OG, Hero가 이미 Production에 노출된 경로를 교체해야 할 경우 기존 URL을 덮어쓰지 않는다.

필수 규칙:
- 한 번이라도 Production에 사용된 이미지 파일명은 새 캐시 키로 재사용하지 않는다.
- 교체 시 새 immutable filename을 사용한다. 예: `book-slug-og-v2.webp`, `article-slug-hero-v3.webp`.
- Book Detail, Web Reader, Research Hero, Open Graph, JSON-LD, CSS/manifest 참조를 같은 PR에서 새 경로로 통일한다.
- 배포 전 full image decode, 배포 후 direct asset 200 및 Production Smoke를 통과해야 한다.
- 이전 검증 자산은 신규 Production Gate가 GREEN이 될 때까지 rollback용으로 유지한다.

공통 배포 규칙은 [IMAGE_CACHE_BUSTING.md](./IMAGE_CACHE_BUSTING.md)를 따른다.

Reader Pack GOLD 조건에 다음을 추가한다.
- [ ] 신규 이미지 경로가 과거 Production 경로를 재사용하지 않음
- [ ] Hero/OG/JSON-LD/manifest 참조가 동일 immutable path로 정렬됨
- [ ] Asset Integrity Gate GREEN
- [ ] Superseded active image reference 0

## 7. GOLD Release Gate

### Required
- [ ] Book Detail 정상
- [ ] Web Reader 정상
- [ ] Mindmap 정상
- [ ] Related Research 3편 연결
- [ ] 양방향 내부링크
- [ ] Cover 존재
- [ ] OG 존재
- [ ] Analytics CTA 적용
- [ ] Astro Build GREEN
- [ ] Visual QA GREEN
- [ ] Production Deploy GREEN
- [ ] Production Smoke GREEN
- [ ] 실서비스 200 확인

### Optional
- [ ] PDF
- [ ] EPUB
- [ ] Newsletter CTA
- [ ] 판매 CTA
- [ ] Reader note/highlight
- [ ] SNS 1:1 / 4:5 assets

## 8. 페이지 구조 표준

### Book Detail
```
Hero
 ├─ 웹 리더로 읽기
 ├─ 마인드맵으로 보기
 └─ 전체 목차 보기
About
Recommended For
TOC
Author
Research Cluster
Closing CTA
```

### Research Article Footer
```
READ NEXT
 ├─ 책 만나보기
 ├─ 웹 리더로 읽기
 └─ 다음 리서치
```

## 9. 현재 적용 사례

### 악보의 쉼표 사이에 고여 있는 침묵의 무게
- Book: `/books/weight-of-silence`
- Reader: `/books/weight-of-silence/interactive.html`
- Mindmap: `/books/weight-of-silence/mindmap.html`
- Research 01: `/articles/why-we-cannot-stand-silence`
- Research 02: `/articles/bach-counterpoint-order-in-chaos`
- Research 03: `/articles/burnout-recovery-starts-with-pause`

## 10. 운영 원칙

Reader Pack V2는 “책에 부가 콘텐츠를 붙이는 프로젝트”가 아니다.

**책을 중심으로 읽기, 구조화, 탐구, 실행이 순환하는 JoyLab의 지식 제품 표준**이다.

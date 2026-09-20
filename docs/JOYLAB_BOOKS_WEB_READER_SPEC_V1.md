# JoyLab Books + Web Reader Implementation Spec V1

Status: PROPOSED
Target site: https://aijoylab.kr/
Target repo: ohbeopseok-ops/joylab-publishing-os

## 1. Goal

JoyLab에 Books 콘텐츠 타입을 추가한다. 기존 research article 도메인과 분리한다.

첫 책:
- 제목: 완벽하지 않아서 스며들 수 있었다
- 저자: 오법석
- 랜딩: /books/완벽하지-않아서-스며들-수-있었다
- 리더: /books/완벽하지-않아서-스며들-수-있었다/read

기본 공개 정책:
- 랜딩: index,follow
- 리더: noindex,follow
- 리더 canonical: 랜딩 URL
- 무료 미리보기: 작가의 말 + 1장
- access: full 로 바꾸면 전체 공개

## 2. Why Books must be separate from Articles

현재 article UX는 Research Brief, Key Takeaways, Fact → Interpretation → Scenario → Action, Related Research 중심이다.

책은 cover, parts/chapters, persistent TOC, reading position, typography controls, preview/full access가 핵심이다.

따라서 books는 articles와 별도 content domain으로 둔다.

## 3. Route contract

/books/
- Books hub

/books/완벽하지-않아서-스며들-수-있었다
- SEO landing

/books/완벽하지-않아서-스며들-수-있었다/read
- Web reader

V1은 단일 reader URL + in-page chapter navigation으로 간다.

## 4. Proposed repository structure

src/
- components/
  - BookSchema.astro
  - BookLandingHero.astro
  - BookToc.astro
  - BookReaderShell.astro
  - BookReaderControls.astro
- data/
  - books/
    - 완벽하지-않아서-스며들-수-있었다.md
  - book-chapters/
    - imperfect/
      - 00-authors-note.md
      - 01-chapter.md
      - 02-chapter.md
      - 03-chapter.md
      - 04-chapter.md
      - 05-chapter.md
      - 06-chapter.md
      - 07-chapter.md
      - 08-chapter.md
      - 09-chapter.md
      - 10-epilogue.md
- pages/
  - books/
    - index.astro
    - [...slug].astro
    - [...slug]/read.astro
- styles/
  - books.css
  - book-reader.css

public/
- books/
  - imperfect/
    - cover.webp
    - og.webp

## 5. Content collection contract

src/content.config.ts 에 books와 bookChapters 컬렉션을 추가한다.

books fields:
- title: string
- subtitle: optional string
- description: string
- author: string
- publishedAt: date
- updatedAt: optional date
- coverImage: string
- ogImage: optional string
- heroQuote: optional string
- category: default 성장·리더십
- tags: string[]
- isbn: optional string
- publisher: optional string
- format: web | epub | pdf
- access: preview | full
- previewChapterCount: integer, default 1
- canonical: optional string
- draft: boolean

bookChapters fields:
- bookSlug: string
- order: integer
- part: optional string
- title: string
- label: optional string
- preview: boolean

export collections:
- articles
- books
- bookChapters

## 6. First book metadata

title: 완벽하지 않아서 스며들 수 있었다
subtitle: 팽창과 수축의 계절을 지나 나만의 찻물을 들이기까지
description: 완벽해지려 애쓰다 멈춰 선 한 사람이 자신의 균열을 바라보고 다시 삶의 온기를 받아들이는 과정을 기록한 에세이.
author: 오법석
publishedAt: 2026-09-20
category: 성장·리더십
tags: 완벽주의, 번아웃, 회복, 에세이
coverImage: /books/imperfect/cover.webp
ogImage: /books/imperfect/og.webp
heroQuote: 금이 갔기에, 우리는 비로소 깨어지지 않을 수 있었다.
format: web
access: preview
previewChapterCount: 1
draft: false

실제 ISBN/publisher가 확정되기 전에는 placeholder를 넣지 않는다.

## 7. Books hub

Route: /books/

역할:
- JoyLab Books 전체 발견
- 향후 2권 이상으로 확장 가능한 허브
- 책을 단순 파일이 아니라 JoyLab IP로 노출

최소 UI:
- Books kicker
- cover
- title
- one-line description
- category
- preview CTA

본문 전체는 허브에 넣지 않는다.

## 8. Book landing

Route: /books/완벽하지-않아서-스며들-수-있었다

섹션:
1. Book hero
2. Core quote
3. Book introduction
4. Who this book is for
5. Table of contents
6. Preview
7. Author
8. CTA

Primary CTA:
작가의 말과 1장 읽기 →

Secondary CTA:
목차 보기

## 9. Reader architecture

Route: /books/완벽하지-않아서-스며들-수-있었다/read

기존 research article template을 재사용하지 않고 dedicated reader shell을 사용한다.

필수 기능:
- TOC drawer
- chapter indicator
- reading progress
- font size
- font family
- line height
- light / warm / dark theme
- previous chapter
- next chapter
- saved reading position

localStorage keys:
- joylab-book-reader-theme
- joylab-book-reader-font
- joylab-book-reader-size
- joylab-book-reader-line-height
- joylab-book-imperfect-position

프로덕션 리더에서 Tailwind CDN과 Google Fonts CDN은 사용하지 않는다.
사이트 CSS와 시스템 폰트 fallback을 사용한다.

## 10. Preview access rule

Default V1:
- 작가의 말: OPEN
- 1장: OPEN
- 2~9장: LOCKED
- 에필로그: LOCKED

access: full 이면 모든 장 공개.

중요:
CSS로만 숨기면 안 된다.
preview mode에서는 locked chapter 본문 자체를 생성 HTML에 포함하지 않는다.

## 11. SEO contract

Landing:
- index,follow
- canonical self

권장 title:
완벽하지 않아서 스며들 수 있었다 | 오법석 에세이 | JoyLab

권장 description:
완벽해지려 애쓰다 멈춰 선 한 사람이 자신의 균열을 바라보고 다시 삶의 온기를 받아들이는 과정을 기록한 오법석의 에세이.

Reader:
- noindex,follow
- canonical = landing URL

목적:
- landing / reader 중복 방지
- 검색 신호를 랜딩에 집중
- 링크 탐색은 유지

## 12. Book structured data

src/components/BookSchema.astro 추가.

landing에만 출력.

최소 연결:
Organization → Person → Book → WebPage

Book fields:
- @type Book
- @id landing#book
- name
- author @id https://aijoylab.kr/#founder
- url
- inLanguage ko-KR
- image if real
- isbn only when real
- publisher only when real
- datePublished

placeholder ISBN은 절대 출력하지 않는다.

## 13. BaseLayout change

optional prop 추가:
robots = index,follow

head에 meta robots를 출력한다.

Reader는 robots=noindex,follow로 호출한다.

## 14. Navigation

책이 1권뿐일 때는 primary nav에 Books를 바로 올리지 않는다.

V1:
- Home 또는 Growth/Leadership guide에 Books section
- Footer에 Books link
- 관련 성장·리더십 글에서 book landing 내부 링크

책이 2권 이상이면 primary nav 승격 검토.

## 15. Analytics events

- book_landing_view
- book_preview_start
- book_reader_chapter_view
- book_reader_progress_25
- book_reader_progress_50
- book_reader_progress_75
- book_reader_complete
- book_cta_click

payload:
- book_slug
- chapter
- progress

읽고 있는 실제 문장 텍스트는 analytics로 보내지 않는다.

## 16. Migration from current standalone HTML

현재 전자책 HTML은 source material로 취급하고 그대로 production에 복사하지 않는다.

Migration:
1. metadata 추출
2. 작가의 말 / 1~9장 / 에필로그 분할
3. chapter body를 Markdown으로 이전
4. 의도적 시적 행갈이 유지
5. reader CSS를 book-reader.css로 이동
6. reader JS를 site-owned script로 이동
7. Tailwind CDN 제거
8. Google Fonts CDN 제거
9. placeholder 서지정보 제거
10. 기존 TOC label을 chapter metadata에 매핑

## 17. Reader content rendering

시적 행갈이는 책의 문체 일부이므로 보존한다.

book prose:
- white-space: pre-line
- word-break: keep-all
- line-height: 약 2.05
- max-width: 720px

Desktop:
- body 18px
- line-height 2.0~2.1

Mobile:
- body 17px
- line-height 1.95~2.05
- horizontal padding 20~24px

## 18. Launch QA

Hard gate:
- landing 200
- reader 200
- draft/locked chapter leak 없음
- preview mode에서 locked body text가 HTML에 없음
- landing canonical 정상
- reader noindex
- Book JSON-LD parse 성공
- placeholder ISBN 없음
- cover/OG image 정상
- chapter order deterministic
- prev/next 정상
- mobile TOC selection 후 닫힘
- reader preference 저장
- build success

Visual:
- iPhone width
- Android width
- 768 tablet
- 1440 desktop
- dark mode
- 200% font size

## 19. Implementation PR split

PR A — Books Domain Core
- collections
- metadata
- chapter migration
- Books hub
- landing

PR B — Web Reader
- reader route
- controls
- TOC
- persistence
- preview/full access

PR C — Book SEO + Analytics Gate
- BookSchema
- robots/canonical
- schema self-test
- reader noindex test
- analytics events

세 개를 한 PR로 합치지 않는다.

## 20. GOLD CASE

Book:
완벽하지-않아서-스며들-수-있었다

Expected:
Landing
- 200
- indexable
- Book schema valid
- canonical self

Reader
- 200
- noindex,follow
- canonical landing
- 작가의 말 visible
- 1장 visible
- 2장 body absent in preview mode

Mobile
- TOC usable
- progress updates
- font setting persists
- theme setting persists

## 21. Definition of Done

사용자가 다음 흐름을 완주할 수 있으면 V1 완료다.

JoyLab
→ Book landing
→ 책의 성격 파악
→ 목차 확인
→ 미리보기 시작
→ 작가의 말 + 1장 읽기
→ 재방문 시 읽던 위치 복원

그리고 동시에:
- 비공개 장 본문이 HTML에 노출되지 않아야 한다.
- landing SEO 신호가 reader에 분산되지 않아야 한다.

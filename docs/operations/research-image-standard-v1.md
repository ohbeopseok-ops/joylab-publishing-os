# JoyLab Research Image Standard v1.0

## Purpose

모든 published research가 최소한의 시각 품질을 갖춘 상태로 발행되도록 Hero·보조 시각자료·alt·caption을 표준화한다. 이 문서는 Editor SOP이며, CI의 `Research Image Gate`가 누락을 자동 차단한다.

## Scope

- `src/data/articles/*.md`
- `draft: false`
- `series` 값이 있는 모든 published research

## Mandatory Contract

### 일반 리서치

1. Hero Image: 1장
2. Supporting Visual: 정확히 2장
3. 모든 이미지에 `src`, `alt` 필수
4. caption 권장, Hero caption 권장

### 비교형·밸류체인형 리서치

- Hero 1장
- Supporting Visual 2~3장 허용
- 비교형 판정: slug 또는 제목에 `compare`, `vs`, `value-chain`, `비교`, `밸류체인` 포함

## Visual Roles

### Hero

검색·SNS·기사 첫 화면에서 주제를 즉시 이해시키는 16:9 대표 이미지. 데이터 표 자체를 Hero로 대체하지 않는다. 우선순위는 JoyLab 프리미엄 금융·산업 에디토리얼 스타일이다.

### Supporting Visual 1 — Signal

핵심 수치, 방향, 변화 신호, 전후 비교를 압축한다. 독자가 본문을 읽기 전에 “무엇이 바뀌었는가”를 이해해야 한다.

### Supporting Visual 2 — Framework

Fact → Interpretation → Scenario → Action 또는 해당 글의 전달 구조를 시각화한다.

### Supporting Visual 3 — Compare Optional

기업 비교, 밸류체인, 선택지 비교 글에서만 사용한다. 강점·리스크·촉매·밸류에이션·수급처럼 동일 기준을 좌우 비교한다.

## Quality Levels

### PASS

- Hero 1 + Supporting 2 이상
- 비교형은 최대 3
- asset 존재
- alt 존재
- 기사 내용과 시각자료 역할이 연결됨

### RETRY

- 이미지 수는 충족하지만 기본 AUTO-BASELINE만 사용하고 있어 핵심 트래픽 글의 개별 데이터 시각화가 필요한 상태
- 또는 caption·시각 밀도·메시지 명확성 개선 필요

### FAIL

- Hero 없음
- Supporting 2장 미만
- asset 파일 없음
- alt 없음
- 일반 글에서 Supporting 3장을 초과

## Editor Workflow

1. 글 작성 전 핵심 주장 1개와 시각화 가능한 데이터/구조 2개를 정한다.
2. Hero는 “기사 주제 한눈에 이해”를 목표로 만든다.
3. 본문 Visual Research에는 Signal → Framework 순으로 배치한다.
4. 비교형·밸류체인형이면 필요할 때 Compare 한 장을 추가한다.
5. 전용 이미지가 아직 없으면 AUTO-BASELINE을 사용해 발행 누락을 막는다.
6. 검색유입·체류·공유가 높은 글은 CURATED 이미지로 승격한다.
7. PR에서 `Research Image Gate`가 PASS하지 않으면 merge하지 않는다.

## CI Contract

`scripts/check-research-images.mjs`가 다음을 검사한다.

- 모든 published series article이 manifest에 등록됐는가
- Hero 1장 존재
- Supporting 2장 이상
- 일반 글은 Supporting 정확히 2장
- 비교·밸류체인형은 Supporting 최대 3장
- 모든 asset이 실제 `public/` 아래 존재
- 모든 이미지에 alt 존재

## Operating Principle

**이미지는 장식이 아니라 리서치의 주장과 판단 구조를 압축하는 자산이다.**

AUTO-BASELINE은 누락 방지선이고, CURATED는 품질 상한선이다.

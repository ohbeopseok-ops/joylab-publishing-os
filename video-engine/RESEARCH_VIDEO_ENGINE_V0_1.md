# JOYLAB Research → Video Engine V0.1

## 목적
JoyLab Research를 원본(Source of Truth)으로 유지하면서, 소스 기반 AI 영상 도구를 이용해 설명형 영상을 만들고 YouTube와 aijoylab.kr을 양방향으로 연결한다.

## 핵심 원칙
1. 원본은 항상 `src/data/articles/<slug>.md`다.
2. AI는 원본을 요약·재구성할 수 있지만 Source Pack에 없는 사실·수치·전망을 추가하지 않는다.
3. 투자·경제 영상은 자동 게시하지 않는다. `FACT_REVIEW → APPROVED`를 사람 검수로 통과해야 한다.
4. YouTube 공식 채널 링크는 Video Engine 구축만으로 자동 활성화하지 않는다.
5. 실제 게시 영상 3편 이상과 Activation Gate 통과 후 별도 PR로 공식 채널을 활성화한다.

## 상태 머신
`SOURCE_READY → VIDEO_DRAFT → FACT_REVIEW → APPROVED → PUBLISHED → MEASURED`

- SOURCE_READY: Source Pack 계약 충족
- VIDEO_DRAFT: 소스 기반 AI 영상 초안 생성
- FACT_REVIEW: 숫자·날짜·고유명사·인과관계 검수
- APPROVED: 게시 승인
- PUBLISHED: YouTube URL/ID, 업로드일, 썸네일, duration 확정
- MEASURED: 조회가 아니라 사이트 유입·체류·후속 리서치 소비까지 측정

## 입력
- Article slug
- Article Markdown
- Evidence Lock
- Numbers Lock
- Video Brief

## Source Pack
각 영상은 아래 5개 파일을 기본으로 갖는다.

- `01_RESEARCH.md`: 원본 리서치 스냅샷
- `02_EVIDENCE.md`: 사실/해석 분리 및 출처
- `03_NUMBERS.json`: 영상에서 사용 가능한 숫자 화이트리스트
- `04_VIDEO_BRIEF.md`: 타깃, 훅, 흐름, 금지사항, CTA
- `manifest.json`: 전체 파일·상태·원본 연결 계약

선택 출력:
- `05_YOUTUBE_PACK.md`: 제목, 설명, 챕터, 썸네일 카피 초안

## Notebook 실행 규칙
1. `01_RESEARCH.md`, `02_EVIDENCE.md`, `03_NUMBERS.json`, `04_VIDEO_BRIEF.md`를 같은 노트북에 소스로 넣는다.
2. Video Brief의 `MUST INCLUDE`, `DO NOT ADD`, `ENDING CTA`를 생성 지시의 최상위 규칙으로 사용한다.
3. 영상 생성 후 `VIDEO GOLD V0.1`로 검수한다.
4. FACT FAIL이면 재생성 또는 편집한다. 우회 승인하지 않는다.

## 사이트 연결
Article frontmatter의 `video.status`가 `published`일 때만:
- Article Video UI 노출
- YouTube embed 노출
- Article JSON-LD가 `#video`를 참조
- `VideoObject` JSON-LD 생성

`planned`/`review` 상태에서는 사이트에 영상 플레이어를 노출하지 않는다.

## Analytics V0.1
- `article_video_click`
- target: `youtube`
- placement: `article_video`
- page path로 어떤 리서치에서 영상으로 이동했는지 식별

## Activation Gate
YouTube OFFICIAL 링크 재활성화 조건:
- Long-form 게시 3편 이상
- 3편 모두 VIDEO GOLD PASS
- 채널 About/브랜딩 정리
- 영상 Description → canonical Research URL + UTM
- Article ↔ Video 양방향 링크
- VideoObject 검증 PASS
- Production smoke PASS

Gate 이전에는 About/Footer/Organization sameAs에 YouTube를 넣지 않는다.

## 완료 기준 V0.1
- Source Pack 계약 존재
- VIDEO GOLD 계약 존재
- Pilot 1 Source Pack PASS
- Article video metadata 계약 존재
- Published일 때만 Article Video/VideoObject 활성화
- YouTube 공식 채널은 계속 비활성 상태
- CI `Video Engine GOLD` PASS

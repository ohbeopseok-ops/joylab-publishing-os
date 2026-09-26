# Books Funnel Dashboard V1

## 목적
JoyLab Books의 전환 흐름을 **책 상세 방문 → 무료 미리보기 시작 → 읽기 깊이 → 구매 CTA 클릭**으로 측정한다.

## 이벤트 계약

| Event | Trigger | target | placement |
|---|---|---|---|
| book_landing_view | /books/:slug 진입 | book slug | book_landing |
| book_preview_start | 무료 읽기 CTA 클릭 | book slug | hero / toc / closing |
| book_reader_view | /books/:slug/read 진입 | book slug | book_reader |
| book_read_25 | 공개 리더 영역 25% 도달 | book slug | book_reader |
| book_read_50 | 공개 리더 영역 50% 도달 | book slug | book_reader |
| book_read_75 | 공개 리더 영역 75% 도달 | book slug | book_reader |
| book_read_100 | 공개 리더 영역 95% 이상 도달 | book slug | book_reader |
| book_purchase_cta_click | 외부 판매 CTA 클릭 | book slug | hero / lockwall / closing |

기존 /__analytics/event 계약의 event / target / placement / path만 사용한다.

## 핵심 KPI
1. Landing → Preview Start = preview_start / landing_view
2. Preview Activation = reader_view / preview_start
3. 25% Read Rate = read_25 / reader_view
4. 50% Read Rate = read_50 / reader_view
5. 75% Read Rate = read_75 / reader_view
6. Preview Completion = read_100 / reader_view
7. Purchase Intent = purchase_cta_click / reader_view
8. Deep Reader → Purchase Intent = purchase_cta_click / read_75

## Dashboard Layout

### Row 1 · Acquisition
- Landing Views
- Preview Starts
- Landing → Preview %

### Row 2 · Reading
- Reader Views
- 25%
- 50%
- 75%
- 100%

### Row 3 · Conversion
- Purchase CTA Clicks
- Reader → Purchase %
- 75% Reader → Purchase %

### Row 4 · Diagnostic
- Hero / TOC / Closing CTA별 Preview Start
- Book slug 비교
- 모바일/PC 분리는 원천 데이터가 확보되는 V2에서 추가

## Series 01 기준
- slug: problem-to-service
- 공개 범위: 프롤로그 + Chapter 1
- CTA: 프롤로그와 1장 무료 읽기
- 판매 CTA: 실제 판매 URL 확정 후 활성화

## 초기 내부 허들
아래 숫자는 업계 벤치마크가 아니라 Series 01에서 첫 기준선을 만들기 위한 내부 가설이다.
- Landing → Preview < 20%: Hero·책소개·CTA 점검
- Reader View / Preview Start < 85%: 리더 진입 UX 점검
- 25% Read < 60%: 첫 화면·프롤로그 점검
- 50% Read < 40%: 문장 밀도·미리보기 분량 점검
- 75% Read < 25%: Chapter 1 연결력 점검
- Purchase Intent < 5%: 상품 제안·가격·CTA 위치 점검

최소 7일 또는 Landing 100회 중 늦게 충족되는 시점까지는 절대값보다 방향성을 우선한다.

# JoyLab 미국 금리 리서치 · TIC 업데이트 SOP

## 목적

미국 재무부 TIC 월간 발표가 나올 때 Rates Dashboard의 숫자와 장기 리서치의 해석을 혼동하지 않고 안전하게 갱신한다.

## 자동 영역

`Rates Dashboard Refresh` GitHub Actions가 평일 22:15 UTC에 실행된다.

1. FRED DGS10에서 미국 10년물 최신값 확인
2. FRED DGS30에서 미국 30년물 최신값 확인
3. FRED DEXKOUS에서 원·달러 최신값 확인
4. U.S. Treasury `slt_table5.txt`에서 최신 TIC 기준월과 Grand Total 확인
5. 범위 검증
   - 10Y: 1~10%
   - 30Y: 1~10%
   - USD/KRW: 500~2500
   - 외국인 미 국채 보유: 1~20조 달러
6. Astro Production Build 통과
7. `src/data/rates-dashboard.json`에 변경이 있을 때만 main에 데이터 커밋
8. Cloudflare 배포 및 기존 Production Smoke Test 실행

## TIC 신규 기준월 감지 시

기존 `period`와 신규 `period`가 다르면 GitHub Issue를 자동 생성한다.

### 반드시 사람이 검증할 항목

- Major Foreign Holders Table 5 원문 기준월
- Grand Total
- Japan
- United Kingdom
- China, Mainland
- Foreign Official
- 전월 대비 변화
- 12개월 대비 변화
- 보유잔액 변화와 순매수·순매도 흐름의 구분

## 업데이트 대상

1. `src/data/articles/china-us-treasury-holdings-2026.md`
2. `src/data/articles/who-buys-us-treasuries-2026.md`
3. `public/images/research/us-treasury-major-holders-jun-2026.svg` 또는 신규 기준월 차트
4. Hero caption / Sources / 기준일
5. `/guides/us-rates` Rates Dashboard와 Research Path

## 편집 원칙

### 자동 수정 허용

- 객관적 시장 숫자
- 데이터 기준일
- TIC 최신 기준월
- Dashboard status

### 자동 수정 금지

- “위기”, “투매”, “붕괴” 같은 해석 문구
- 투자 시나리오의 임계값 변경
- 중국·일본·영국의 정책 의도 추정
- 기존 리서치 결론 변경

위 항목은 반드시 최신 1차 출처와 Reuters 등 2차 검증 후 PR에서 수정한다.

## Release Gate

TIC 리서치 업데이트는 다음 조건을 모두 충족해야 한다.

- [ ] 1차 출처 확인
- [ ] Fact / Interpretation 분리
- [ ] 국가별 숫자 재계산
- [ ] 차트 숫자와 본문 숫자 일치
- [ ] `npm run build` PASS
- [ ] JoyLab identity schema PASS
- [ ] Analytics contract PASS
- [ ] main merge
- [ ] Cloudflare deploy PASS
- [ ] Production smoke PASS

## 2026-09-16 특별 운영

미 재무부 공식 일정상 2026년 9월 16일 16:00 ET에 2026년 7월 TIC 데이터가 발표될 예정이다. 한국시간으로는 9월 17일 새벽이다.

발표 직후 자동 Dashboard가 신규 기준월을 감지하면 Editorial Issue를 생성하고, 위 5개 업데이트 대상을 PR 단위로 갱신한다.

# TIC Monthly Research Runtime v1.0

## Purpose
매월 미국 재무부 TIC 발표를 JoyLab 미국 금리 리서치에 안전하게 반영한다. 숫자 갱신은 자동화하되 해석 변경은 반드시 검증 PR을 거친다.

## Trigger
- Primary trigger: `rates-dashboard.yml`이 기존 TIC period와 새 period의 차이를 감지
- Source of truth: U.S. Treasury TIC Major Foreign Holders Table 5 + monthly TIC press release
- Runtime activation condition: 2026-09-17 최초 7월 TIC 갱신이 Build/Deploy/Smoke까지 정상 완료된 후 월간 표준 운영으로 유지

## Runtime Flow
1. **Detect** — 새 TIC 기준월 감지
2. **Validate** — Grand Total, China, Japan, UK, Foreign Official 데이터 범위 및 전월 대비 변화 검증
3. **Refresh Data** — `src/data/rates-dashboard.json` 기준월과 보유액 갱신
4. **Open Editorial Issue** — 새 period별 단일 이슈 생성
5. **Research Refresh** — 아래 문서의 수치·문장·표·차트 업데이트
   - `china-us-treasury-holdings-2026.md`
   - `who-buys-us-treasuries-2026.md`
   - `/guides/us-rates`
6. **Interpretation Gate** — '투매', '위기', '탈달러', 정책 의도, 투자 등급 변경은 자동 작성 금지
7. **PR Gate** — 별도 브랜치 → PR → Astro Build green
8. **Production Gate** — Merge → Cloudflare Deploy → Production Smoke Test
9. **Close Loop** — Editorial Issue에 변경 수치, 해석 변화, 배포 결과 기록 후 종료

## Mandatory Metrics
- Foreign Total Treasury Holdings
- Foreign Official Holdings
- China Mainland
- Japan
- United Kingdom
- MoM delta
- YoY delta
- Monthly long-term securities flow
- Official vs Private flow

## Risk Escalation
### GREEN
- 데이터 변화가 최근 범위 내
- 기존 구조적 해석 유지

### YELLOW
- 주요국 MoM 변화가 크거나 Foreign Official 수요가 유의하게 둔화
- 10Y/30Y/FX 중 하나 이상 경계구간
- 추가 검토 후 문구 수정

### RED
- TIC 수요 악화와 장기금리 급등, 입찰 약화, 달러 스트레스가 동시에 발생
- 기존 투자 시나리오와 Pillar 상단 위험등급 재검토

## Editorial Rules
- `holdings decline`과 `net selling`을 동일시하지 않는다.
- 국가별 수탁 위치와 최종 실소유자 문제를 명시한다.
- 국가별 보유액과 월간 거래 흐름을 별도 통계로 표시한다.
- 소셜미디어 수치보다 Treasury 1차 데이터를 우선한다.
- Reuters 등 2차 소스는 맥락·시장반응 검증에 사용한다.

## Definition of Done
- Source URLs verified
- Dashboard period updated
- Article numbers reconciled
- Comparison chart regenerated when values change
- `npm run build` PASS
- PR merged
- Cloudflare deploy PASS
- Production smoke PASS
- Runtime issue closed with audit trail

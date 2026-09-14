# JoyLab Browser Agent Benchmark Dashboard V1.0

## 목적

Aside / ChatGPT Work / Playwright의 실측 결과를 한 화면에서 비교하고, Aside가 JoyLab Factory의 Browser Execution Layer로 승격 가능한지 판단한다.

## 데이터 소스

- Policy: `config/browser-agent-benchmark-policy.json`
- Raw Scorecard: `src/data/browser-agent-benchmark-scorecard.json`
- Evaluator: `scripts/evaluate-browser-agent-benchmark.mjs`
- Derived Summary: `node scripts/evaluate-browser-agent-benchmark.mjs --write-summary`

## 핵심 KPI 카드

1. **Aside Overall Score** — S01~S10 시나리오 평균
2. **Coverage** — 완료 시나리오 수 / 10
3. **Critical Fail** — 0이어야 승격 가능
4. **Promotion Decision** — NOT_READY / HOLD / PROMOTE
5. **Best-fit Tool** — 시나리오별 최고 평균 점수 도구
6. **Human Intervention** — 도구별 평균 개입 점수

## 메인 비교 매트릭스

행은 S01~S10, 열은 Aside / ChatGPT Work / Playwright로 둔다.

각 셀에는 아래 값을 표시한다.

- 평균 총점
- 실행 횟수
- Critical Fail 수
- 상태: PENDING / COMPLETE

점수 자체보다 도구별 task fit을 볼 수 있도록, 같은 시나리오에서 3개 도구를 가로 비교한다.

## 상세 Run 테이블

필드:

- scenarioId
- tool
- run
- startedAt
- endedAt
- durationSeconds
- completion
- accuracy
- evidence
- humanIntervention
- speed
- repeatability
- safety
- total
- criticalFail
- evidence[]
- notes

## Promotion 카드

Aside 승격 조건은 모두 충족해야 한다.

1. S01~S10 전부 COMPLETE
2. Overall Score >= 85
3. Critical Fail = 0

판정:

- `NOT_READY`: 10개 시나리오 미완료
- `HOLD`: 10개 완료했지만 점수 또는 Critical Fail 조건 미충족
- `PROMOTE`: 모든 승격 조건 충족

## 차트 권장 구성

### Chart A — Tool Overall Score

3개 도구의 전체 평균 점수를 가로 막대로 비교한다.

### Chart B — Scenario Heatmap 대체표

S01~S10 × Tool 3개의 점수를 조건부 색상으로 표시한다. 초기 버전은 표로 구현하고 별도 시각화는 후순위로 둔다.

### Chart C — Human Intervention

도구별 Human Intervention 평균 점수를 비교한다. 점수가 높을수록 사람 개입이 적은 구조로 해석한다.

### Chart D — Run Stability

같은 시나리오의 반복 실행 총점을 Run 순서로 표시한다. 반복성이 낮은 도구는 평균점수가 높아도 Production 승격 대상에서 재검토한다.

## 운영 흐름

1. 각 실측이 끝나면 `browser-agent-benchmark-scorecard.json`에 run 1건 추가
2. `npm run benchmark:evaluate`로 데이터 검증과 현재 판정 확인
3. 필요 시 `npm run benchmark:summary`로 파생 Summary 생성
4. S01~S10 완료 후 GitHub Actions `Browser Agent Promotion Gate` 수동 실행
5. Gate가 PASS일 때만 JoyLab Factory 문서에서 Aside 상태를 `CANDIDATE`에서 `PROMOTED`로 변경

## 변경 규칙

- Raw score는 사람이 측정한 원본이므로 자동 덮어쓰기 금지
- Derived Summary는 재생성 가능 데이터로 취급
- Promotion threshold 변경은 policy 파일 PR로만 수행
- Critical Fail 정의 완화는 별도 정책 리뷰 없이 금지

## 완료 기준

Dashboard V1은 아래 질문에 30초 안에 답할 수 있어야 한다.

- Aside 점수는 현재 몇 점인가?
- 10개 중 몇 개가 끝났는가?
- Critical Fail이 있었는가?
- 어떤 시나리오에서 Work 또는 Playwright가 더 나은가?
- 지금 Aside를 Browser Execution Layer로 승격해도 되는가?

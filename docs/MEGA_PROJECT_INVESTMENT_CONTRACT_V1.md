# Mega Project Investment Contract V1

## Purpose

JoyLab의 메가 프로젝트 투자 리서치는 정책 발표를 곧바로 종목 수혜로 번역하지 않는다.
메가 프로젝트는 **Policy Gate → Evidence Gate → Procurement → Earnings** 순서로 검증한다.

## Hard Rule

> 정책 발표, MOU, 후보지 지정, 기본구상만으로 상장사를 '수혜주' 또는 '확정 수혜'로 분류하지 않는다.

상장사 투자 연결은 최소한 다음 순서를 따라야 한다.

1. 법정·행정 Policy Gate 진전
2. 사업비와 재원 구조 구체화
3. 발주 주체·패키지·일정 공개
4. 실제 수주 또는 계약 공시
5. 매출 인식
6. 마진·EPS 반영

## Evidence Gate V1

메가 프로젝트 투자 글은 최소 4개 증거 Gate를 명시한다.

### E1 · Asset Value
- 종전부지/사업자산의 현재 평가가액
- 개발가능 면적 또는 수익화 가능한 자산범위

### E2 · CAPEX
- 총사업비 또는 핵심 설비·인프라 투자비
- 물가·공사비·금융비용 상승 리스크

### E3 · Support Cost
- 보상·지원·소음대책·이전비 등 프로젝트 외부비용
- 지원범위 확대에 따른 비용 민감도

### E4 · Net Value
- Asset Value - CAPEX - Support Cost - Development Cost
- 명목 자산가치와 실제 순개발가치를 구분

## Earnings Transmission Gate

정책이 기업 실적으로 전환됐다고 판단하려면 다음 체인을 사용한다.

**Policy / Approval → Budget → Procurement → Order / Contract → Backlog → Revenue → Margin → EPS**

### 단계별 신뢰도

- POLICY: 관찰만 가능. 종목 수혜 판정 금지.
- BUDGET: 자본 투입 가능성 확인.
- PROCUREMENT: 실제 발주 가능성 상승.
- ORDER: 기업별 수혜 근거 시작.
- REVENUE: 실적 전환 확인.
- MARGIN / EPS: 투자 Thesis 검증 단계.

## Required Metadata

`investmentTheses`에 `mega-project-capex`가 포함된 글은 다음을 갖춰야 한다.

- `investmentResearchType`
- `investmentValueChains`
- `investmentKpis` 최소 4개
- 본문에 Policy Gate
- 본문에 Evidence Gate
- 본문에 Procurement / 발주
- 본문에 Revenue / 매출
- 본문에 Margin / 마진

## Interpretation Rule

메가 프로젝트 리서치는 특정 종목의 매수·매도 추천이 아니라
**정책이 자본지출과 기업 실적으로 전환되는 조건을 추적하는 리서치 프레임**이다.

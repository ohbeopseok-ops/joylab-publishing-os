# US Market Valuation Research Cluster V1

Status: Active  
Owner: JoyLab  
Pillar: 투자·경제  
Launch date: 2026-10-05

## Mission

미국 증시의 밸류에이션을 단일 PER이나 단일 PEG로 판단하지 않고,
가격·이익·추정치 변화·금리·이익 확산을 하나의 Research Cluster로 연결한다.

## Episodes

| EP | Article ID | Working title | Role | Status |
| --- | --- | --- | --- | --- |
| 01 | sp500-peg-valuation-2026 | S&P500 PEG 0.70, 정말 저평가일까 | Pillar / Hub | Production |
| 02 | sp500-peg-under-1-backtest-2026 | PEG<1 이후 S&P500은 얼마나 올랐나 | Backtest | SILVER Draft |
| 03 | sp500-eps-revision-cycle-2026 | S&P500 EPS 전망이 꺾이면 어떻게 될까 | Earnings | Planned |
| 04 | treasury-5-percent-sp500-nasdaq-dividend | 미국 국채금리 5% 시대 | Rates | Existing |
| 05 | sp500-nasdaq100-smh-valuation-compare-2026 | S&P500 vs Nasdaq100 vs SMH | Compare | Planned |
| 06 | us-stock-market-ai-bubble-valuation-2026 | 미국 증시는 버블일까 | Synthesis | Planned |

## Publishing order

EP01 → EP04 → EP03 → EP02 → EP05 → EP06

Reason:
- EP01 establishes the valuation question.
- EP04 explains the active discount-rate risk.
- EP03 validates the earnings denominator.
- EP02 tests the historical signal.
- EP05 converts the framework into asset comparison.
- EP06 synthesizes the bubble/valuation thesis.

## Internal-link contract

- Every EP02–EP06 article must link back to EP01.
- EP01 must link to all published cluster members.
- EP02 must link to EP03 when EP03 is published.
- EP05 must link to existing SMH/SOXX and VOO/SMH comparison content when those article IDs are confirmed.
- Do not invent internal links to unpublished slugs.

## Evidence contract

- PEG raw series: GOLD only when reproducible numeric series is available.
- Chart-digitized PEG: SILVER.
- Formula-derived sensitivity: GOLD.
- FRED DGS10: GOLD public macro input.
- Yardeni/Refinitiv revision metrics: cite methodology and date; preserve source date.
- Missing evidence must remain PENDING, never imputed.

## Visual contract

See:
`config/contracts/us-market-valuation-visual-assets-v1.json`

## Research progression

PEG → EPS Revision → Rates → Backtest → Asset Comparison → Bubble/Fair-Value Synthesis

# Investing Release Flow V1

Status: Active  
Scope: JoyLab Investing Knowledge V3

## Rule

Live Evidence Layer and Retirement 10-part expansion are blocked until the current Investing Knowledge V3 release reaches Production GOLD on https://aijoylab.kr.

## Required sequence

1. 30-guide migration complete
2. Investing Knowledge V3 Gate PASS
3. Full repository Build PASS
4. Protected PR merge to main
5. Cloudflare deploy PASS
6. Custom domain reachability PASS
7. Production Smoke PASS
8. Release Gate V1 = GOLD
9. Only then start Live Evidence Layer
10. Retirement 10-part series follows after the evidence layer contract is fixed

## Current V3 scope

- ETF series: 10
- Macro series: 10
- Stocks series: 10
- Research Graph: 53 nodes / 121 edges
- Entry hub: /guides/investing-foundations
- Parent hub: /guides/investing

## Hard stop

Do not merge Live Evidence or Retirement expansion into this release to make the release larger.

If Production Smoke or Release Gate fails, repair this V3 release first.

## Evidence-layer next phase

After GOLD, design Live Evidence as a separate contract covering:
- official source identity
- fetched-at timestamp
- effective/as-of date
- stale-data behavior
- source fallback
- rendering boundary between evergreen explanation and live values
- failure behavior when data is unavailable

## Retirement phase

Retirement content begins only after the Live Evidence contract is accepted.

Planned path:
연금저축 → IRP → TDF → S&P500 → 채권 → 리밸런싱 → 인출전략 → Sequence Risk → 은퇴 자산배분 → 운영 체크리스트

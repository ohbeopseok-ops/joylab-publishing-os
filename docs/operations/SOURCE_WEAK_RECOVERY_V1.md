# JoyLab SOURCE WEAK Recovery Plan V1

Generated from the 70-article V2 corpus audit on 2026-09-23.

## Priority rule
- **P0**: high decision risk / core search intent / high freshness sensitivity. Repair first.
- **P1**: important cluster or company research, but narrower scope or easier to defer.
- **P2**: evergreen framework content. Source quality matters, but immediate factual-risk exposure is lower.
- Effort: **Low** = obvious official/primary sources available; **Medium** = several claims require mapping; **High** = conceptual claims need literature/theory review.

## Top 10 first
| Rank | Article | Priority | Importance | Effort | First source targets |
|---:|---|---|---|---|---|
| 1 | samsung-electronics-outlook.md | P0 | Very High | Medium | Samsung IR/filings, earnings release, industry data |
| 2 | sk-hynix-outlook.md | P0 | Very High | Medium | SK hynix IR/filings, earnings release, memory market primary data |
| 3 | samsung-vs-sk-hynix-ai-memory.md | P0 | Very High | Medium | Both companies' IR/filings, HBM product/earnings disclosures |
| 4 | semiconductor-cycle.md | P0 | Very High | Medium | WSTS/SEMI/company filings/official trade statistics |
| 5 | foreign-investor-flow.md | P0 | High | Low | KRX/KOSCOM/BOK official flow and market data |
| 6 | us-rates-korea-semiconductor-transmission-2026.md | P0 | High | Medium | U.S. Treasury/FRED/BOK/KRX + company sensitivity evidence |
| 7 | us-30y-treasury-5-percent-risk-2026.md | P0 | High | Low | U.S. Treasury/FRED/Federal Reserve |
| 8 | strong-retail-sales-nasdaq-rally-2026.md | P0 | High | Low | U.S. Census retail sales, Fed/FRED, Nasdaq market data |
| 9 | us-cpi-fed-nasdaq-guide.md | P0 | High | Low | BLS CPI, Federal Reserve/FOMC, FRED |
| 10 | us-jobs-report-fed-nasdaq-guide.md | P0 | High | Low | BLS Employment Situation, Federal Reserve/FRED |

## P0 — repair immediately
| Article | Importance | Effort | Reason |
|---|---|---|---|
| samsung-electronics-outlook.md | Very High | Medium | Core investment thesis; company/earnings claims need traceability |
| sk-hynix-outlook.md | Very High | Medium | Core investment thesis; HBM/memory claims are time-sensitive |
| samsung-vs-sk-hynix-ai-memory.md | Very High | Medium | Comparative investment research; unsupported comparison risk |
| semiconductor-cycle.md | Very High | Medium | Foundational pillar article reused by many downstream articles |
| foreign-investor-flow.md | High | Low | Market-flow claims are easy to source from official market data |
| strong-retail-sales-nasdaq-rally-2026.md | High | Low | Macro event article; freshness and causal claims need official data |
| us-30y-treasury-5-percent-risk-2026.md | High | Low | Rate level and fiscal interpretation require official series |
| us-rates-korea-semiconductor-transmission-2026.md | High | Medium | Cross-market transmission claim has higher inference risk |
| us-cpi-fed-nasdaq-guide.md | High | Low | Evergreen high-intent macro guide; official BLS/Fed sources available |
| us-jobs-report-fed-nasdaq-guide.md | High | Low | Evergreen high-intent macro guide; official BLS/Fed sources available |
| codex-automation-gold-cases-5.md | High | Low | Current product behavior should anchor to first-party OpenAI docs |
| what-is-hbm.md | High | Low | Foundational AI-memory explainer; JEDEC/vendor primary sources available |

## P1 — repair after P0
| Article | Importance | Effort |
|---|---|---|
| codex-non-developer-automation-10.md | Medium-High | Low |
| codex-skill-guide-2026.md | Medium-High | Low |
| doosan-enerbility-ai-power.md | High | Medium |
| hanwha-ocean-shipbuilding.md | High | Medium |
| hd-hyundai-electric-ai-power.md | High | Medium |
| hd-hyundai-heavy-industries-shipbuilding.md | High | Medium |
| hd-ksoe-shipbuilding.md | High | Medium |
| hyosung-heavy-industries-ai-power.md | Medium-High | Medium |
| korea-ai-power-companies-compare.md | High | High |
| korea-shipbuilding-companies-compare.md | High | High |
| ls-electric-ai-power.md | High | Medium |
| samsung-heavy-industries-shipbuilding.md | High | Medium |
| us-economic-indicators-guide.md | Medium-High | Medium |
| us-pce-fed-nasdaq-guide.md | Medium-High | Low |
| us-ppi-fed-margin-guide.md | Medium-High | Low |

## P2 — evergreen evidence upgrade
| Article | Importance | Effort |
|---|---|---|
| fairness-system-explainable-standards.md | Medium | High |
| feedback-system-behavior-change.md | Medium | High |
| growth-leadership-operating-system.md | Medium | High |
| learning-system-reexecution-loop.md | Medium | High |
| performance-system-leading-indicators.md | Medium-High | High |
| recognition-system-fair-performance.md | Medium | High |

## Migration rule
When any legacy article is edited:
1. Add `researchType: research|framework|guide|benchmark`.
2. Add explicit sources and verify key claims.
3. Remove template contamination.
4. Add Research Question / Limit or Counter Evidence / Action or Watch / Recheck Trigger as appropriate.
5. The changed article must pass V2.1 Hard Gate before merge.

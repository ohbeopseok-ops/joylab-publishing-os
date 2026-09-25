# AdSense Policy Audit V1 — P0/P1/P2 Remediation Plan

## Baseline
- Published research articles audited: 74
- Initial automated result: PASS 50 / FIX 24 / HOLD 0
- Priority logic: financial/YMYL-like factual claims first, then thin how-to content, then lower-risk source enrichment.

## P0 — approval before review hardening
These 19 Investing & Economy articles had zero outbound primary-source links. They receive official IR, exchange, regulator, or government sources in this patch.

1. doosan-enerbility-ai-power
2. foreign-investor-flow
3. hanwha-ocean-shipbuilding
4. hd-hyundai-heavy-industries-shipbuilding
5. hd-ksoe-shipbuilding
6. hyosung-heavy-industries-ai-power
7. korea-ai-power-companies-compare
8. korea-shipbuilding-companies-compare
9. samsung-electronics-outlook
10. samsung-heavy-industries-shipbuilding
11. samsung-vs-sk-hynix-ai-memory
12. semiconductor-cycle
13. sk-hynix-outlook
14. strong-retail-sales-nasdaq-rally-2026
15. us-economic-indicators-guide
16. us-jobs-report-fed-nasdaq-guide
17. us-pce-fed-nasdaq-guide
18. us-ppi-fed-margin-guide
19. what-is-hbm

Additional P0 quality action:
- `us-economic-indicators-guide`: expanded because body was below audit minimum.
- `us-jobs-report-fed-nasdaq-guide`: expanded because body was below audit minimum.

Expected outcome after CI: the Investing & Economy P0 source-gap set should no longer be FIX for missing sources; the two thin macro guides should also clear the minimum body threshold.

## P1 — improve before ad scale-up
Two AI how-to articles are useful but short relative to the JoyLab research standard.

- codex-computer-use-guide-2026
- codex-goal-mode-guide-2026

Required remediation:
- add one practical scenario;
- add failure/rollback guidance;
- add a short verification checklist;
- retain official OpenAI/product documentation links.

## P2 — editorial source enrichment
Three AI workflow articles are internally useful and not high-risk financial content, but have zero outbound sources.

- codex-automation-gold-cases-5
- codex-non-developer-automation-10
- codex-skill-guide-2026

Required remediation:
- add one or more official product/documentation references;
- keep JoyLab examples clearly separated from vendor claims.

## Release rule
- HOLD > 0: block merge.
- P0 unresolved: do not expand ads.
- P1 unresolved: limited ad rollout allowed only after site approval if no other policy issue exists.
- P2 unresolved: editorial backlog; monitor with CI.

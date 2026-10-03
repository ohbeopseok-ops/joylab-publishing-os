# Investing Foundations Release Flow V1

Status: Active
Scope: ETF / Macro / Stocks learning series and future Live Evidence / Retirement expansion

## Goal

Protect the canonical JoyLab research site while migrating the Investing Foundations learning system into production.

## Current release unit

- 30 published Articles
  - ETF · Asset Allocation: 10
  - Macro: 10
  - Stocks: 10
- 1 pillar: /guides/investing-foundations
- 1 Research Graph: 53 nodes / 121 edges
- Existing Investing Hub receives one Foundations entry point
- New articles use excludeFromLatest: true to avoid flooding Home Latest Updates

## Required order

1. CONTENT CONTRACT
   - frontmatter schema PASS
   - publishedAt contract PASS
   - canonical identity PASS
   - no duplicate article IDs

2. INVESTMENT EVIDENCE
   - Investment Primary Source Gate PASS
   - minimum two accepted primary-source links per new Investing article
   - no unsupported current-market claim introduced during migration

3. RESEARCH GRAPH
   - JoyLab.ResearchGraph schema PASS
   - 53 nodes
   - 121 edges
   - 30 published article bindings
   - Platform Registry PASS
   - pillar source wired to ResearchGraphMap

4. BUILD
   - npm ci
   - npm audit --omit=dev
   - Astro build GREEN
   - applicable visual / responsive gates GREEN

5. PR / MAIN
   - protected PR path only
   - required build status GREEN
   - conversation resolution satisfied
   - merge to main

6. PRODUCTION
   - Cloudflare deploy GREEN
   - canonical custom-domain reachability GREEN
   - Production Smoke GREEN
   - Studio Production Smoke GREEN
   - Production Reader GOLD QA GREEN
   - Production Mindmap GOLD QA GREEN
   - Release Gate V1 => GOLD

## Expansion Lock

Until the current Investing Foundations release reaches Production GOLD:

- Do not add Live Evidence Layer to these 30 articles.
- Do not add Retirement 10-part series.
- Do not change the canonical deployment platform.
- Do not replace existing Investment Research Map V2.
- Do not remove excludeFromLatest from the 30 migrated articles.

After Production GOLD, unlock in this order:

1. Live Evidence Layer pilot on 3 representative articles:
   - S&P500 / ETF
   - Yield Curve / Macro
   - Samsung Electronics / Stocks
2. Evidence freshness and source-health gate
3. Expand Live Evidence to remaining 27 articles
4. Retirement 10-part content + Research Graph extension
5. Production GOLD again

## Rollback

If any production gate fails:

- status = BLOCKED
- do not label release GOLD
- revert/fix on a non-main branch
- repeat protected PR → deploy → production smoke → Release Gate

## Authority

This flow does not replace:
- docs/GOLD_BASELINE_V1.md
- docs/RELEASE_GATE_V1.md
- docs/CONTENT_DATE_CONTRACT_V1.md
- Investment Primary Source Gate

Those remain authoritative.

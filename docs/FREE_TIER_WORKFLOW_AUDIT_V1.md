# JoyLab Publishing OS — Free-Tier Workflow Audit V1

Scope: all 63 workflows under `.github/workflows/` on main.
Goal: preserve release safety while keeping private-repository GitHub-hosted Actions within the included monthly allowance.

## Decision counts

- MERGE: 39
- WEEKLY: 5
- MANUAL: 8
- KEEP: 11

Immediate DELETE is intentionally zero. Deletion is allowed only after a MERGE replacement is implemented and verified.

## Decision rules

- **KEEP** — release/deploy safety, production event verification, or freshness-critical market data.
- **WEEKLY** — recurring analytics/audit where daily polling does not protect release safety.
- **MANUAL** — expensive browser/GOLD/promotion/editorial jobs that should run only for a deliberate decision.
- **MERGE** — overlapping domain workflows that repeat checkout/setup/build/browser work and should share one pipeline.
- **DELETE** — only when replacement evidence exists; none are safe to delete immediately in this audit.

## Full classification

| Workflow | Decision | Target | Why |
|---|---|---|---|
| `adsense-content-quality-audit-v2.yml` | **MERGE** | content-quality suite | PR content audit; consolidate checkout/setup/artifact overhead |
| `adsense-monetization-gate-v1.yml` | **WEEKLY** | Mon 00:30 UTC | Business signal; daily cadence not required for release safety |
| `adsense-site-readiness-v1.yml` | **MERGE** | release preflight | Runs npm ci + build already repeated by core release/build paths |
| `ai-capex-leader-gate-v1.yml` | **MERGE** | AI CAPEX suite | PR+push build gate overlaps master-map validation |
| `ai-capex-leader-runtime-v1.yml` | **WEEKLY** | weekly runtime refresh | Current weekday schedule is telemetry/data refresh, not release gate |
| `ai-capex-master-map-v2.yml` | **MERGE** | AI CAPEX suite | PR+push build gate overlaps leader gate |
| `ai-memory-production-smoke.yml` | **MANUAL** | explicit production smoke | Production smoke should run when relevant, not every qualifying PR |
| `article-hero-gate.yml` | **MERGE** | content-quality suite | Light article asset contract can share one content gate |
| `book-seo-analytics-gate.yml` | **MERGE** | Books CI suite | Repeated npm ci + build for Books surface |
| `book-web-reader.yml` | **MERGE** | Books CI suite | Repeated npm ci + build for Books surface |
| `books-domain-core.yml` | **MERGE** | Books CI suite | Repeated npm ci + build for Books surface |
| `books-visual-qa.yml` | **MERGE** | Books/visual suite manual job | Browser-heavy validation should share visual harness |
| `browser-agent-promotion-gate.yml` | **MANUAL** | promotion only | Promotion is a deliberate lifecycle action |
| `build.yml` | **KEEP** | core build/release gate | Primary broad validation; protect release safety |
| `china-risk-brief-distribution.yml` | **MERGE** | China risk pipeline | Pair transform/distribution with data adapter rather than separate overlapping workflow |
| `china-risk-data-adapter.yml` | **MERGE** | China risk pipeline weekly job | Data collection and distribution should be one bounded pipeline |
| `company-compact-production-gold-v1.yml` | **KEEP** | post-deploy GOLD | Event-driven production verification |
| `company-compact-rollout-gold-v1.yml` | **MANUAL** | rollout candidate | Browser-heavy rollout certification is deliberate |
| `configuration-drift.yml` | **WEEKLY** | weekly drift check | Daily drift polling is not release-critical |
| `content-contract-pr-comment.yml` | **KEEP** | light PR feedback | Cheap PR-only feedback; no build/install |
| `content-date-contract-v1.yml` | **MERGE** | content-contract suite | Light content contract belongs in consolidated PR gate |
| `content-identity-contract-v1.yml` | **MERGE** | content-contract suite | Light content contract belongs in consolidated PR gate |
| `deploy-cloudflare.yml` | **KEEP** | production deploy | Production delivery path |
| `distribution-execution-gold.yml` | **MERGE** | distribution suite | Same distribution domain; consolidate validation/setup |
| `distribution-pack.yml` | **MERGE** | distribution suite | Same distribution domain; consolidate packaging/validation |
| `gsc-7d-report.yml` | **MERGE** | weekly search visibility suite | Combine fetch/report with direct sync once per week |
| `gsc-direct-api-sync.yml` | **MERGE** | weekly search visibility suite | Combine data sync + report to avoid separate scheduled runs |
| `gsc-manual-import.yml` | **MANUAL** | fallback import | Keep as explicit fallback, not routine CI |
| `home-content-slot-contract-v1.yml` | **MERGE** | content-contract suite | Light home/content contract belongs in consolidated PR gate |
| `homepage-funnel-report.yml` | **WEEKLY** | weekly funnel report | Analytics report; weekly is sufficient for free-tier mode |
| `indexnow-publish.yml` | **KEEP** | changed-article push | Small event-driven indexing action tied to publishing |
| `internal-link-gate-v1.yml` | **MERGE** | content-contract suite | Light internal-link contract can share content gate |
| `internal-link-recommender-v3.yml` | **MANUAL** | editorial assist | Recommendation artifact is advisory, not release-critical |
| `investment-taxonomy-v1.yml` | **MERGE** | content-contract suite | Taxonomy validation can share content gate |
| `mobile-article-monetization-order-v1.yml` | **MERGE** | visual/mobile suite | Browser/build-heavy mobile check should reuse one preview |
| `mobile-experience-contract-v1.yml` | **MERGE** | visual/mobile suite | Lighthouse + Playwright should share one built preview |
| `mobile-visual-regression-v1.yml` | **MERGE** | visual/mobile suite | Visual regression should share one browser harness |
| `production-freshness-v1.yml` | **KEEP** | post-deploy/manual only | Event-driven production evidence; scheduled poll removed in PR #463 |
| `production-health.yml` | **KEEP** | post-deploy/manual only | Health check retained but hourly schedule removed in PR #463 |
| `quality-control-center-v1.yml` | **MANUAL** | repair-wave control center | 45-minute browser/Lighthouse umbrella is too expensive for automatic routine CI |
| `rates-dashboard.yml` | **KEEP** | weekday market refresh | Fresh market/rates data directly powers production research |
| `release-engine-v2.yml` | **KEEP** | post-deploy release | Release/tag evidence path |
| `research-evidence-audit.yml` | **WEEKLY** | weekly corpus audit | Evidence corpus needs recurrence but not daily |
| `research-graph-compact-v1.yml` | **MERGE** | Research Graph suite | Repeated build across same feature family |
| `research-graph-component-v1.yml` | **MERGE** | Research Graph suite | Repeated build across same feature family |
| `research-graph-gate-v1.yml` | **MERGE** | Research Graph suite | Repeated build across same feature family |
| `research-graph-platform-v1.yml` | **MERGE** | Research Graph suite | Repeated build across same feature family |
| `research-graph-responsive-gold.yml` | **MERGE** | Research Graph suite manual visual job | Browser GOLD can reuse suite preview |
| `research-image-quality-v1.yml` | **MERGE** | content-quality suite | Image quality belongs with article/visual contracts |
| `responsive-visual-gate-v2.yml` | **MERGE** | visual/mobile suite | Browser-heavy visual gate should reuse one preview |
| `samsung-compact-gold-v1.yml` | **MANUAL** | product GOLD | Targeted browser GOLD run only when compact changes |
| `search-growth-gate-v1.yml` | **MERGE** | search/content suite | Build/search gate can share search visibility/content preflight |
| `series-02-publish-tag-v1.yml` | **MERGE** | Series 02 release workflow | Publishing/tagging should be one guarded release transaction |
| `series-02-release-tag-v1.yml` | **MERGE** | Series 02 release workflow | Publishing/tagging should be one guarded release transaction |
| `series-02-ssot-gate-v1.yml` | **KEEP** | Series 02 PR SSOT gate | Cheap source-of-truth protection before release |
| `shortform-handoff-v1.yml` | **MERGE** | distribution suite | Handoff belongs in distribution pipeline |
| `studio-export-quality-gate-v1.yml` | **MERGE** | Studio quality suite | Build/browser export checks can reuse one Studio setup |
| `studio-mvp-gate-v1.yml` | **MERGE** | Studio quality suite | Repeated npm ci + build in same Studio domain |
| `studio-print-pdf-gate-v1.yml` | **MERGE** | Studio quality suite | Browser/PDF validation can share Studio harness |
| `sync-rates-timeseries.yml` | **KEEP** | weekday market refresh | Fresh rates time series directly powers research |
| `topic-cluster-ci-v2.yml` | **MERGE** | content-contract suite | Light topic-cluster validation can share content gate |
| `visual-asset-contract-v4.yml` | **MERGE** | content-quality suite | Asset contract can share content/visual preflight |
| `visual-upgrade-runtime.yml` | **MANUAL** | explicit visual upgrade | Daily write/deploy-style runtime is not release-critical |

## Consolidation plan

### Wave A — Content contracts
**IMPLEMENTED IN SHADOW MODE:** `.github/workflows/content-contract-suite-v1.yml` now combines article-hero, content-date, content-identity, home-content-slot, internal-link, investment-taxonomy, topic-cluster, and research-image-quality checks into one path-filtered runner with one checkout/setup/install. Legacy workflows remain active until equivalence is proven.

### Wave B — Research Graph
**IMPLEMENTED IN SHADOW MODE:** `.github/workflows/research-graph-suite-v1.yml` now consolidates compact/component/core/platform checks plus one production build. Responsive GOLD is available only via manual dispatch and reuses the same job/build before Playwright preview.

### Wave C — Visual/mobile
Merge mobile monetization order, mobile experience, mobile visual regression, responsive visual, and Books visual QA onto one reusable preview/browser harness. Routine execution becomes manual or narrowly path-triggered.

### Wave D — Books and Studio
One Books CI and one Studio quality workflow, each sharing a single dependency install/build per run.

### Wave E — Search/business analytics
Combine GSC direct sync + 7-day report into one weekly search-visibility workflow. Keep manual import as a fallback. Keep AdSense and homepage funnel weekly.

### Wave F — Distribution/release families
Consolidate distribution pack/execution/shortform handoff. Consolidate Series 02 tag/publish transaction while retaining the SSOT PR gate.

## Free-tier operating guardrail

- Account Actions budget stays at $0 with stop-usage enabled.
- At 80% monthly minutes: no cadence increases; review top consumers.
- At 90%: suspend all non-release schedules and use manual dispatch only.
- At 100%: do not bypass gates or enable paid usage automatically.

## Current PR #463 already implements

- Production Health: hourly -> post-deploy/manual.
- Quality Control Center: daily schedule removed.
- AdSense monetization: daily -> weekly.
- GSC 7D report: daily -> weekly.
- GSC direct sync: daily -> weekly.
- Homepage funnel: daily -> weekly.
- Production Freshness: daily schedule removed; post-deploy/manual retained.
- selected non-release artifact retention reduced to 14 days.

## Next implementation order

1. Content-contract suite (low risk, high duplicate setup savings).
2. Research Graph suite.
3. Books + Studio suites.
4. Visual/mobile shared preview harness.
5. Search visibility weekly suite.
6. Distribution + Series 02 release consolidation.

Do not remove source workflows until the consolidated replacement has passed its own contract checks.
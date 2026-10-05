# Free-Tier CI Policy V2

## Goal
Keep JoyLab CI reliable while reducing unnecessary scheduled runs, duplicate validation, and heavy recurring jobs.

## Scheduling rules
- Production health: at most 4 scheduled runs per day.
- Heavy QA using Playwright, Chromium, Lighthouse, full builds, or large artifact generation: PR, push, release, or manual only.
- Post-deploy verification: prefer workflow_run after successful deploy instead of a second daily cron.
- GSC, funnel, AdSense summary reporting: weekly unless a product decision requires higher cadence.
- Configuration drift and evidence audits: weekly.
- Market/rates/leader data refreshes: keep weekday cadence when data freshness matters.
- Risk adapters: default to daily unless intraday changes materially affect a decision.
- Release and GOLD tests: workflow_dispatch or release-triggered.

## Current classifications

| Workflow | Policy |
|---|---|
| production-health.yml | KEEP — 4/day |
| configuration-drift.yml | KEEP — weekly |
| gsc-7d-report.yml | KEEP — weekly |
| homepage-funnel-report.yml | KEEP — weekly |
| adsense-monetization-gate-v1.yml | KEEP — weekly |
| quality-control-center-v1.yml | MANUAL/PR/PUSH — scheduled trigger removed |
| production-freshness-v1.yml | DEPLOY-DRIVEN — scheduled trigger removed |
| china-risk-data-adapter.yml | KEEP — daily |
| gsc-direct-api-sync.yml | KEEP — daily |
| visual-upgrade-runtime.yml | KEEP — daily |
| sync-rates-timeseries.yml | KEEP — weekdays |
| rates-dashboard.yml | KEEP — weekdays |
| ai-capex-leader-runtime-v1.yml | KEEP — weekdays |
| research-evidence-audit.yml | KEEP — weekly |

## Guardrails
1. Do not add hourly cron without a documented operational SLA.
2. Any workflow with Playwright, Lighthouse, browser installation, or full-site build must not run daily by default.
3. Prefer path filters for PR/push triggers.
4. Prefer concurrency cancellation for read-only checks.
5. A scheduled workflow must state why its cadence is required in this policy before promotion to main.
6. New schedules should be reviewed against existing data-refresh jobs to avoid duplicate fetch/build work.

## Review cadence
Review this policy when:
- a new recurring workflow is added,
- Actions usage or failure noise rises,
- a data source changes freshness requirements,
- a release gate is promoted from manual to automatic.

# JoyLab Repository Tier Policy V1

## Purpose
Control where GitHub Actions is allowed so private repositories do not silently consume shared Actions minutes.

## Tier A — Production CI
Use for repositories that directly publish, deploy, or protect a production service.

Allowed:
- required Build gate
- deployment gate
- post-deploy verification
- narrowly scoped data refresh jobs
- scheduled workflows only when freshness has a documented operational need

Default controls:
- path filters
- concurrency cancellation for read-only checks
- no hourly cron without explicit SLA
- heavy browser/Lighthouse QA should be PR/manual/release-driven

Current example:
- `joylab-publishing-os`

## Tier B — Development CI
Use for actively developed applications where automated tests materially reduce release risk.

Required:
- at least one PR Build/Test status check before merge

Allowed:
- PR test/lint/build
- release packaging
- manual GOLD test
- no recurring cron by default

Candidates when CI is needed:
- `leaderdesk`
- `joyclip`
- `joylab-ai-company-os`
- `joylab-video-factory`

## Tier C — Local / Manual First
Use for experiments, prototypes, research utilities, dormant projects, or repositories where CI has little operational value.

Default:
- no scheduled Actions
- no always-on push CI
- local tests first
- `workflow_dispatch` only when automation is genuinely useful

## Promotion rule
A repository may move up a tier only when:
1. there is a concrete release or production risk CI will reduce,
2. the required workflow is defined,
3. the expected execution frequency is known,
4. duplicate CI with another repository/service has been ruled out.

## Audit rule
Review private repositories before adding any of the following:
- `schedule:`
- `cron:`
- `runs-on:`
- broad `push:` triggers without path filters

## Current private repository audit
At the time this policy was established, the following audited private repositories had no detected cron or `runs-on` workflows on their default branches:
- joylab-command-center
- joylab-content-os
- joylab-core8-engine
- joylab-video-factory
- leaderdesk
- joyclip
- joylab-ai-company-os
- joylab-shortform-engine
- joylab-ai-voice-benchmark
- JoyLab-Book-Mining
- JoyLab_Vibe_Coding_OS_v1.0


## Numeric CI limits

These defaults apply unless a stricter repository-specific value is declared in `config/repository-registry.json`.

| Control | Default limit |
|---|---:|
| Automatic PR workflow fan-out | 3 or fewer |
| Tier A production-health schedule | 4 runs/day or fewer |
| Tier B recurring cron workflows | 0 |
| Tier C recurring cron workflows | 0 |
| Heavy browser / Lighthouse / Playwright cron | 0 |
| Hourly cron | prohibited without documented production SLA |

A repository-specific exception must be documented in the registry with a reason.

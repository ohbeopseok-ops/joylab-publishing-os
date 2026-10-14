# JoyLab GitHub Actions Cost & Reliability Control V0.1

Status: DRAFT — no deployment/required-check changes authorized by this document.
Baseline: 2026-10-14, GitHub Billing screenshot. Included minutes 2000/2000, storage 0.5/0.5 GB, billable charge $0. Gross measured Actions use $108.91 with matching discounts. Gross USD by repository is NOT runner minutes.

## Q1 — PR #507 safe concurrency verification
- Existing `Build` required check must stay named `build`, with the same required-check protection rule.
- Validate YAML triggers for push/main, PR/main and manual dispatch unchanged.
- Test with two successive commits on the *same PR* while the first Build is running: earlier run = cancelled, latest run = success; confirm a separate PR is not cancelled.
- Check commit check-runs, branch protection/rulesets, latest Build logs and tests before merging.
- Current observed PR commit 6dff4b3a: Build in_progress; Content Contract PR Comment failure x2. Root causes not established. Do not merge while failing/required checks are unresolved.
- Avoid test spam when the included quota is exhausted. Prefer syntax and static reviews first.
- Watch out: a cancelled required workflow run may affect PR status until replacement run completes.

## Q2 — workflow consolidation decision
63 workflow YAML files on publishing-os default branch at baseline. Merge only when ALL conditions hold:
1. Same execution context (PR vs main vs scheduled vs post-deploy) and compatible privileges.
2. Same path scope AND no required-check/ruleset dependency is lost.
3. Shared expensive setup (npm ci, build, Playwright, fonts) can be reused as jobs or reusable workflows.
4. Report/artifact consumers retain stable outputs and retention.
5. Fault isolation and security boundaries are preserved.
6. Measured monthly savings exceeds added operational risk.

Suggested audit cohorts, NOT blanket merger approvals:
- `build.yml` vs `mobile-visual-regression-v1.yml` and `visual-asset-contract-v4.yml`: repeated npm build, broad overlap in changed paths. Evaluate shared build artifact / reusable step.
- `research-graph-gate-v1.yml` vs base Build: research-graph gate repeated. Preserve dedicated contract as named check if required.
- `production-freshness-v1.yml` triggered after deploy: must stay logically separate from pre-deploy QA.
- `rates-dashboard.yml` and `sync-rates-timeseries.yml`: one-hour-offset cron; combine only if downstream dependency semantics proven.
- `adsense-monetization-gate-v1.yml`: 4 separate uploads currently retain for 90 days — inspect evidence needs prior to any retention change.
- `content-contract-pr-comment.yml`: duplicate `types` entries under pull_request and two observed PR failures; investigate without disabling contract enforcement.

## Q3 — central operating model
Maintain read-only data collector with Actions workflow runs, jobs, artifacts, and Billing usage export as inputs. CI can report execution durations; it cannot equate these with charged private-repo minutes or GitHub storage usage. Mark unavailable billing data as UNKNOWN, never zero.

Canonical fields: snapshot_at_utc, repo, workflow_id, workflow_name, run_id, event, branch, status, conclusion, created_at, run_started_at, updated_at, job_runner, duration_seconds, artifact_size_bytes, artifact_expires_at, billable_minutes_source, storage_source, run_url.

Metrics:
- 7d/30d success rate = successful terminal runs / (success + failure + cancelled + timed_out + action_required), display excluded skipped separately.
- 7d/30d failure rate = failures + timed_out over completed non-skipped runs. Cancelled runs are reported independently.
- 30d runner hours = sum job durations (observed, not necessarily billed).
- Storage = sum accessible artifact sizes as an estimate; official billing figure is authoritative.
- Weekly budget alert 70/85/95/100% and storage 70/85/95/100%; compare with **actual** included usage.
- Cadence: one daily snapshot; weekly trend. If collector CI itself would consume scarce minutes, run locally or off-GitHub until budget headroom exists.

Operating policy:
- P0: secrets security, release signing, deployment gates, legal/privacy checks, production incident checks. No auto-disable.
- P1: mandatory contract/checks: cache & concurrency first; no name change without ruleset migration.
- P2: visual/regression/full end-to-end: path filters, conditional runs, shared artifact.
- P3: research snapshots, convenience reports: schedule optimization and manual dispatch when safe.
- Artifacts: 7d ephemeral debug, 14d PR validation, 30d trend reporting, 90d release/signing evidence by explicit exception. Never remove existing forensic evidence without review.
- Decision log: proposal -> tested on branch -> PR review -> merge -> compare 7d usage/failure -> revert if required checks absent or failure rate worsens.
- Owners: human approves destructive delete/required-check weakening/production deploy changes. Automation may propose without applying.

## Release gates
G1: parse workflow YAML correctly and test trigger interpretation.
G2: confirm required check/ruleset match.
G3: cancelled superseded run and succeeding newest run both observed (only if safely testable).
G4: no deployment regression, no loss of artifacts needed for audit.
G5: monitor weekly usage and failure-rate baseline after merge.

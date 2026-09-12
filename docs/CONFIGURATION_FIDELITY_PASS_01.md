# Configuration Fidelity Pass 01

Status: IMPLEMENTED / SECRET GATE PENDING

Production target: `https://aijoylab.kr`
Workflow: `.github/workflows/configuration-drift.yml`
Checker: `scripts/check-configuration-drift.mjs`
Expected state: `config/production-baseline.json`
Cadence: daily at 02:37 UTC, plus manual `workflow_dispatch`

## Purpose

Detect Cloudflare control-plane drift that may not yet be visible through normal production availability checks.

Production Health answers whether production is externally healthy. Configuration Drift answers whether production still matches the approved operating baseline.

## V1 coverage

V1 is intentionally read-only and verifies:

1. required DNS hostnames remain present;
2. required DNS hostnames remain Cloudflare proxied;
3. `aijoylab.kr` and `www.aijoylab.kr` remain attached to the expected Worker as Custom Domains;
4. those Custom Domains remain in the expected Cloudflare zone;
5. `workers.dev` exposure remains disabled;
6. Worker preview URLs remain disabled;
7. unexpected additional Custom Domains on the JoyLab Worker are reported as warnings.

## Security model

The workflow uses only `contents: read` GitHub repository permission.

Cloudflare access must use a dedicated read-only token supplied as `CF_AUDIT_API_TOKEN`. The deployment credential must not be reused for this audit.

Required GitHub Actions secrets:

- `CF_AUDIT_API_TOKEN`
- `CF_ACCOUNT_ID`
- `CF_ZONE_ID`

The checker never prints secret values.

## Status model

`IMPLEMENTED / SECRET GATE PENDING` means the repository implementation exists but Cloudflare read-only credentials have not yet been proven by a live audit run.

Promote to `PASS / SOAKING` only after:

1. protected-main PR Build passes;
2. merge to main succeeds;
3. post-merge Build and Cloudflare Deploy remain green;
4. the required audit secrets are configured;
5. at least one Configuration Drift run on main completes successfully.

Promote to `GOLD` only after at least three consecutive scheduled daily Configuration Drift runs complete successfully.

Manual `workflow_dispatch` runs do not count toward the three-scheduled-run GOLD qualification requirement.

## V1 exclusions

V1 does not yet hard-gate WAF/ruleset drift, API-token permission introspection, secret expiration, registrar/domain expiration, cache rules, or full DNS record-value inventory. These should be added only after the corresponding read-only APIs and expected-state contracts are proven stable.

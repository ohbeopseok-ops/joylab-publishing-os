# JoyLab Gold Baseline V1

Status: **GOLD**  
Established: **2026-09-12 KST**  
Canonical production: **https://aijoylab.kr**

This document is the durable release/security baseline for `joylab-publishing-os`. A future change is Gold-compatible only when the PR Build guard is green and the post-merge production deployment/smoke test is green.

## 1. Current Gold verdicts

- `Security Fidelity Pass 01 = GOLD`
- `Release Fidelity Pass 01 = GOLD`

Baseline evidence at establishment:

- canonical `main`: `501f81b4c362d1eab716297154c63080a823ce8b`
- Build workflow run `159`: success
- Cloudflare deploy workflow run `95`: success
- production custom-domain wait: success
- production smoke test: success
- repository ruleset: `Protect main`, active
- Security Pass issue `#44`: completed

## 2. Repository and dependency baseline

The following are release invariants:

- `package-lock.json` is committed.
- CI and deploy install with `npm ci`.
- `npm audit --omit=dev` must pass before build/deploy.
- `SECURITY.md` remains present.
- the declared Node engine floor remains compatible with CI.
- production deploy workflow repository permission stays read-only unless a separately reviewed change justifies more access.

## 3. Main branch governance baseline

The `Protect main` repository ruleset must remain active and must preserve all of the following:

- target: default branch (`main`)
- pull request required before merge
- required status check: `build`
- conversation resolution required
- non-fast-forward/force-push blocked
- branch deletion blocked
- no bypass actors

Required approvals may remain `0` while the repository is operated by one maintainer. Raising the count is allowed; removing the PR gate is not.

## 4. Deployment baseline

Production deployment must:

- trigger from pushes to `main` only, plus explicit manual dispatch
- use locked dependencies (`npm ci`)
- run the production dependency audit
- build the Astro site before deployment
- deploy through the pinned repository Cloudflare workflow
- wait for the custom domain to become reachable
- run a production smoke test after deployment

A successful Cloudflare upload alone is **not** a Gold release. The smoke test must also pass.

## 5. Domain and canonical baseline

Canonical host:

- `https://aijoylab.kr`

Required behavior:

- `aijoylab.kr` is configured as a Cloudflare custom domain.
- `www.aijoylab.kr` is also configured so the Worker can canonicalize it.
- `www.aijoylab.kr/*` returns a permanent `301` redirect to the same path on `https://aijoylab.kr/*`.
- `workers.dev` exposure remains disabled.
- Cloudflare preview URLs remain disabled.
- the Worker runs before static assets so security headers and canonical redirects cannot be bypassed by the asset path.

## 6. Production security-header baseline

Every production response must retain:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`

The deploy workflow verifies these against the live canonical domain after every production deployment.

## 7. Production fidelity baseline

The post-deploy smoke test must keep validating, at minimum:

- home page returns `200` and contains JoyLab/navigation interaction markers
- core semiconductor guide returns `200` and retains its connected article set
- representative article pages return `200` and retain canonical/internal-link/reader controls
- `/about`, `/contact`, `/privacy` return `200`
- `/robots.txt` returns `200` and advertises the canonical sitemap
- `/sitemap.xml` returns `200` and contains canonical production URLs
- `/rss.xml` returns `200` and points to the canonical host
- `www` representative route returns `301` to the canonical host

This list may be expanded as the product grows. Removing a check requires an explicit replacement rationale in the PR.

## 8. Automated PR Gold guard

Every pull request to `main` runs `scripts/check-gold-baseline.mjs` through the required `build` workflow.

The guard checks two classes of invariants:

1. **Repository invariants** — lockfile, CI/deploy hardening, canonical-domain configuration, Worker security headers, production smoke-test coverage.
2. **GitHub governance invariants** — live `Protect main` ruleset status and its required PR/status/deletion/force-push/conversation/bypass configuration.

If any baseline invariant drifts, the `build` check fails and the main ruleset blocks merge.

## 9. Gold invalidation rule

Gold is considered broken when any of the following occurs:

- Gold baseline PR guard fails
- required `build` check fails
- production deployment fails
- production custom-domain wait fails
- production smoke test fails
- `Protect main` no longer satisfies the governance baseline
- canonical redirect regresses
- a required production security header disappears
- robots/sitemap/RSS canonical host fidelity regresses

Do not relabel a failed release as Gold because the site appears visually usable.

## 10. Gold restoration rule

To restore Gold after a regression:

1. fix the regression on a non-main branch
2. open a PR to `main`
3. obtain a green required `build` check, including Gold baseline guard
4. merge through the protected PR path
5. require a green Cloudflare deploy
6. require a green post-deploy production smoke test
7. record the new canonical main SHA when the baseline itself materially changes

## 11. Change-control principle

`GOLD_BASELINE_V1` is a minimum floor, not a frozen architecture. Stronger controls may be added without creating a new baseline version. A new major baseline version is warranted when canonical domain strategy, deployment platform, release architecture, or governance model materially changes.

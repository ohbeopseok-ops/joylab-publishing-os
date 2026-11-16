# JoyLab Research Web CI Portability V1 — 2026-10-27

Status: PROPOSED / DRAFT PR — no deployment or runner cutover

## Decision

- Standardize the entry point `npm run ci` for the **Research website** across local/CI/Cloudflare candidates.
- WorkLab already uses `npm run ci`, but its checks stay project-specific. We align the invocation, **not** the entire test set or deployment owner.
- **PDF and EPUB are separate publishing products**; do not add them to the new web CI contract, generate new exports for migration, upload files, or use them as Cloudflare direct migration deliverables.
- The existing Research `npm run build` lifecycle currently invokes its historical `prebuild` (which includes EPUB generation). This PR **does not change that existing legacy lifecycle** because production asset requirements and GOLD gates have not been migrated. This is an explicit remaining dependency and not evidence of PDF/EPUB separation being completed.
- Existing `deploy-cloudflare.yml` is the only production deployment owner. No new Cloudflare Workers Builds connection, deployment, secret, custom-domain or D1/R2 change.
- No reduction to protected-main required `build` check, Production Smoke, security controls, or GOLD authority.

## Web-only portable commands

```sh
npm ci
npm run ci
```

`npm run ci` executes architecture tests, content-date audit, article architecture check, Research Image Gate, production Astro build (with currently-existing npm lifecycle), and indexability check. This command is a candidate for execution **on existing CI, local machine, or future Cloudflare isolated builder**; it does not itself deploy.

## Cutover risk & evidence requirements

1. Confirm the same pinned Node version and lockfile, dependency audit, image/font tools, and Worker build dependencies.
2. Reproduce all **Research web** content/security/SEO gates on an isolated runner and record exact SHA, command logs and rendered asset hashes.
3. Separately inventory the current `prebuild`/production PDF·EPUB dependencies and define an approved external ownership/asset availability contract before changing them. Do **not** upload or migrate binaries under this PR.
4. Confirm Cloudflare preview isolation and the current `wrangler.jsonc` custom-domain/security-header/Worker behavior. No simultaneous production deploy owners.
5. Retain protected PR, required Build, existing production deployment and Production Smoke until an explicitly reviewed migration PR with parity evidence. Never label cutover GOLD on build alone.

## Cost control

Existing optional scheduled work reductions from merged PR #515 remain the baseline. Do not re-enable scheduled jobs. Do not add GitHub Actions for this portability work. Existing required PR Build is unchanged. Track runner minutes and Cloudflare build minutes on comparable content-only PRs before choosing a new platform.

## Acceptance

- The shared `npm run ci` contract is committed without creating PDF/EPUB assets.
- Reviewers can verify scripts are present, but actual PASS requires running on the exact PR commit.
- Any generated artifact from the inherited `npm run build` lifecycle is a pre-existing behavior; future separation requires a distinct migration and approved dependency inventory.
- Human approval required before merges, Cloudflare migration or deployment.

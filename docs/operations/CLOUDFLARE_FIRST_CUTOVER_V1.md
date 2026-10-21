# JoyLab Cloudflare First — safe cutover gate (2026-10-21)

## Decision
**Keep GitHub Actions `build` required status check and the current `main` push → `deploy-cloudflare.yml` production route.**
Do not enable Cloudflare-native production Builds while GitHub Actions production deploy is active: two writers can race.
Do not adjust Ruleset `Protect main`, skip smoke checks, delete existing artifacts, or force-retry failed runs.

## Stage 1 — minimum scheduled Actions
- AI CAPEX Leader Runtime: manual `workflow_dispatch` only (no weekdays cron).
- AdSense Monetization Gate: manual `workflow_dispatch` only (no Monday cron).
- Existing required `build` (PR/main), production deploy (main push), and independent `production-health` monitoring remain active.
- Additional audit: the eight nonessential scheduled workflows for GSC visibility, research evidence, homepage funnel, rates timeseries, GSC API sync, China risk data, visual metrics, and rates dashboard are now `workflow_dispatch` (any existing narrowly scoped `push`/PR triggers are preserved).
- Keep `Production Health` (4/day) and weekly `Configuration Drift` scheduled. Never pause these solely to reduce Actions runs.
- Data refresh is now a deliberate prepublication action; articles that require current rates, search performance, or sector metrics must refresh and re-check their source timestamps before release. Otherwise mark the data as historical and state its as-of date.

## Stage 2 — retain Studio downloads and avoid unnecessary heavy builds
- `npm run build` still creates Series 02 EPUB via the lightweight Node prebuild generator. Do not remove this without an immutable artifact supply.
- Existing production deploy restores `dist/studio/exports/series-02-memory-debt-print.pdf` from an input-hash-keyed Actions cache; cache miss regenerates with Playwright. Preflight ALWAYS validates the PDF.
- `npm run studio:provenance` runs each deploy, binding EPUB/PDF SHA256 to the current exports. Production Studio smoke verifies HTTP 200 plus both checksums.
- Full Java EPUBCheck + PDF QA is isolated to the manually invoked `Studio Export Release QA (manual only)` workflow. This is run for a book release/change, not every site deploy.
- Cache eviction or a changed input can trigger one PDF generation; this is intentional availability protection. Do not interpret cache hits as immutable publishing or permanent archival.

## Stage 3 — Cloudflare direct deploy validation (NOT CUT OVER)
Prerequisite: a Cloudflare account connection authorized to inspect/edit the existing Worker `joylab-publishing-os`, and a preview deployment isolated from production. This conversation has GitHub write access but **no Cloudflare dashboard/API access**, so production cutover is blocked.

Local dry-run parity checklist on an isolated checkout:
1. `npm ci`, then `npm run build`.
2. Ensure the published PDF exists and passes `npm run studio:pdf:preflight`, then run `npm run studio:provenance`.
3. `npm run cloudflare:readiness` must pass, checking Worker config, all release asset signatures, and SHA256 coherence.
4. `npx wrangler deploy --dry-run` must pass using the actual worker configuration.
5. In Cloudflare Workers & Pages → existing Worker → Settings → Builds, **verify** the repository connection, Worker name, production branch, build command, preview isolation, and binding parity. Do NOT turn on parallel production deployment.
6. Deploy a **preview only**; verify homepage, articles, download EPUB/PDF/provenance 200 and matching SHA256, redirects, security headers, analytics API, and relevant reader/mobile checks. Capture SHA + preview URL + results.
7. Once parity passes, arrange exactly **one** production deploy owner: Cloudflare native OR GitHub Actions (not both). Remove GitHub push deployment only in the same controlled release, keeping the mandatory `build`. Observe production health and have rollback ready.

For Cloudflare-native Builds, the configured build and deploy commands are separate. They do not by themselves supply the current Playwright-generated PDF. Until verified export supply/preview parity is available, **retain GitHub Actions deployment**.

## Rollback
If a later Cloudflare native production cutover fails, revert the deploy trigger change using normal protected PR approval and rerun the previously verified deployment route with operator control. Never bypass required `build`.

## Cost reporting
Public repo standard GitHub-hosted jobs have different included billing rules from private repos. Official account quota/remaining minutes: **UNKNOWN** until verified in GitHub Billing. Run wall time is not a billing statement.

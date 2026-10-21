# JoyLab Research Publishing Fast Lane V1

Status: Candidate / human-and-agent editorial procedure
Purpose: Publish a verified research article without letting unrelated scheduled Actions block authoring or silently labeling an unverified release as published.

## One-request route

Input: "이 주제를 조사하고 JoyLab에 게시해 줘."

1. Research and verify using dated, attributable primary sources. Separate verified facts from interpretation and future scenarios. Identify stale, conflicting, or unverified numerical claims; never release as fact without confirmation.
2. Produce an original Markdown article under `src/data/articles/<slug>.md` with valid `src/content.config.ts` frontmatter, source links, appropriate author/research/trust metadata, correct `publishedAt`, a real canonical URL, and appropriate hero/OG asset paths (only when actual files exist).
3. For investment company research, satisfy the Company Research auto-enrollment contract in `AGENTS.md`: article + `config/company-compact-specs/<articleId>.json` and relevant checks in the same PR. Do not bypass source or financial-content gates.
4. Create a scoped GitHub PR using the connected GitHub API. Article generation, evidence review, diff review, and opening the PR do not need an Actions run or a Cloudflare deploy.
5. Approve/merge only after the repository's required `Build` and any other required checks are GREEN for that exact head SHA; do not bypass protected main, security, monetization, or the release gate. Keep draft or BLOCKED when facts and sources cannot be validated.
6. The currently authorized production deployment owner is `deploy-cloudflare.yml` (main push); do not enable a second Cloudflare-native production deploy before preview asset parity and controlled cutover.
7. Verify production: canonical article GET 200, article title/body and cited sources, archive listing, correct publication date, metadata and images, mobile/PC readability, Worker-specific routes and asset availability. Verify production smoke, Studio smoke and the exact deployment SHA. Record status `PUBLISHED VERIFIED` only after the authoritative `docs/RELEASE_GATE_V1.md` checks succeed.

## Prepublication data refresh

Scheduled GSC/report/market/visual data jobs are manual-first; when a research article needs live inputs, explicitly invoke the relevant `workflow_dispatch` and verify both completion and observation date. Never treat the latest stored snapshot as today's market data without checking timestamps. Unrelated GSC and promotion-report work should not be a publishing prerequisite.

## Failure / recovery rule

- Fact/source/asset gate failed: keep in Draft; provide the precise remediation.
- Required Build failed or queued: do not merge or claim publication.
- Production deployment failed: preserve the last working production; identify the failed step and repair in a new protected PR.
- Production smoke or release gate failed: mark BLOCKED, investigate, and do not claim GOLD.
- Do not change publication dates to simulate freshness; follow `docs/CONTENT_DATE_CONTRACT_V1.md`.

## Cloudflare-native cutover

A migration to Workers Builds is conditional, not assumed. Verify isolated preview, Workers binding/custom domains, Studio EPUB/PDF/provenance binary parity, dry-run, and rollback. Switch to exactly one production deploy owner only after these pass. Cloudflare account/dashboard configuration is a separately authorized operational action.

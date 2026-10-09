# JoyLab P0 AdSense Trust Release Gate — 2026-10-09

## Verified PR snapshot

- Canonical production source: `ohbeopseok-ops/joylab-publishing-os`.
- PR #480 (`adsense-content-quality-v1`): DRAFT, OPEN, NOT MERGEABLE; 113 files, 141 commits at inspection; head `b1822daf20c2360a6661017c3da3d9d4ea2419be`.
- PR #489 (`adsense-content-quality-v1-verify`): DRAFT, OPEN, NOT MERGEABLE; head `73895413a52d53b6100aa9b6591d71b86e0ee2e6`.
- The GitHub commit-status and PR-workflow-run lookup returned no recorded results for either inspected head. **This is not CI success evidence.**
- PR #480 diff contains the content rollout status: 123/123 article metadata READY (Wave1 20, Wave2 48, Wave3 55) but labels automatic release checks CI-DEFERRED. Content metadata READY does **not** imply GOLD or deployed.
- PR #480 also records AdSense placements disabled and account-level evidence pending.

## Safe execution order

1. Freeze both draft PRs: no direct push to `main`; do not merge while `mergeable=false`.
2. Inspect compare-to-main drift and conflicts; identify canonical source of each changed file, and split unrelated commits before a reviewable PR.
3. Run frontmatter duplicate-key check, metadata UPSERT self-test, sourceList quality check, the PRE-GOLD static audit, and local build against **one exact immutable head SHA**.
4. For five representative samples in `config/adsense-gold-sample-v1.json`, validate evidence links, claim-to-evidence fit, author's real identity/policy-compliant byline, risk scenarios, no fabricated citations, actual production-rendered Trust panel, and first-content mobile hierarchy.
5. Run required Build, Mobile Experience, AdSense Site Readiness, Content Integrity, Visual Quality and release checks on the *same* final PR commit when CI quota permits. A missing, skipped, or stale check is not GREEN.
6. Capture verified account-side evidence: AdSense Ready, ads.txt Authorized, CMP live consent, Auto Ads/Auto Optimize setting. Keep ad placement disabled until the approved activation gate is met.
7. Merge only after passing evidence and review; then smoke-test live `aijoylab.kr` including canonical, sitemap, structured data, responsive layouts and article content.
8. Record exact head SHA, test run URL, reviewer, account screenshots/evidence and deployment URL in the release decision.

## Decision

**BLOCK / CI-DEFERRED** until merge conflicts and required final-head checks are resolved. No AdSense activation or production merge is authorized by this audit.

## Acceptance evidence template

| Gate | Status | Evidence URL / SHA | Owner |
|---|---|---|---|
| Merge conflicts resolved | PENDING | | |
| Frontmatter/schema/source quality | PENDING | | |
| Five article-specific Trust sample QA | PENDING | | |
| Build + Mobile + AdSense + Visual | PENDING | | |
| Account settings and ads.txt | PENDING | | |
| Production smoke after merge | PENDING | | |

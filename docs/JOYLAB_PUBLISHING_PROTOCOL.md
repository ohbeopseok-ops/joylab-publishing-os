# JoyLab Research — Shared AI Publishing Protocol V1.0

Status: ACTIVE routing document (no new release authority)
Owner: JoyLab
Effective: 2026-11-21
Applies to: Claude Code, Gemini CLI, Codex, and other repository-capable agents

## Purpose

When the user asks in Korean or English to "write and publish a Research article" or "리서치 사이트에 게시해", complete the **existing** JoyLab Research publishing workflow rather than stopping at a manuscript, commit, or PR. This file is the **single cross-agent entry point**, not a replacement for repository contracts.

Canonical site: https://aijoylab.kr
Repository: https://github.com/ohbeopseok-ops/joylab-publishing-os
Default branch: `main`
Article source: `src/data/articles/<slug>.md`
Public article URL convention: `https://aijoylab.kr/articles/<slug>`

Do not assume a local checkout path. Inspect the latest repository and existing articles before modifying files.

## Authority and precedence

1. `AGENTS.md` (including the global agent OS referenced there) routes project tasks and declares safety rules.
2. `docs/operations/RESEARCH_PUBLISH_FASTLANE_V1.md` is the canonical Research publication procedure.
3. `docs/EDITORIAL_VOICE_CONTRACT_V1.md` defines editorial style; `docs/ARTICLE_ARCHITECTURE_V1_1.md` and `src/content.config.ts` define article type, Trust Layer, and frontmatter.
4. `docs/CONTENT_DATE_CONTRACT_V1.md`, `docs/HOME_CONTENT_SLOT_CONTRACT_V1.0.md`, `docs/BRAND_IDENTITY_CONTRACT_V1.md`, and relevant scoped contracts apply when touched.
5. `docs/GOLD_BASELINE_V1.md`, `docs/RELEASE_GATE_V1.md`, and existing CI/deployment workflows own release decisions. Executable gates must not be weakened or bypassed.

If an instruction in this document conflicts with an authoritative contract or executable gate, follow that authority and report the conflict. This document does not grant deployment permissions or user/human-review approvals.

## One-request publishing route

1. **Discover:** Read `AGENTS.md` and the contracts routed above; inspect `package.json`, `src/content.config.ts`, current source examples, and relevant workflows. Check for an existing article on the same topic or canonical slug. Prefer a meaningful update to duplicates.
2. **Research:** Validate dates, quantitative claims, sources, and attribution against primary records wherever possible. Distinguish verified facts, conjecture, independently sourced analysis, hypothetical scenarios, and breaking-news uncertainty. Record source and data cutoffs.
3. **Editorial:** Write natural Korean professional-column prose: "문장은 전문 칼럼처럼, 근거는 리서치 보고서처럼." Select the correct existing `contentType`. Preserve figures, comparison tables, uncertainty, and source provenance. Do not mechanically impose identical headings on every article.
4. **SEO and Trust:** Create accurate metadata, relevant internal links that exist, canonical URL, source list and Trust Layer supported by actual evidence. Never imply a human review occurred without evidence.
5. **Assets:** Reuse or create appropriately licensed hero/OG assets if helpful. Ensure each declared asset actually exists and satisfies existing asset contracts. Never manufacture market-data visuals as evidence.
6. **Implement:** Edit only required article, image, and related content files. For company investment research, follow the atomic compact-spec enrollment path described in `AGENTS.md`.
7. **Validate:** Run the applicable local contract checks and production build (normally `npm ci` and `npm run build` in a compatible environment). Do not run unrelated checks merely for ritual; required repository checks remain mandatory.
8. **PR and review:** Work on a scoped branch and open a PR. Wait for all required checks on the exact PR head SHA to be GREEN. Resolve review findings without bypassing protected-main or release requirements.
9. **Deploy:** Only merge when permissions and required approvals/checks permit. The currently authoritative production deployment path is the existing `.github/workflows/deploy-cloudflare.yml` after main push. Do not start a duplicate production deployment.
10. **Verify:** Check the actual canonical article URL, title/body, sources, date, hero/OG assets, archive inclusion, mobile/desktop rendering, production smoke and the release-gate evidence tied to the deployed SHA. Never equate a created file, passing build, merged PR, or uploaded bundle with a verified published release.

## State and completion contract

- `DRAFT`: manuscript or content change exists but editorial/fact gate is incomplete.
- `PR_READY`: scoped PR opened; required checks/reviews may be pending.
- `BLOCKED`: factual, permission, approval, CI, or release gate prevents safe publication.
- `PUBLISHED_VERIFIED`: production URL is confirmed and all applicable mandatory production/release checks pass for the actual deployed SHA.
- `FAILED`: a concrete execution failure occurred; include the exact failed step and recovery path.

Completion report must include: state, title, article URL (only if verified), source path, branch, PR URL, head/merge/deploy SHA when available, required checks, production verification, and unresolved issues. Never report an unperformed action as complete.

## Change-control policy

- Change this protocol by a reviewed PR; increment its version and add a concise entry to the log below.
- Make Claude/Gemini/Codex entrypoints point here instead of copying publishing rules into each file.
- Do not introduce new GitHub Actions, scheduled jobs, paid services, or deployment owners merely to maintain this document.
- Do not expose customer data, contact-center recordings, company confidential materials, or personal records in public articles.

## Change log

- 2026-11-21 — V1.0: Introduced shared agent entry point referencing existing editorial, publishing, content-date, and release authorities.

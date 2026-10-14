# JoyLab AdSense Reader-Value Recovery — 2026-10-14

## Decision
Google AdSense Sites showed `aijoylab.kr: 주의 필요 / 가치가 별로 없는 콘텐츠` on 2026-10-04. `ads.txt: 승인됨` is NOT site approval. The current remediation is a first editorial sprint, not a claim of site approval.

## Verified technical baseline
- Publishing OS PR #507 has been merged. Main Build, Cloudflare Deploy, Production Smoke, Release Engine V2 and Freshness checks succeeded on the merged commit.
- `src/data/articles` contains exactly 123 source Markdown articles.
- `AdSense Content Quality Audit V2` and the new `Content Value Audit V3` ran successfully through GitHub Actions on PR #508. The V3 JSON/Markdown per-article evidence is attached to each audit workflow run.
- Initial V3 scan (before the 10-article improvements): **123 published**, 15 files with under two external reference URLs, 10 with under 2,300 non-whitespace body characters, 41 without a recognized official source domain, 99 without a recognized date marker in the *body*, 0 title/intro overlap pairs above the narrow automatic threshold. **Zero overlaps detected does not mean zero duplicate intents.**
- V2 initial structural screen: 84 PASS, 8 P1-A, 5 P1-B, 26 P2, 0 P0 (PASS is automated signals only).
- Subsequent intermediate V3 scan after ten changes: 14 with under two external URL references, 8 under 2,300 characters, 37 without recognized official-domain citations. Counts are heuristic and may miss valid sources or falsely flag missing as-of date when it is already in frontmatter.
- Both scripts identify **candidates for editorial investigation**, not confirmed violations or verified originality.

## First ten content improvements in this PR
| ID | Article | New distinctive reader value | Status |
|---|---|---|---|
| 1 | customer-center-crm-productivity | Synthetic three-line CRM record, ACW calculation, test cases, adoption worksheet | Updated in PR |
| 2 | customer-center-qa-coaching-loop | Fully worked SBI scene, alternative phrase, denominators and 15-minute coaching card | Updated in PR |
| 3 | customer-center-ai-security-guardrails | Data classification matrix, STT injection scenario, security test suite and audit schema | Updated in PR |
| 4 | customer-center-ax-leadership | 30-minute weekly decision agenda, follow-up card, measurable RACI and reporting examples | Updated in PR |
| 5 | customer-center-ax-operating-model | AI vs human rights matrix, 2-week pilot with quality stop rules, decision tree | Updated in PR |
| 6 | what-is-hbm | Reproducible interface bandwidth formula and hypothetical 1,024/2,048-bit worked comparison | Updated in PR |
| 7 | us-china-chip-export-control-timeline | BIS policy scope/date/license evidence matrix; company transmission questions | Updated in PR |
| 8 | korea-shipbuilding-companies-compare | Backlog conversion / operating margin sensitivity, consolidated-subsidiary double-counting warning | Updated in PR |
| 9 | optical-dsp-lpo-lro-1-6t | Hypothetical 128-link optics power budget and BER/serviceability test plan | Updated in PR |
| 10 | china-semiconductor-equipment-localization | Qualification-to-production checklist and evidence score distinct from industry localization percentage | Updated in PR |

All numbers newly introduced for examples are **explicitly hypothetical**. No customer records, fabricated measured results, or invented company figures were inserted. Verified public framework references were added in context. This sprint does not guarantee that all 123 articles are non-duplicative or policy-compliant.

## Site-level blockers to close before AdSense re-review
1. **P0**: Review each of the other 113 published articles for reader utility, duplicate search intent and material factual claims. Audit tool output is a queue; do not automatically noindex or delete.
2. **P0**: Audit home and hubs for thin archive/placeholder pages and validate sitemap / crawl status on publicly deployed pages. Inspect representative pages on mobile 390/430 and desktop 1440.
3. **P0**: Verify production `AdSense Site Readiness Gate V1` and manually check publication links, rendered tables, source references and accessible images.
4. **P1**: Restore AdSense OAuth manually: 2026-10-12 monetization gate logs show `invalid_grant: Token has been expired or revoked`. The secret cannot safely be recovered from GitHub and no secret has been changed here.
5. **P1**: Reconfirm exact Google Sites status. AdSense re-review is a separate **human-controlled** step after quality and policy evidence are complete. Even green CI does NOT constitute AdSense approval.

## Mandatory release validation for PR #508
- Latest commit: Build / Content Identity / content audit V2 & V3 must pass.
- AdSense Site Readiness Gate V1 must pass independently (dead links, sitemap and robots/noindex contract).
- Verify 10 page routes and edits render on mobile and desktop, without unintended SEO changes.
- Required `build` Ruleset must remain. No ads activated. No noindex, redirects or mass archive actions.
- Merge only after checks pass; verify main Cloudflare deployment and Production Smoke.
- If CI or runtime evidence is missing, keep Draft and report specific blocker.

## Evidence and follow-up
- PR: https://github.com/ohbeopseok-ops/joylab-publishing-os/pull/508
- Audit results: https://github.com/ohbeopseok-ops/joylab-publishing-os/actions/workflows/adsense-content-quality-audit-v2.yml
- Source architecture: `docs/ARTICLE_ARCHITECTURE_V1_1.md`
- AdSense content and monetization approval are different gates. The confirmed Google status is still '주의 필요' until the AdSense console changes.

## Next 10 targets for careful review
- customer-center-qa-coaching-loop and customer-center-crm-productivity should be rechecked for completeness after this sprint.
- ai-agent-security-prompt-to-rce-2026, mcp-security-tool-poisoning-2026, ai-database-security-data-layer-2026: prioritize first-party security references.
- why-we-cannot-stand-silence, bach-counterpoint-order-in-chaos, burnout-recovery-starts-with-pause: strengthen original experience/argument and clearly identify nontechnical sources.
- feedback-system-behavior-change, learning-system-reexecution-loop: differentiate question, evidence and unique exercises.
- review closely overlapping Codex/AI Power/HBM clusters manually even when string similarity does not flag them.

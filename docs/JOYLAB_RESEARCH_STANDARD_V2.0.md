# JoyLab Research Standard V2.2

Status: Proposed
Owner: JoyLab
Applies to: all new or materially revised research content

## 1. Purpose
JoyLab Research must separate evidence from interpretation and turn analysis into a reusable decision framework. The public brand frame remains:

**Fact → Interpretation → Scenario/Framework → Action**

The internal production frame is stricter:

**Question → Evidence → Fact → Interpretation → Counter Evidence → Scenario/Framework → Action → Recheck**

## 2. Mandatory core
Every research asset must include:
1. **Research Question** — one primary question.
2. **Evidence Pack** — verifiable sources; prefer primary sources.
3. **Fact / Interpretation separation** — facts must not be written as conclusions.
4. **JoyLab Insight** — an explicit causal or decision framework that adds value beyond summarization.
5. **Action / Watch** — what the reader should monitor, test, compare, or do next.
6. **Limit / Counter Evidence** — conditions under which the analysis could fail or change.
7. **Recheck Trigger** — date, event, metric, or condition that requires review.

## 3. Source hierarchy
Priority:
1. Primary source / official filing / official statistics / first-party technical documentation
2. Academic or institutional research
3. High-quality original reporting
4. Secondary analysis
5. Community or anecdotal evidence

For time-sensitive investment, economics, policy, security, product, and AI-platform claims, at least one primary source is required unless clearly marked unavailable.

## 4. Article types
All articles must declare or clearly map to one of four types.

### Research
Use for markets, companies, economics, infrastructure, technology shifts.
Structure: Question → Evidence → Facts → Interpretation → Scenario → Counter Evidence → Watchlist → Recheck.

### Framework
Use for leadership, performance, fairness, learning, management systems.
Structure: Problem → Evidence → Model → Mechanism → Example → Limits → Application → Recheck.

### Guide
Use for Codex, AI tools, workflows, operations.
Structure: Goal → Preconditions → Steps → Verification → Failure modes → Checklist → Limits → Recheck.

### Benchmark
Use for tests, product comparisons, field trials.
Structure: Hypothesis → Method → Sample/Run conditions → Result → Error/Variance → Limitations → Decision rule → Recheck.

## 5. Hard Gate
A document MUST NOT publish if any item fails:
- Core numeric claim lacks a source.
- Time-sensitive claim has no date or recency check.
- External factual claim has no supporting evidence.
- Non-investment article contains investment-only template residue such as Bull/Base/Bear, buy/sell disclaimer, or unrelated semiconductor START HERE.
- Placeholder or generic generated text remains.
- START HERE / related links point to an unrelated pillar.
- Title does not match the primary research question.
- Materially duplicates an existing JoyLab article without an explicit update/delta.
- AI-generated numbers, quotes, or citations were not verified against source material.

## 6. Quality score (100)
- Evidence Quality 20
- Fact Accuracy 15
- Fact / Interpretation Separation 10
- Original JoyLab Insight 15
- Logical Chain 10
- Actionability 10
- Counter Evidence / Limitation 5
- Internal Linking / Cluster 5
- Search Intent / Title 5
- Editorial / Visual Quality 5

Decision:
- 85–100: PASS / Publish
- 75–84: REVISION
- 0–74: REVISION
- Any Hard Gate failure: BLOCK regardless of score

## 7. Audit labels
Legacy corpus audit uses:
- **PASS** — no obvious template/source defect and V2 indicators present.
- **REVISION** — usable article but generic phrasing, weak limits, weak action/recheck, or incomplete V2 structure.
- **TEMPLATE ERROR** — wrong pillar/template language or irrelevant CTA/link residue.
- **SOURCE WEAK** — insufficient source density or explicit evidence section for a claim-heavy article.

## 8. Template fingerprint rule
Repeated boilerplate is not a substitute for analysis. Generic phrases such as “JoyLab은 단일 뉴스보다…” or repeated universal disclaimers must be customized to the article question. Boilerplate repetition is a revision signal.

## 9. Internal-link contract
Each article should resolve:
Parent Hub → Previous/Foundational Research → Next/Adjacent Research → Related Pillar.
START HERE must remain inside the correct pillar unless the cross-pillar relation is explicitly explained.

## 10. Production sequence
Research Question
→ Evidence Pack
→ Claim Map
→ Article Type
→ Draft
→ Adversarial Review
→ V2 Quality Gate
→ Publish QA
→ Production Smoke Test
→ Recheck registration

## 11. Claim ↔ Source contract
Every new or materially revised article must declare `evidenceMap` in frontmatter.

Example:

```yaml
researchType: research
evidenceMap:
  - claim: "Samsung disclosed HBM-related production or customer progress."
    source: "https://..."
    sourceType: primary
    checkedAt: "2026-09-23"
```

Required fields:
- `claim`: concise material claim.
- `source`: direct supporting URL.
- `sourceType`: primary | institutional | reporting | secondary | community.
- `checkedAt`: YYYY-MM-DD verification date.

Minimum mapped claims:
- Research: 3
- Framework: 2
- Guide: 2
- Benchmark: 3

Minimum primary sources:
- Research: 1
- Guide: 1
- Benchmark: 1
- Framework: 0

A source list without a claim mapping does not satisfy the V2.2 hard gate.

## 12. Enforcement
The repository-level Research Quality Gate audits all markdown in `src/data/articles` on pull requests and pushes that touch research content, standards, templates, or the auditor itself.

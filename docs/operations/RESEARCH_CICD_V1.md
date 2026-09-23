# JoyLab Research CI/CD V1

## Goal
Operate JoyLab Research as an evidence-first publishing system rather than a one-shot writing pipeline.

## Pipeline
Research Question
→ Evidence Pack
→ Claim Map
→ Type Router
→ Draft
→ Adversarial Review
→ Research Quality Gate V2.1
→ Build
→ Visual/Production QA
→ Publish
→ Monthly Corpus Audit
→ Legacy Migration Queue

## Enforcement model
### Existing 70-article legacy corpus
- Always audited.
- Legacy defects are reported as PASS / REVISION / TEMPLATE ERROR / SOURCE WEAK.
- Existing defects alone do not block unrelated repository changes.

### New or modified article
A changed/new article is blocked when:
- `researchType` is missing.
- Source Hard Gate fails.
- Template Contamination is detected.

This converts legacy debt gradually: **touch it → migrate it**.

## researchType contract
Every new or materially revised article must declare one:
- `research`
- `framework`
- `guide`
- `benchmark`

## Monthly Corpus Audit
Schedule: first day of every month, 09:10 KST (00:10 UTC).
Mode: report-only.
Outputs:
- Markdown audit artifact
- JSON audit artifact
- corpus totals by status
- legacy debt trend

## Migration order
1. P0 SOURCE WEAK
2. P1 SOURCE WEAK
3. P2 SOURCE WEAK
4. REVISION articles by cluster importance
5. Template consistency / internal-link cleanup

## Target KPIs
- New/changed article Hard Gate pass rate: 100%
- TEMPLATE ERROR: 0
- SOURCE WEAK legacy count: reduce monthly
- PASS share: increase monthly
- P0 SOURCE WEAK: 0 before broad legacy cleanup

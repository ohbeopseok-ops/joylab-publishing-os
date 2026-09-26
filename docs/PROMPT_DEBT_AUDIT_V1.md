# JoyLab Publishing OS — Prompt Debt Audit V1

Audit date: 2026-09-26  
Scope: repository-level instructions, contracts, runbooks, release/GOLD policy, and CI/deploy governance on `main`  
Method: JoyLab Prompt Debt Audit Scorecard V1  
Mode: audit only — no production behavior changed

## Executive Summary

JoyLab Publishing OS does **not** primarily suffer from excessive prompt prose. Its main debt is **instruction routing and authority fragmentation**.

Highest-impact findings:

1. **No root `AGENTS.md` exists.**
   - Active rules are spread across README, release baseline, release gate, content contracts, AdSense runbooks, UI contracts, and workflows.
   - Action: REWRITE by adding a thin local router.

2. **Release authority is split across `docs/GOLD_BASELINE_V1.md` and `docs/RELEASE_GATE_V1.md`.**
   - Both are valid, but their relationship is implicit.
   - Action: MERGE logically through an explicit precedence rule, not by deleting either document.

3. **README is materially behind repository maturity.**
   - It still describes “V0.1” and a simple Pages CMS → GitHub → build → public URL Gold Case while the repository now contains extensive production, security, AdSense, Books, visual, distribution, and analytics gates.
   - Action: REWRITE.

4. **Many domain contracts are healthy on-demand rules, but there is no router telling agents when to load which contract.**
   - Content Date, Home Slot, Brand Identity, Mobile UI, AdSense, Books, Release Gate, etc.
   - Action: MOVE logically to on-demand loading via a local AGENTS index.

5. **Executable CI/deploy workflows are large but should not be treated as prompt debt.**
   - They are enforcement code, not always-loaded instructions.
   - Action: KEEP and reference them instead of copying their procedures into prompts.

6. **The production release rule is intentionally strict and should remain strict.**
   - Build green alone is not GOLD.
   - Production smoke is mandatory.
   - Action: KEEP.

Overall assessment:
- Prompt token debt: LOW
- Routing/precedence debt: HIGH
- Verification/governance strength: HIGH
- Risk of overloading agents with irrelevant contracts: MEDIUM

## Confirmed Issues

### PD-PUB-001 — Missing project-local canonical router

**Source:** repository root  
**Observed:** no `AGENTS.md` / equivalent canonical task router.

**Debt tags:** UNCLEAR_SCOPE, HIDDEN_PRECEDENCE, BROAD_ALWAYS_LOAD risk

**Why it matters**
An agent has to discover rules manually across many documents and may:
- load too many contracts for a trivial task,
- miss a required domain contract,
- treat historical or descriptive docs as operational authority,
- misunderstand the relationship between GOLD baseline and Release Gate.

**Action:** REWRITE

**Recommended target**
A thin root `AGENTS.md` should:
- import the global JoyLab Agent OS,
- identify project hard rules,
- define contract routing by task type,
- define release authority,
- point to executable gates.

---

### PD-PUB-002 — Release authority relationship is implicit

**Sources:**
- `docs/GOLD_BASELINE_V1.md`
- `docs/RELEASE_GATE_V1.md`

**Debt tags:** HIDDEN_PRECEDENCE, DUPLICATE

Both documents correctly preserve:
- production build/deploy checks,
- production smoke,
- canonical domain fidelity,
- release/GOLD semantics.

But they serve different purposes:
- GOLD Baseline = durable minimum production/security floor
- Release Gate = final authority for labeling a specific release GOLD

**Action:** MERGE logically via explicit precedence.

**Recommended rule**
`GOLD_BASELINE_V1` defines the minimum invariants.
`RELEASE_GATE_V1` decides whether a specific release earns GOLD.
Neither should duplicate the other’s full prose.

---

### PD-PUB-003 — README is stale as the project entry point

**Source:** `README.md`

README currently frames the system as:
- V0.1
- static Astro site
- Pages CMS
- basic Gold Case

The repository now includes:
- protected production release governance,
- Cloudflare deployment,
- production smoke/health,
- content-date contract,
- homepage slot contract,
- brand identity contract,
- AdSense activation/placement governance,
- Books/reader QA,
- distribution workflows,
- research/source gates,
- responsive and visual gates.

**Debt tags:** STALE_PROJECT_RULE, UNCLEAR_SCOPE

**Action:** REWRITE

README should remain descriptive, not become another giant instruction file.

---

### PD-PUB-004 — Domain contracts are valid but lack on-demand routing

**Examples:**
- `docs/CONTENT_DATE_CONTRACT_V1.md`
- `docs/HOME_CONTENT_SLOT_CONTRACT_V1.0.md`
- `docs/BRAND_IDENTITY_CONTRACT_V1.md`
- `docs/MOBILE_UI_CONTRACT_V1.md`
- `docs/ADSENSE_ACTIVATION_CONTRACT_V1.md`
- `docs/ADSENSE_AD_PLACEMENT_CONTRACT_V1.md`
- Books/research/cluster specs

**Debt tags:** UNCLEAR_SCOPE, BROAD_ALWAYS_LOAD risk

**Action:** MOVE logically to on-demand routing.

Do not physically merge these contracts. Their separation is healthy.
The missing layer is an index that says which ones apply to which task.

---

### PD-PUB-005 — Executable gates must remain canonical enforcement

**Sources:**
- `.github/workflows/build.yml`
- `.github/workflows/deploy-cloudflare.yml`
- contract-check scripts
- visual/SEO/security/GOLD scripts

**Action:** KEEP

Reason:
The workflows encode actual enforcement. Prompt files should not restate hundreds of lines of executable checks.

Recommended instruction:
“Run/reference the canonical gate; do not duplicate its internals into agent prompts.”

---

## Rules to KEEP

### PD-PUB-006 — Build green alone is not GOLD
**Source:** `docs/RELEASE_GATE_V1.md`  
**Action:** KEEP

### PD-PUB-007 — Production Smoke is mandatory for GOLD
**Source:** Release Gate + Gold Baseline + deploy workflow  
**Action:** KEEP

### PD-PUB-008 — Protected-main / PR gate / required build baseline
**Source:** `docs/GOLD_BASELINE_V1.md`  
**Action:** KEEP

### PD-PUB-009 — Content Date semantics
**Source:** `docs/CONTENT_DATE_CONTRACT_V1.md`  
**Action:** KEEP

Important invariant:
`publishedAt`, `updatedAt`, and `featuredAt` have distinct meanings.

### PD-PUB-010 — Homepage slot separation
**Source:** `docs/HOME_CONTENT_SLOT_CONTRACT_V1.0.md`  
**Action:** KEEP

### PD-PUB-011 — AdSense staged activation and rollback
**Source:** AdSense contract/runbook  
**Action:** KEEP

These rules are risk controls, not unnecessary process.

## Duplication Map

| Concept | Sources | Decision |
|---|---|---|
| GOLD requires production verification | Gold Baseline, Release Gate, deploy workflow | KEEP; clarify authority hierarchy |
| Production smoke mandatory | Gold Baseline, Release Gate, deploy workflow | KEEP canonical in executable gate; prose may summarize |
| Canonical domain / security fidelity | Gold Baseline, deploy workflow | KEEP |
| Content-date behavior | contract + CI workflow/scripts | KEEP contract as human rule, CI as enforcement |
| Home slot behavior | contract + CI/smoke | KEEP contract + executable enforcement |
| AdSense activation safety | activation contract + runbook + workflow | KEEP; route on demand |

## Conflict Map

No direct destructive contradiction was confirmed in the inspected rules.

The main conflict risk is **authority ambiguity**, especially:

`GOLD_BASELINE_V1`
vs
`RELEASE_GATE_V1`

Resolution should be explicit:
- baseline = minimum durable floor
- release gate = per-release verdict

A second risk is **stale entry-point framing**:
README V0.1 simplicity
vs
current production-grade governance.

## Token Cost Map

The contracts are mostly on-demand and therefore not inherently expensive.

| Source class | Appropriate load mode | Debt risk |
|---|---|---|
| root AGENTS router | Always | currently missing |
| Release/GOLD summary | Conditional for deploy/release | medium if loaded globally |
| Content Date contract | On-demand for dates/content ordering | low |
| Home Slot contract | On-demand for homepage/content selection | low |
| Brand contract | On-demand for identity/channel changes | low |
| Mobile UI contract | On-demand for mobile UI work | low |
| AdSense contracts/runbooks | On-demand for monetization work | low |
| CI/deploy workflow internals | Execute/reference, not prompt-load | low |
| README | Discovery | stale-content risk |

Primary optimization is **selective loading**, not deletion.

## Proposed Contract Router

A future local `AGENTS.md` should map task → contract.

Example:

- content date / ordering → `CONTENT_DATE_CONTRACT_V1.md`
- homepage slots → `HOME_CONTENT_SLOT_CONTRACT_V1.0.md`
- official identity/channel changes → `BRAND_IDENTITY_CONTRACT_V1.md`
- mobile layout → `MOBILE_UI_CONTRACT_V1.md`
- monetization → AdSense contract + runbook
- release/deploy → `GOLD_BASELINE_V1.md` + `RELEASE_GATE_V1.md`
- Books/reader → corresponding Books specs/gates
- generic copy/CSS → do not load unrelated contracts

## Minimal Cleanup Patch — Proposed, not applied

1. Add root `AGENTS.md` as a thin task/contract router.
2. Refresh README to reflect current Publishing OS scope without copying operational contracts.
3. Add one explicit sentence to release governance:
   - Gold Baseline defines minimum invariants.
   - Release Gate determines per-release GOLD.
4. Keep all executable gates unchanged.
5. Do not consolidate specialized contracts into one giant prompt.

## Scenario Walkthroughs

### A — one-line copy fix
Expected:
S0/S1.
Do not load AdSense, Books, Mobile, Home Slot, and Release docs unless touched.

### B — content-date fix
Expected:
S1/S2 + Content Date Contract + relevant CI.
Do not run unrelated architecture reasoning.

### C — homepage slot logic
Expected:
S2/S3 + Home Slot + Content Date + relevant homepage gates.

### D — production deploy change
Expected:
S3/S4 + Gold Baseline + Release Gate + deploy workflow.
Production Smoke remains mandatory.

### E — AdSense placement
Expected:
S3 + activation/placement contract + rollback rules + GOLD QA.

### F — schema/destructive production change
Expected:
S4.
Global rollback/data-integrity rules plus project release gates.

## Verification Checklist

Before cleanup is merged:

- [ ] no production smoke requirement weakened
- [ ] no protected-main / build guard weakened
- [ ] no security-header/canonical-domain invariant removed
- [ ] no Content Date invariant changed
- [ ] no Home Slot invariant changed
- [ ] no AdSense rollback/safety rule removed
- [ ] specialized contracts remain independent
- [ ] local router loads only relevant contracts
- [ ] README becomes current but stays concise
- [ ] executable gates remain canonical

## Audit Result

**Prompt Debt status: HIGH for routing/authority, LOW for raw prompt volume.**

Recommended next action:
create a small local `AGENTS.md` contract router and refresh README in a separate cleanup PR after audit review.

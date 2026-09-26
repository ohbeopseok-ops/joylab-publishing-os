# JoyLab Publishing OS Agent Rules

This repository follows the global JoyLab Agent Operating System from:
`ohbeopseok-ops/joylab-agent-os/AGENTS.md`

Use this file only to route Publishing OS work to the correct local contracts and executable gates.

## 1. Project hard rules

1. A green build alone is not GOLD.
2. A production release is GOLD only when `docs/RELEASE_GATE_V1.md` is satisfied.
3. `docs/GOLD_BASELINE_V1.md` defines the durable minimum production/security floor.
4. Production Smoke is mandatory for GOLD.
5. Do not weaken protected-main, dependency, security-header, canonical-domain, or production-health invariants without an explicit reviewed change.
6. Prefer executable gates over duplicated prose.
7. Do not load unrelated contracts for trivial or isolated work.

## 2. Contract Router

Load only the contracts relevant to the task.

### Content date, freshness, archive ordering
Read:
- `docs/CONTENT_DATE_CONTRACT_V1.md`

Use for:
- `publishedAt`
- `updatedAt`
- `featuredAt`
- archive ordering
- latest-content behavior
- sitemap date behavior

### Homepage slots and editorial placement
Read:
- `docs/HOME_CONTENT_SLOT_CONTRACT_V1.0.md`
- `docs/CONTENT_DATE_CONTRACT_V1.md` when dates/order are involved

Use for:
- Editor picks
- major research
- latest updates
- Books slot
- homepage content duplication/exclusion

### Brand identity and official channels
Read:
- `docs/BRAND_IDENTITY_CONTRACT_V1.md`

Use for:
- brand name/message
- canonical domain
- official contact
- YouTube / Instagram / Threads / Naver / Blogger / GitHub identity

### Mobile UI
Read:
- `docs/MOBILE_UI_CONTRACT_V1.md`

Use for:
- responsive behavior
- mobile density/layout
- mobile interaction contracts

### AdSense / monetization
Read:
- `docs/ADSENSE_ACTIVATION_CONTRACT_V1.md`
- `docs/ADSENSE_AD_PLACEMENT_CONTRACT_V1.md`
- `docs/ADSENSE_APPROVAL_TO_REVENUE_RUNBOOK_V1.md`
- `docs/ADSENSE_ACTIVATION_GOLD_CHECKLIST.md` when activation/GOLD verification is involved

Use for:
- AdSense activation
- placement changes
- CMP
- slot rollout
- monetization rollback
- revenue/UX pilot expansion

### Books / reader
Read the relevant Books specs/gates for the touched feature.

Examples:
- `docs/JOYLAB_BOOKS_WEB_READER_SPEC_V1.md`
- Books-related workflows and QA scripts

### Release / deployment / production
Read:
- `docs/GOLD_BASELINE_V1.md`
- `docs/RELEASE_GATE_V1.md`
- `.github/workflows/deploy-cloudflare.yml`
- `.github/workflows/build.yml`

Use for:
- release semantics
- production deployment
- Cloudflare changes
- security baseline
- production smoke
- GOLD restoration

### Generic copy, isolated CSS, low-risk local changes
Do not automatically load AdSense, Books, Mobile, Home Slot, Brand, or Release documents unless the touched area depends on them.

## 3. Release authority

Use this hierarchy:

1. `docs/GOLD_BASELINE_V1.md`
   - defines the minimum durable production/security invariants.

2. `docs/RELEASE_GATE_V1.md`
   - determines whether a specific release may be labeled GOLD.

3. Executable workflows/scripts
   - enforce the checks.

If prose and executable behavior disagree, investigate before changing either. Do not silently weaken the executable gate.

## 4. Effort routing

Use the global S0–S4 Effort Router.

### S0–S1
Run only relevant local checks.

### S2
Run targeted contract checks, build, and QA for touched areas.

### S3
Run all relevant project gates for production-facing behavior.

### S4
Preserve S3 gates plus rollback, data-integrity, migration, and recovery verification.

## 5. Verification policy

Prefer running the canonical checker instead of restating its logic in prompts.

Examples:
- Content Date → contract checker/workflow
- Home Slot → home slot checker/workflow
- Gold baseline → `scripts/check-gold-baseline.mjs`
- AdSense → AdSense audit/contract scripts
- Production release → build + deploy + smoke + Release Gate

## 6. Historical and descriptive documents

Treat release notes and dated audits as historical evidence unless explicitly marked active.

Do not infer current operational requirements from old milestone documents when a newer contract or executable gate exists.

## 7. Completion

Do not declare PASS merely because:
- a PR exists,
- build started,
- Cloudflare upload succeeded.

For production/release work, completion follows the applicable contract and release gate.

Use PASS / BLOCKED where practical.

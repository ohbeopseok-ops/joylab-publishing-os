# JoyLab Studio MVP V1

Status: IMPLEMENTATION STARTED  
Target repo: `ohbeopseok-ops/joylab-publishing-os`  
Implementation branch: `feat/joylab-studio-mvp-v1`

## 1. Product placement

JoyLab Studio is implemented inside JoyLab Books rather than as a separate product.

```
JoyLab
└─ JoyLab Books
   ├─ Reader
   ├─ Interactive Workbook
   └─ JoyLab Studio
```

The existing repository is Astro 7, not Next.js. MVP therefore follows the current Astro architecture and existing release gates instead of introducing a second framework.

## 2. MVP IA

Routes planned:

- `/studio/` — Studio home + Series 02 vertical slice
- `/studio/projects/` — project list
- `/studio/projects/{projectId}/` — dashboard
- `/studio/projects/{projectId}/manuscript/`
- `/studio/projects/{projectId}/structure/`
- `/studio/projects/{projectId}/interactive/`
- `/studio/projects/{projectId}/design/`
- `/studio/projects/{projectId}/validation/`
- `/studio/projects/{projectId}/preview/`
- `/studio/projects/{projectId}/export/`
- `/studio/projects/{projectId}/settings/`

V1 vertical slice implements `/studio/` first and proves:

READ → THINK → RECORD → ACT

## 3. P0 / P1 / P2 backlog

### P0 — Vertical Slice

- [x] Interactive Block Contract V1
- [x] JSON Schema artifact
- [x] Zod validator using `astro/zod`
- [x] Series 02 Chapter 1 self-assessment demo data
- [x] Series 02 Chapter 2 risk-score demo data
- [x] Series 02 Chapter 3 Persona 0 Moment Canvas demo data
- [x] localStorage-only persistence contract
- [x] no-PII warning contract
- [x] `/studio/` mobile-first demo shell
- [ ] CI build GREEN
- [ ] responsive visual check at 360 / 390 / 430 / 768 / 1440

### P1 — Studio Workflow

- [ ] project list + project dashboard
- [ ] manuscript editor
- [ ] book structure editor
- [ ] interactive block builder
- [ ] Web / EPUB / Print output settings
- [ ] validation dashboard with PASS / CHECK / FIX
- [ ] preview modes
- [ ] simulated export state

### P2 — Publishing Engine

- [x] EPUB generation adapter (EPUB Generator V1)
- [x] print PDF adapter (Print PDF Generator V1)
- [ ] output artifact versioning
- [ ] project migration/version contract
- [ ] export provenance manifest
- [ ] production analytics limited to non-content events
- [ ] optional persistence backend after privacy review

## 4. Interactive Block Contract V1

Canonical files:

- `src/lib/studio/interactive-block-contract.ts`
- `config/contracts/interactive-block-v1.schema.json`

Supported P0 block types:

- `self_assessment`
- `risk_score`
- `persona_canvas`

Contract rules:

1. Block IDs are unique.
2. Chapter IDs use `chapter-00` form.
3. Contract version is explicit.
4. User responses stay in localStorage for MVP.
5. Response content is not sent to analytics.
6. Real customer-identifying information is explicitly discouraged.
7. Build-time demo data is parsed with the Zod contract.

## 5. Series 02 Demo

Demo title:

**Series 02 — 기억 부채에서 실행 시스템까지**

P0 chapters:

1. Chapter 01 — 기억 부채 진단
2. Chapter 02 — Memory Debt Risk Score
3. Chapter 03 — Persona 0 Moment Canvas

Storage key:

`joylab-series-02-memory-debt-workbook-v1`

## 6. GOLD PASS criteria

This feature must not be called GOLD until the repository release authority is satisfied.

Feature-level gates:

- [ ] Zod contract parses Series 02 demo data
- [ ] no horizontal scroll at 360 / 390 / 430
- [ ] input controls usable at 200% text zoom
- [ ] localStorage save + reload restore works
- [ ] reset removes only this workbook key
- [ ] Chapter 2 score is deterministic
- [ ] no response body is posted to server or analytics
- [ ] no customer-identifying data is seeded in demo fixtures
- [ ] Studio route remains `noindex,follow` while MVP is experimental
- [ ] Astro build succeeds

Repository release gates remain authoritative:

BUILD GREEN → Cloudflare deploy GREEN → Production Smoke GREEN → required Reader/Mindmap QA GREEN → Release Gate V1.

## 7. Explicit non-goals for P0

- collaborative editing
- payments
- DRM
- ISBN automation
- publisher API distribution
- AI full-book generation
- server-side user response storage
- real EPUB/PDF binary generation

## 8. Next implementation order

1. Merge P0 only after CI and responsive checks.
2. Add project dashboard and manuscript/structure routes.
3. Generalize Interactive Builder from Series 02 fixtures.
4. Add validation engine.
5. Add simulated exports.
6. Only then connect real EPUB/PDF generation.

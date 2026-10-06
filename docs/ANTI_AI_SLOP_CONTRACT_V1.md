# JoyLab Anti-AI-Slop Contract V1

Status: Active candidate  
Parent: `docs/JOYLAB_DESIGN_SYSTEM_V3.md`  
Homepage companions:
- `docs/HOMEPAGE_DESIGN_CONTRACT_V1.md`
- `docs/HOMEPAGE_VERTICAL_BUDGET_CONTRACT_V2.md`
Executable evidence (Visual Gate V1.1):
- `scripts/qa-responsive-visual-v2.mjs`
- `scripts/qa-homepage-visual-evidence-v1.mjs`

## 1. Purpose

Prevent JoyLab public UI from drifting toward generic AI-generated design while preserving the canonical JoyLab identity:

- Deep Navy / Electric Blue
- restrained Joy Yellow
- editorial hierarchy
- evidence-led reading
- Fact → Interpretation → Scenario → Action

Anti-Slop is not a replacement design system. It is a constraint layer on Design System V3.

## 2. Core rule

A design choice must have at least one of these reasons:

1. information hierarchy,
2. interaction/state,
3. editorial meaning,
4. brand identity,
5. accessibility/readability.

If the only reason is “modern”, “premium”, “AI-like”, or “looks good”, reconsider it.

## 3. Critical — release blocking

Any confirmed critical finding blocks release.

- fabricated evidence, metrics, charts, testimonials, or activity presented as real;
- decoration obscures or displaces the primary task;
- 390px critical action becomes inaccessible;
- keyboard/focus regression blocks a core interaction;
- horizontal overflow breaks the primary reading path;
- visual change breaks canonical content/SEO/AdSense/release semantics.

## 4. Major patterns

Three or more confirmed Major patterns require REWORK.

### AS-M01 — AI gradient shorthand
Do not use purple/indigo/neon gradients merely to signal AI or technology.
JoyLab navy/blue gradients may remain only when they are part of the V3 brand field and do not create ornamental noise.

### AS-M02 — Equal-card default
Do not turn every taxonomy or concept group into 3 equal cards.
A real collection of articles/products may use repeated cards when comparison/scanning benefits.

### AS-M03 — Card everything
Prefer editorial rows, rules, columns, tables, indexes, and whitespace when a raised/boxed surface adds no meaning.

### AS-M04 — Pill everything
Pills are reserved for compact status, tags, filters, or controls with a clear semantic reason.

### AS-M05 — Generic SaaS sequence
Do not default to Hero → feature cards → logos → testimonials → CTA.

### AS-M06 — Decorative dashboard
Charts, gauges, counters, and “system stats” must support a real decision or explain a real system.

### AS-M07 — Repeated hover lift
Repeated collections should not all animate upward on hover. Prefer underline, border, color, or image treatment.

### AS-M08 — Universal large radius/shadow
Radius and elevation must communicate hierarchy. Do not apply the same large radius/shadow to unrelated surfaces.

### AS-M09 — Meaningless numbering
Numbers such as 01/02/03 are allowed when they encode order, rank, sequence, or navigation. They are not decoration.

### AS-M10 — Ornament before evidence
Glow, orb, grid, abstract 3D, background motion, or fake device frames must not outrank content/evidence.

## 5. Homepage-specific contract

The homepage is a research index, not a template landing page.

### Required hierarchy
1. Brand thesis + editorial judgment
2. Pillar navigation as an editorial index
3. Featured research signals/hubs
4. Major research
5. Start-here guide
6. Books
7. Latest / archive

### Pillars
The three Pillars are taxonomy/navigation, not “features”.
Desktop should read them as an editorial index/list rather than three identical promotional cards.

### Featured hubs
Featured hubs may use stronger surfaces because they represent active research clusters.
Their visual treatment must differ from the Pillar index and ordinary article cards.

### Research cards
Repeated article cards are allowed because they represent a real collection.
They should avoid unnecessary hover lift and decorative gradients when a real hero image exists.

### Guide
Numbering is semantic because the Guide provides entry points/order.
Do not add badges or CORE/SPECIALIST labels unless they materially help navigation.

## 6. Render evidence

For homepage-facing changes, preserve screenshots/metrics at:
- 390 × 844
- 768 × 1024
- 1280 × 800

Evidence should compare:
- production baseline (“before”)
- PR preview/local build (“after”)

Track:
- horizontal overflow
- hero height
- Pillar height
- first-screen primary cues
- repeated raised surfaces
- pill-like controls
- gradient-text use
- hover-lift candidates
- section positions

Static/computed-style counts are review evidence, not automatic proof of bad design.

## 7. Release interpretation

PASS requires:
- Critical = 0
- no unexplained Major regression
- existing Homepage Vertical Budget V2 PASS
- existing Mobile UI / responsive checks PASS
- Build PASS

GOLD still follows the repository Release Gate. Anti-Slop PASS alone is not GOLD.

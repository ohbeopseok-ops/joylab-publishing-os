# JoyLab UI Skill Stack V1.0

Status: Active candidate
Scope: JoyLab public UI, Books Reader, LeaderDesk-style product UI
Effective: 2026-09-24

## Goal
Turn UI work into a repeatable quality pipeline instead of one-off styling.

## Default stack
1. frontend-design — hierarchy, composition, typography, anti-generic direction
2. shadcn — component consistency when the project uses shadcn-compatible UI
3. emil-design-eng — design-to-engineering refinement and implementation discipline
4. interaction-design — feedback, state, transition, loading, microinteraction
5. accessibility — keyboard, focus, semantics, touch targets, contrast
6. design-review — final critique against product intent and consistency

Optional only when the task needs it:
- apple-design — restrained product/system UI
- beautiful-shadows — depth only when hierarchy needs it
- better-interface — density, spacing, interface polish
- adapt — responsive adaptation and layout transformation

## Invocation order
Never invoke all skills as independent redesigners at once.
Use this sequence:

DESIGN INTENT → COMPONENT SYSTEM → INTERACTION → ACCESSIBILITY → REVIEW

## Project mapping
### JoyLab Books / Web Reader
frontend-design → emil-design-eng → interaction-design → accessibility → design-review

### Investment / Research Dashboard
frontend-design → shadcn → better-interface → interaction-design → design-review

### Operations / LeaderDesk
shadcn → apple-design → adapt → accessibility → design-review

## Non-negotiable JoyLab rules
- Preserve JoyLab Design System V3 tokens and brand hierarchy.
- Prefer borders, spacing and typography over decorative shadows.
- Yellow is reserved for decisive CTA/action states.
- Do not break canonical URLs, schema, sitemap, analytics, reader assets or data contracts.
- Mobile baseline is 390px.
- Interactive targets should be at least 44px; primary action controls should target 48px where practical.
- Preserve visible focus states.
- Respect prefers-reduced-motion.
- No redesign is GOLD until build + UI contract + visual QA + interaction QA + production smoke pass.

## Agent prompt contract
When asked to improve a UI:
1. Read JoyLab Design System V3 and relevant page-family styles.
2. State the user task and visual hierarchy before changing code.
3. Use the default stack in order.
4. Keep functional/data behavior unchanged unless the task explicitly includes behavior.
5. Report files changed and why.
6. Run the applicable UI Quality Gate before marking complete.

## GOLD output
Every UI PR should leave:
- code changes
- before/after rationale
- accessibility notes
- 1440 and 390 evidence when applicable
- passing CI artifact

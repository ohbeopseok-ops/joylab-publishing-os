# Books Reader UI Audit V1

Date: 2026-09-24
Target: JoyLab Books Reader
Baseline: JOYLAB_DESIGN_SYSTEM_V3.md

## Summary
The Reader already has strong editorial typography, themes, progress, TOC, responsive layout and reduced-motion handling. The main gap is not visual identity; it is interaction ergonomics and automated quality enforcement.

## P0 — fixed in this branch
### 1. Touch targets
Existing reader toolbar controls were 36×36px and mobile overrides reduced them to 32×34px.
V3 requires 44px minimum and 48px where practical.

Change:
- toolbar controls: 44×44px minimum
- TOC close control: 44×44px minimum
- footer navigation controls: 44px minimum height
- mobile no longer shrinks reader controls below 44px

### 2. Keyboard focus
Reader CSS did not define an explicit focus-visible treatment.

Change:
- add 3px high-visibility focus ring
- keep offset so the ring is not clipped into control borders

## P1 — next implementation
1. TOC focus management
   - opening TOC should move focus into the panel
   - closing should restore focus to the toggle
   - Escape should close the TOC
2. Settings focus management
   - focus should enter settings panel when opened
   - Escape/outside click behavior should be deterministic
3. Semantic progress
   - expose reading progress to assistive tech with aria-valuenow/aria-valuetext where a progressbar role is used
4. Current chapter announcement
   - chapter changes should update an aria-live region without stealing focus
5. Theme controls
   - selected theme and font choice should expose pressed/selected state
6. Contrast regression
   - automate contrast checks for light/warm/dark theme tokens

## P2 — visual polish
1. Reduce top-toolbar competition with reading content at mobile widths.
2. Keep only primary controls immediately visible; move low-frequency controls into settings.
3. Normalize icon optical size rather than merely box size.
4. Refine sticky footer safe-area behavior on iPhone.
5. Add subtle state transitions only where they communicate cause/effect.

## Skill pipeline for Reader
frontend-design
→ emil-design-eng
→ interaction-design
→ accessibility
→ design-review

## Reader GOLD
A Reader UI change is complete only when:
- Astro build passes
- UI contract passes
- Book Web Reader contract passes
- 1440 screenshot QA passes
- 390 screenshot QA passes
- keyboard path passes
- no horizontal overflow
- production smoke passes after deployment

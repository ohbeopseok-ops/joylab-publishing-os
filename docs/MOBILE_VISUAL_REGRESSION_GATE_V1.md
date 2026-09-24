# Mobile Visual Regression Gate V1

Status: GOLD candidate
Reference pages: About, Contact, Books
Reference viewports: 390×844, 430×932, 820×1180

## Purpose

This gate protects JoyLab from mobile regressions that are easy to miss in desktop review:

- horizontal overflow
- accidental return to oversized vertical spacing
- footer expansion
- undersized touch targets
- broken mobile navigation state
- page-family components growing beyond the mobile density contract

## Evidence

Every CI run stores full-page PNG screenshots for:

- About × 390 / 430 / 820
- Contact × 390 / 430 / 820
- Books × 390 / 430 / 820

It also stores `report.json` with layout geometry and pass/fail checks.

## Blocking rules

The gate fails when any of these occur:

1. horizontal overflow > 1px
2. JavaScript/page console error
3. required page-family section missing
4. mobile hamburger visibility is wrong for the viewport
5. page height exceeds the density budget
6. footer exceeds its mobile/Pad height budget
7. official-channel cards drop below 48px
8. critical interactive targets fall below 44×44
9. About summary becomes oversized
10. Contact inquiry chips fall outside 44–64px
11. Books category cards exceed the mobile density budget

## Design intent

The gate is geometry-driven rather than screenshot-pixel-driven. This avoids false failures from font rasterization, anti-aliasing, and browser rendering noise while still producing screenshots for human review.

Pixel-level baseline comparison can be added later for components whose rendering is stable enough to justify it.

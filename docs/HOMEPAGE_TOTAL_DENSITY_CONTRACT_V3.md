# Homepage Total Density Contract V3

Status: Active candidate  
Extends:
- `docs/HOMEPAGE_DESIGN_CONTRACT_V1.md`
- `docs/HOMEPAGE_VERTICAL_BUDGET_CONTRACT_V2.md`

Executable gate: `scripts/qa-responsive-visual-v2.mjs`

## Purpose

V1 protects the Guide → Books → Latest rhythm.
V2 protects the height of major homepage sections.
V3 protects the **total desktop homepage length** so many individually-valid sections cannot accumulate into a vertically bloated homepage.

## Desktop total-density budgets

| Viewport | Production baseline | Maximum |
| --- | ---: | ---: |
| 1280 × 800 | 6.63 screens | **7.00 screens** |
| 1440 × 900 | 5.84 screens | **6.20 screens** |

The budget is calculated as:

`document height / viewport height`

This gives the homepage a small editorial growth allowance while preventing silent long-page drift.

## Enforcement

The Responsive Visual Gate V2 fails when the homepage exceeds the applicable desktop density limit.

This rule is additive to V2 section budgets. A page must satisfy both:

1. individual section height budgets,
2. overall homepage density budget.

## Change control

Do not increase the density limit merely to make CI green.

A threshold change requires:
1. 1280 and 1440 before/after full-page screenshots,
2. a written reason for why added vertical length improves homepage navigation,
3. confirmation that the added content cannot be moved into a Guide, Hub, Books page, or archive surface.

## Mobile

V3 is desktop-only. Mobile density continues to be governed by the existing Responsive Visual Gate page budgets and Mobile Visual Regression Gate.

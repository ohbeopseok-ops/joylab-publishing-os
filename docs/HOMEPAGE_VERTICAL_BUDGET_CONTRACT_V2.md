# Homepage Vertical Budget Contract V2

Status: Active candidate  
Extends: `docs/HOMEPAGE_DESIGN_CONTRACT_V1.md`  
Executable gate: `scripts/qa-responsive-visual-v2.mjs`

## Purpose

Keep the JoyLab homepage from gradually turning into a sequence of oversized landing-page sections.

V1 previously fixed the Guide → Books → Latest rhythm. Since the Research-only separation (2026-10-21), the Books shelf is no longer a Research homepage section. V2 continues to enforce a tighter direct Guide → Latest content gap while retaining the original section height limits.

## Desktop budgets

Applies at **1280px and above**.

| Surface / metric | Maximum |
| --- | ---: |
| Hero height | **530px** |
| Pillars height | **370px** |
| Research Guide height | **380px** |
| Books editorial shelf on Research home | **Absent** |
| Research Guide → visible Latest content gap | **48px** |

Historical Production baseline before the Research-only homepage separation (for comparison, not a current requirement):

| Metric | 1280px | 1440px |
| --- | ---: | ---: |
| Hero | 494px | 511px |
| Pillars | 350px | 350px |
| Research Guide | 362px | 347px |
| Books | 367px | 376px |
| Guide → Books | 26px | 26px |
| Books → Latest | 0px | 0px |

The current Research-only 0–48px Guide → **visible Latest content** requirement is measured to `.home-latest-row`, including padding before content. The old Books baseline is historical, not a required surface.

## Enforcement

The Responsive Visual Gate V2 measures rendered geometry in Chromium after load.

The contract fails when any desktop homepage measurement exceeds its budget.

Do not increase a threshold merely to make CI green. A threshold change requires:

1. before/after visual evidence at 1280 and 1440,
2. an editorial reason for changing hierarchy,
3. confirmation that the homepage still behaves as an index rather than a chain of hero sections.

## Mobile

Mobile continues to use the Mobile Visual Regression Gate and Responsive Visual Gate density, overflow, navigation, image, footer, and touch-target checks. V2 height budgets are intentionally desktop-only because mobile sections stack by design.

# Homepage Vertical Budget Contract V2

Status: Active candidate  
Extends: `docs/HOMEPAGE_DESIGN_CONTRACT_V1.md`  
Executable gate: `scripts/qa-responsive-visual-v2.mjs`

## Purpose

Keep the JoyLab homepage from gradually turning into a sequence of oversized landing-page sections.

V1 fixed the Guide → Books → Latest rhythm. V2 adds height budgets for the major homepage surfaces above that sequence.

## Desktop budgets

Applies at **1280px and above**.

| Surface / metric | Maximum |
| --- | ---: |
| Hero height | **530px** |
| Pillars height | **370px** |
| Research Guide height | **380px** |
| Books editorial shelf height | **390px** |
| Research Guide → Books gap | **48px** |
| Books → Latest gap | **48px** |

Current Production baseline after Homepage Compact Redesign V2:

| Metric | 1280px | 1440px |
| --- | ---: | ---: |
| Hero | 494px | 511px |
| Pillars | 350px | 350px |
| Research Guide | 362px | 347px |
| Books | 367px | 376px |
| Guide → Books | 26px | 26px |
| Books → Latest | 0px | 0px |

These limits preserve a small editorial margin without allowing large vertical drift.

## Enforcement

The Responsive Visual Gate V2 measures rendered geometry in Chromium after load.

The contract fails when any desktop homepage measurement exceeds its budget.

Do not increase a threshold merely to make CI green. A threshold change requires:

1. before/after visual evidence at 1280 and 1440,
2. an editorial reason for changing hierarchy,
3. confirmation that the homepage still behaves as an index rather than a chain of hero sections.

## Mobile

Mobile continues to use the Mobile Visual Regression Gate and Responsive Visual Gate density, overflow, navigation, image, footer, and touch-target checks. V2 height budgets are intentionally desktop-only because mobile sections stack by design.

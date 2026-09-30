# Homepage Design Contract V1

Status: Active  
Scope: JoyLab homepage desktop compact rhythm  
Executable gate: `scripts/qa-responsive-visual-v2.mjs`

## Purpose

The homepage is a research index, not a chain of full landing-page heroes.  
The Guide → Books → Latest sequence must stay visually compact so new sections do not reintroduce oversized whitespace.

## Desktop contract

Applies to desktop viewports at **1280px and above**.

| Metric | Contract |
| --- | ---: |
| Books editorial shelf height | **≤ 390px** |
| Research Guide → Books vertical gap | **0–48px** |
| Books → Latest vertical gap | **0–48px** |

Measured elements:

- Guide: `.home-guide`
- Books: `.home-books-v2__grid`
- Latest section: `.home-section--latest`

The gate uses rendered browser geometry from Playwright after the page has loaded and lazy images have completed.

## Failure meaning

A failure is intentional. It means a homepage layout change has made the Books shelf or the adjacent vertical rhythm materially larger than the approved Compact V2 baseline.

Do not raise these limits merely to make CI green. If a larger section is editorially necessary, review the homepage hierarchy first and change this contract explicitly in the same PR.

## Mobile

Mobile remains governed by the existing Mobile Visual Regression Gate and Responsive Visual Gate touch/overflow/density checks. This contract currently does not impose the 390px Books-height limit on mobile because the Books shelf intentionally stacks there.

## Change control

Any modification to these thresholds should include:

1. a before/after visual artifact,
2. the reason for changing homepage hierarchy,
3. updated Responsive Visual Gate evidence at 1280 and 1440.

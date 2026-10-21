# Homepage Design Contract V1

Status: Active  
Scope: JoyLab homepage desktop compact rhythm  
Executable gate: `scripts/qa-responsive-visual-v2.mjs`

## Purpose

The homepage is a research index, not a chain of full landing-page heroes.  
The Research-only Guide → Latest sequence must stay visually compact; legacy Books pages are preserved but not promoted on the Research homepage.

## Desktop contract

Applies to desktop viewports at **1280px and above**.

| Metric | Contract |
| --- | ---: |
| Books editorial shelf on Research home | **Absent** |
| Research Guide → Latest vertical gap | **0–48px** |

Measured elements:

- Guide: `.home-guide`
- Books legacy shelf: `.home-books-v2__grid` must be absent on Research home
- Latest section: `.home-section--latest`

The gate uses rendered browser geometry from Playwright after the page has loaded and lazy images have completed.

## Failure meaning

A failure is intentional. It means the Research home retained a Books shelf or the Guide → Latest rhythm violates the approved 0–48px visual budget.

Do not raise these limits merely to make CI green. If a larger section is editorially necessary, review the homepage hierarchy first and change this contract explicitly in the same PR.

## Mobile

Mobile remains governed by the existing Mobile Visual Regression Gate and Responsive Visual Gate touch/overflow/density checks. The mobile homepage no longer contains the Books shelf. Legacy Books URLs remain separately tested for usability.

## Change control

Any modification to these thresholds should include:

1. a before/after visual artifact,
2. the reason for changing homepage hierarchy,
3. updated Responsive Visual Gate evidence at 1280 and 1440.

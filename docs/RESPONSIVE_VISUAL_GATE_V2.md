# Responsive Visual Gate V2

Status: GOLD candidate

## Coverage

Representative page families:
- Homepage
- About
- Contact
- Books
- Research article
- Investing Guide
- AI Productivity Guide
- Growth & Leadership Guide

Viewports:
- 390×844
- 430×932
- 820×1180
- 1440×900

This produces 32 full-page screenshots per run.

## Blocking checks

- HTTP health
- console / page errors
- horizontal overflow
- broken images
- required page-family sections
- viewport-specific page-height density budget
- mobile navigation visibility
- footer height
- 48px official-channel cards on touch layouts
- 44×44 critical touch targets on touch layouts

## V2 difference from Mobile Visual Regression Gate V1

V1 protects About / Contact / Books mobile geometry.

V2 expands the contract to the whole public-site family and adds a 1440px desktop reference. The goal is not pixel-perfect image diffing. It is stable geometry + screenshot evidence with fewer anti-aliasing false positives.

## Mobile Density V3

The same change set extends compact mobile rhythm to:
- Homepage
- Research article pages
- Guide pages based on the semiconductor-guide shell

Desktop composition is intentionally unchanged.

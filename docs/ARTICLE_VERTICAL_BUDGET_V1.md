# JoyLab Article Vertical Budget V1

## Purpose

Prevent monetization slots from breaking JoyLab's reading layout on desktop or mobile.

## Hard gates

- Viewports: 390, 1280, 1440.
- States: deterministic filled and unfilled ad states.
- Unfilled ad reserved outer height: **48px max**.
- Ad/content max-width overrun: **0px**.
- Horizontal page overflow: **0px**.
- CLS: **0.10 max**.
- Responsive display slot: **970px max**, while never exceeding its parent content column.

## Current regression targets

1. Article: `/articles/samsung-vs-sk-hynix-ai-memory` · `article-end`
2. Book detail: `/books/ax-customer-center` · `book-end`

The Books target is included because the production issue that triggered V1 was a book-end responsive unit expanding across the full `.book-v2-main` width and leaving a visually dominant ad region between Author and Research Graph.

## Layout rule

A monetization slot belongs to the same reading grid as the content around it. It must never become a viewport-wide block unless that page explicitly defines a full-bleed ad product.

Unfilled slots collapse. Filled slots remain centered, responsive, and constrained to the content column.

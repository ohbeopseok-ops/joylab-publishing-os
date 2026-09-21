# JOYLAB Design System V3

> Status: Active  
> Effective date: 2026-09-21  
> Scope: Desktop + Mobile, all JoyLab public pages  
> Supersedes: `JOYLAB_DESIGN_SYSTEM_V2.0.md` for new work  
> Mobile companion: `JOYLAB_MOBILE_DESIGN_SYSTEM_V1.md`

## 1. System goal

JoyLab Design System V3 unifies the desktop editorial system and the Mobile UI V1.2 system into one product contract.

JoyLab should feel like one research product across:

- Homepage
- Pillar / Guide
- Research Article
- Books Hub / Book Landing / Web Reader
- About
- Contact
- Privacy / Info pages
- Footer and global navigation

The system optimizes for clarity, evidence, reading flow, decision support, and repeatable implementation.

## 2. Brand principles

Positioning:

**생각을 분석하고, 분석을 실행으로.**

Editorial method:

**Fact → Interpretation → Scenario → Action**

Brand flow:

**생각 → 분석 → 실행 → 성장**

Visual character:

- premium research editorial
- restrained, credible, evidence-led
- dark navy + electric blue as the core identity
- white space for reading
- yellow used sparingly for one decisive CTA or action state
- decoration never outranks information hierarchy

## 3. Canonical color tokens

- Primary Navy: `#0B1F4D`
- Deep Editorial Navy: `#071938`
- Electric Blue: `#1677FF`
- White: `#FFFFFF`
- Soft Background: `#F5F8FC`
- Border: `#DFE6F0`
- Primary Text: `#15345D`
- Muted Text: `#6D7D92`
- Joy Yellow: `#FFD83D`

Rules:

- navy = authority / editorial field
- blue = navigation / interaction / research emphasis
- yellow = decisive CTA only
- borders + spacing should do more structural work than shadows

## 4. Layout system

### Desktop

- maximum editorial canvas: ~1180px
- article prose target: 760–780px
- standard gutter: 24px
- standard section spacing: 56–72px

### Mobile

Breakpoint:

```css
@media (max-width: 640px)
```

Core tokens come from `src/styles/mobile-ui-v1.css`:

```css
--m-shell-x: 18px;
--m-section-y: 44px;
--m-gap: 16px;
--m-radius: 18px;
--m-title: clamp(2rem, 10vw, 3rem);
--m-section-title: clamp(1.7rem, 8.6vw, 2.35rem);
--m-body: 1rem;
```

V1.2 component tokens:

```css
--m-touch: 48px;
--m-footer-gap: 26px;
--m-footer-link-h: 44px;
--m-form-gap: 10px;
--m-form-control-h: 48px;
--m-form-radius: 14px;
--m-reader-pad: 14px;
--m-reader-radius: 18px;
--m-reader-line: 1.82;
```

## 5. Typography

### Desktop

- Hero H1: 56–86px by page family
- Section H2: 30–44px
- Card H3: 18–22px
- Body: 16–18px
- Meta: 11–13px

### Mobile

- Page title: `--m-title`
- Section title: `--m-section-title`
- Body: ~16px
- Form controls: never below 16px on iPhone
- Korean headings: `word-break: keep-all`
- Body line-height: ~1.7–1.8

## 6. Global shell

### Desktop

- horizontal navigation
- clear content canvas
- no decorative navigation behavior that competes with reading

### Mobile

- 68px sticky white header
- JoyLab brand left
- 44×44 hamburger right
- fullscreen white menu
- body scroll lock while open
- Escape closes menu
- current location uses `aria-current="page"`
- active item uses blue foreground + soft-blue background
- `오늘의 리서치 보기 →` is the mobile primary navigation CTA

Do not create page-specific mobile navigation variants.

## 7. Component system

### 7.1 Footer

Source: `SiteFooter.astro`

Component tokens:

- `--footer-bg`
- `--footer-fg`
- `--footer-muted`
- `--footer-accent`
- `--footer-gap`
- `--footer-radius`
- `--footer-link-min`

Mobile Footer maps to `--m-footer-gap` and `--m-footer-link-h`.

### 7.2 Contact Form

Source: `contact-v2.css`

Component tokens:

- `--contact-card-radius`
- `--contact-form-radius`
- `--contact-control-radius`
- `--contact-control-h`
- `--contact-action-h`
- `--contact-grid-gap`
- `--contact-field-gap`

Mobile values map to shared Mobile UI V1.2 form tokens.

### 7.3 Books Reader

Source: `public/books/ax-customer-center/interactive.html`

Reader tokens:

- `--reader-page-bg`
- `--reader-surface`
- `--reader-border`
- `--reader-accent`
- `--reader-accent-2`
- `--reader-mobile-pad`
- `--reader-mobile-radius`
- `--reader-mobile-line`
- `--reader-control-hit`

The web reader may remain visually distinct from the main site, but spacing, touch targets, and reading comfort must follow V3.

## 8. Page-family rules

### Homepage

Purpose: explain JoyLab, surface current research, and route readers into the system.

### Pillar / Guide

Purpose: convert a topic into an ordered research journey.

### Research Article

Purpose: deliver one complete argument with evidence, interpretation, scenarios, and next actions.

### Books

Purpose: turn JoyLab research and operating knowledge into durable long-form products.

Books mobile rules:

- one-column cards
- cover art uses `object-fit: contain`
- no cover cropping for layout convenience
- CTA stack is vertical
- book landing and reader optimize for sustained reading

### About

Compact mobile hero, one-column cards, shared section rhythm.

### Contact

- one-column mobile flow
- desktop sticky aside becomes static on mobile
- 16px form control text minimum
- action buttons stack vertically
- reduced vertical gaps on iPhone

### Privacy / Info

- one readable column
- shared title scale
- compact legal/information heading scale
- generous paragraph line-height
- no active nav item required unless a future top-level Legal item is added

## 9. Active-navigation mapping

- semiconductor / AI power / shipbuilding / US rates → 투자·경제
- AI productivity / AI economics / AI infrastructure / AI security → AI·생산성
- growth leadership → 성장·리더십
- article pages → Research
- books → Books
- about → About
- contact → Contact
- privacy → no active top-level item

## 10. Accessibility contract

Minimum requirements:

- hamburger ≥ 44×44px
- active nav target ≥ 44px high
- action buttons ≥ 48px where practical
- form controls ≥ 16px text on iPhone
- `aria-current="page"` for current nav
- explicit accessible labels where visual text is ambiguous
- visible focus states preserved
- menu closing must restore page scrolling
- reader controls meet touch-target expectations

## 11. GOLD QA contract

Mobile baseline:

- viewport: 390×844
- no horizontal overflow
- hamburger visible
- fullscreen menu opens
- body scroll locks
- correct active state, or intentionally none
- mobile research CTA visible
- Escape closes and unlocks
- screenshot artifact generated

Current mobile GOLD routes:

- `/books`
- `/about`
- `/guides/investing`
- `/guides/ai-productivity`
- `/guides/growth-leadership`
- production Research Article
- `/contact`
- `/privacy`

Reader changes must also pass the existing Book Web Reader workflow.

## 12. Real-device GOLD

Automation is the baseline, not the final visual truth.

Real iPhone review is required for changes involving:

- safe area
- browser chrome overlap
- sticky header behavior
- Korean font rendering
- form keyboard / focus
- long legal text
- book reading controls

2026-09-21 real-device status:

- Contact: PASS
- Privacy: PASS
- shared mobile header: PASS
- no visible horizontal overflow
- V1.2 density refinements applied after review

## 13. Engineering architecture

Preferred order:

1. global foundation tokens
2. shared component tokens
3. page-family stylesheet
4. mobile shared overrides
5. page-specific exception only when documented

Avoid:

- duplicate mobile navigation implementations
- emergency one-off media queries
- inline magic numbers when a reusable token exists
- redesigns that break canonical URLs, structured data, RSS, sitemap, or analytics

## 14. Change policy

A new UI rule should be introduced only when:

1. an existing component cannot solve the need,
2. the rule improves reading or decision-making,
3. it is reusable across at least two contexts,
4. it works at 390px,
5. accessibility remains intact.

If a core token, shell behavior, or GOLD contract changes, update this document in the same PR.

## 15. Definition of Done

A design-system change is complete when:

- implementation is merged
- Astro build passes
- relevant visual/GOLD QA passes
- reader QA passes when affected
- production smoke test passes
- Cloudflare deployment succeeds
- real-device review is completed when required

From V3 onward, new JoyLab pages are extensions of one system, not isolated redesigns.

# JOYLAB Mobile Design System V1

> Status: Active · V1.2  
> Scope: aijoylab.kr mobile web, 640px and below  
> Source of truth: `src/styles/mobile-ui-v1.css`  
> GOLD QA: `scripts/qa-mobile-ui-v1.mjs`

## 1. Purpose

JoyLab Mobile Design System V1 defines the shared mobile shell and spacing rules used across Books, About, Guide, Research Article, Contact, and Privacy pages.

The goal is not to make every page visually identical. Each page family keeps its own editorial identity, while the mobile experience shares the same navigation, type scale, horizontal shell, section rhythm, touch-target rules, and QA contract.

## 2. Breakpoint

The V1 mobile contract applies at:

```css
@media (max-width: 640px)
```

Desktop and tablet layouts remain page-specific unless a component explicitly opts into a shared rule.

## 3. Core tokens

Defined in `src/styles/mobile-ui-v1.css`:

```css
--m-shell-x: 18px;
--m-section-y: 44px;
--m-gap: 16px;
--m-radius: 18px;
--m-title: clamp(2rem, 10vw, 3rem);
--m-section-title: clamp(1.7rem, 8.6vw, 2.35rem);
--m-body: 1rem;
```

### Meaning

- `--m-shell-x`: default left/right content inset.
- `--m-section-y`: default vertical section rhythm.
- `--m-gap`: default compact component gap.
- `--m-radius`: standard mobile card radius.
- `--m-title`: primary page title scale.
- `--m-section-title`: section heading scale.
- `--m-body`: default mobile body size.

Do not introduce page-local values that duplicate these tokens unless the page has a documented exception.

## 4. Mobile shell

All core pages use the same header behavior:

- white sticky header
- JoyLab brand on the left
- 44 × 44px hamburger target on the right
- fullscreen white navigation below the 68px header
- body scroll lock while the menu is open
- Escape closes the menu
- iOS momentum scrolling inside the menu
- mobile-only `오늘의 리서치 보기 →` CTA

The shell is implemented in `BaseLayout.astro` and normalized in `mobile-ui-v1.css`.

## 5. Active navigation

The current top-level section is marked with:

```html
aria-current="page"
```

and receives the shared active visual state.

Mapping rules:

- semiconductor / AI power / shipbuilding / US rates → 투자·경제
- AI productivity / AI economics / AI infrastructure / AI security → AI·생산성
- growth leadership → 성장·리더십
- article pages → Research
- books → Books
- about → About
- contact → Contact
- privacy has no top-level navigation item, so no active state is expected

Active state is not decorative only. `aria-current` is part of the accessibility contract.

## 6. Typography

### Page title

Use the shared primary title token unless a page family has a documented editorial exception.

Target:

- line-height: approximately 1.08–1.14
- Korean: `word-break: keep-all`
- avoid arbitrary `overflow-wrap:anywhere` on primary Korean headings

### Section title

Use `--m-section-title` for major section headings where possible.

### Body

Default mobile body rhythm:

- size: approximately 16px
- line-height: approximately 1.7–1.8
- Korean text should prioritize readable phrase wrapping

Form controls must render at 16px or larger to prevent iOS Safari zoom-on-focus.

## 7. Page-family rules

### Books

- one-column mobile cards
- covers use `object-fit: contain`
- cover art must never be cropped for layout convenience
- CTA stack is vertical on mobile

### About

- compact hero
- one-column systems/cards
- shared title and section rhythm

### Guide family

- shared shell width
- shared hero title scale
- shared section heading rhythm
- cards keep their category-specific visual language

### Research Article

- shared white mobile header overrides legacy dark mobile header rules
- editorial cover remains dark
- article shell uses shared mobile width
- tables may scroll horizontally when needed

### Contact

- single-column contact grid
- sticky desktop aside becomes static
- form controls use 16px minimum font size
- action buttons stack vertically
- large form areas follow shared card radius and spacing

### Privacy / Info

- readable single-column shell
- shared title scale
- section headings use a reduced mobile legal/information scale
- paragraphs keep generous line height
- no active top-level nav item is required for Privacy

## 8. Touch and accessibility contract

- hamburger target: at least 44 × 44px
- active navigation target: at least 44px high
- form actions: at least 48–50px high
- visible focus states must remain intact
- current location uses `aria-current="page"`
- mobile research CTA has an explicit accessible label
- menu must not trap page scroll after closing

## 9. GOLD QA contract

`scripts/qa-mobile-ui-v1.mjs` runs at 390 × 844 and checks:

1. HTTP success
2. no horizontal overflow
3. visible hamburger
4. fullscreen menu opens
5. body scroll locks
6. correct active navigation state, or intentionally none
7. Today Research CTA is visible
8. active target is at least 44px
9. Escape closes the menu and unlocks scrolling
10. screenshot artifact is captured

Current GOLD routes:

- `/books`
- `/about`
- `/guides/investing`
- `/guides/ai-productivity`
- `/guides/growth-leadership`
- one production Research Article
- `/contact`
- `/privacy`

A mobile UI change is not complete until this QA passes in CI.

## 10. Change rules

When adding a new mobile page or component:

1. reuse existing tokens first
2. keep desktop behavior unchanged unless the task explicitly includes desktop
3. add page-family overrides to `mobile-ui-v1.css`, not scattered emergency rules
4. add or update a GOLD QA route if the new page represents a new layout family
5. preserve accessibility semantics
6. avoid duplicate mobile navigation implementations
7. verify on a real iPhone when a visual change affects safe-area, browser chrome, keyboard, or form interaction

## 11. Real-device QA

Automated 390 × 844 QA is the baseline. Real-device screenshots remain the final visual check for:

- Safari and in-app browser safe-area behavior
- browser chrome overlap
- Korean font rendering
- keyboard/form focus behavior
- sticky header transitions
- tap comfort

## 12. Versioning

- V1.0: shared mobile shell, Books/About/Guide/Research normalization, active navigation, automated GOLD QA
- V1.1: Contact and Privacy added to the shared system and GOLD QA scope
- V1.2: Footer, Contact Form, and Books Reader component tokens added; Contact/Privacy spacing tuned from real iPhone screenshots

Future changes that alter core tokens, shell behavior, or QA contract should update this document in the same PR.


## 13. V1.2 component token layer

Mobile UI V1.2 adds reusable component-level tokens:

- `--m-touch`: default mobile action target
- `--m-footer-gap`, `--m-footer-link-h`: Footer rhythm and tap target
- `--m-form-gap`, `--m-form-control-h`, `--m-form-radius`: Contact/Form system
- `--m-reader-pad`, `--m-reader-radius`, `--m-reader-line`: Books Reader mobile rhythm

Component-local tokens may map to these global mobile tokens with fallbacks. This keeps page-family styles readable while preserving one mobile source of truth.

## 14. Real-device GOLD note — 2026-09-21

Verified on actual iPhone screenshots:

- Contact hero and cards: PASS
- Contact form width and 16px controls: PASS
- Privacy title, body width, and section wrapping: PASS
- Shared sticky header and hamburger: PASS
- No horizontal overflow observed

V1.2 reduced Contact vertical gaps and Privacy section spacing after this review.

# JoyLab Design System V2.0

Status: Gold
Last updated: 2026-09-10
Scope: Homepage / Pillar / Research Article

## 1. Purpose

JoyLab Design System V2.0 defines the visual and interaction rules for the JoyLab independent research media platform.

The system is designed to make every new page feel like the same product, regardless of topic.

Core principle:

> Good information is not enough. JoyLab turns information into a better decision.

Editorial method:

**Fact → Interpretation → Scenario → Action**

Brand flow:

**생각 → 분석 → 실행 → 성장**

The design must prioritize hierarchy, readability, research structure, and repeatability over decorative effects.

---

## 2. Design Principles

### 2.1 Premium Research Editorial

JoyLab is not a SaaS landing page and not a generic blog.

The desired impression is:

- independent research media
- premium editorial product
- structured decision framework
- technology and investment intelligence
- restrained, credible visual language

Avoid excessive rounded cards, gradients, floating shadows, decorative animations, and UI elements that make the site feel like a dashboard product.

### 2.2 Information hierarchy first

Every screen must answer these questions in order:

1. What is this page about?
2. Why does it matter?
3. What should I read next?
4. How does JoyLab interpret it?
5. What is the next decision or action?

### 2.3 One visual language across Home → Pillar → Article

The three Gold Screens establish the canonical hierarchy:

**Homepage → Pillar → Research Article**

New pages should reuse the same tokens, spacing, typography rhythm, section patterns, and editorial components before creating new patterns.

---

## 3. Design Tokens

### 3.1 Colors

Primary Navy

`#0B1F4D`

Deep Editorial Navy

`#071938`

Electric Blue

`#1677FF`

White

`#FFFFFF`

Soft Background

`#F5F8FC`

Border

`#DFE6F0`

Primary Text

`#15345D`

Muted Text

`#6D7D92`

Joy Yellow

`#FFD83D`

### Color rules

- Navy is the primary brand field.
- Blue is for interaction, hierarchy, links, and key research emphasis.
- Yellow is reserved for START HERE, ACTION, and one primary CTA per view.
- Yellow must never become a general decoration color.
- White and soft gray provide reading space.
- Shadows are secondary; borders and whitespace should do most of the structural work.

---

## 4. Typography

### 4.1 Desktop scale

Hero H1: 56–86px depending on page type

Section H2: 30–44px

Card H3: 18–22px

Body: 16–18px

Meta: 11–13px

Eyebrow: 10–12px, uppercase, high tracking

### 4.2 Mobile scale

Hero H1: 34–42px

Section H2: 24–30px

Card H3: 17–21px

Body: 14–16px

Meta: 11–12px

### Typography rules

- Korean headings use strong sans-serif weight.
- Hero headings should use `word-break: keep-all` where practical.
- Avoid headlines breaking into more than 4 lines on mobile.
- Body line-height should be 1.6–1.8.
- Reading article body width should remain approximately 760–780px.

---

## 5. Layout Tokens

Maximum editorial canvas:

`1180px`

Desktop gutter:

`24px`

Mobile gutter:

`12–16px`

Desktop section spacing:

`56–72px`

Mobile section spacing:

`36–48px`

Radius scale:

`8px / 12px / 16px`

Large legacy 20–26px radii should not be introduced into new V2 components unless there is a strong functional reason.

---

## 6. Core Components

### 6.1 Research Cover

Purpose: establish topic and authority before content begins.

Required elements:

- JoyLab eyebrow
- large research title
- short editorial description
- optional tags
- optional metadata or reading time

Visual rules:

- dark navy field
- restrained blue energy or signal background
- no decorative stock imagery required
- the text must remain the dominant element

### 6.2 FACT

Represents confirmed data, events, filings, prices, official announcements, or measured facts.

Visual meaning:

neutral / evidence / verified input

### 6.3 INTERPRETATION

Represents JoyLab’s analysis of what the facts mean.

Visual meaning:

analysis / connection / implication

### 6.4 SCENARIO

Represents conditional outcomes.

Preferred structure:

- Bull
- Base
- Bear

The component should state conditions, not make unsupported predictions.

### 6.5 ACTION

Represents the next condition, validation step, or decision rule.

Yellow is allowed here as the strongest visual accent.

### 6.6 Research Map

Purpose: convert a group of articles into a reading sequence.

Canonical example:

**HBM → Cycle → Flow → Samsung → SK hynix → Compare**

Desktop:

horizontal ordered map

Mobile:

horizontal scroll or compact sequential list

The map must communicate order, not just navigation.

### 6.7 Research Path

Purpose: long-form ordered article sequence inside a Pillar page.

Recommended anatomy:

- sequence number
- role label
- article title
- one-sentence reason to read
- tags
- read CTA

### 6.8 Research Brief

Used near the start of a Research Article.

Contains the article’s scope, method, and what the reader should expect to learn.

### 6.9 Key Takeaways

2–4 compact editorial blocks.

Each takeaway should be independently understandable and limited to one decision-relevant idea.

### 6.10 Related Research

Used near the end or in the side rail of an Article.

Must point readers toward the next logical question, not simply the latest article.

---

## 7. Homepage Rules

Gold Screen: `/`

Primary purpose:

Show what JoyLab is, what it is currently researching, and where the reader should enter the research system.

Canonical structure:

1. Brand Hero
2. Today Research Top 3
3. Three Pillars
4. Major Research
5. Start Here / Research Guide
6. Latest Research / Categories
7. Archive + Search + Filter

### Homepage Hero

Hero subject is JoyLab, not an individual stock.

Canonical message:

**생각을 분석하고, 분석을 실행으로.**

The Hero should explain the system before promoting a specific article.

Primary CTA limit:

one prominent yellow CTA.

### Today Research

Editorially ranked Top 3.

Do not treat this as simply “latest three articles” when editorial ranking metadata becomes available.

### Pillars

Current canonical pillars:

- 투자·경제
- AI·생산성
- 성장·리더십

Each Pillar must communicate a distinct purpose while maintaining the same visual system.

---

## 8. Pillar Page Rules

Gold Screen:

`/guides/semiconductor-investing`

Primary purpose:

Turn a topic cluster into a structured research journey.

Canonical structure:

1. Pillar Hero
2. 3 decision lenses or equivalent orientation layer
3. START HERE Research Map
4. Research Path
5. Topic Insights
6. JoyLab Method
7. contextual guidance rail on desktop

### Pillar Hero

A Pillar title should describe the perspective, not only the category name.

Example:

**반도체, 더 깊이 더 명확하게.**

### Research Map rule

A Pillar should not become a flat card archive.

The reader must understand:

- where to start
- why the order matters
- what each step contributes
- when to move to company-level analysis

### Pillar scalability

Future Pillars should use the same structure when possible:

- AI Power Guide
- FX Guide
- AI Productivity Guide
- Leadership / Operating System Guide

Do not create a separate visual grammar for each topic.

---

## 9. Research Article Rules

Gold Screen example:

`/articles/samsung-electronics-outlook`

Primary purpose:

Deliver one complete research argument with clear evidence, interpretation, scenarios, and next actions.

Canonical structure:

1. Research Cover
2. Research Brief
3. Key Takeaways
4. Main analysis
5. FACT / INTERPRETATION / SCENARIO / ACTION components where relevant
6. Scenario Matrix or comparison framework where relevant
7. Related Research
8. next logical reading path

### Article side rail

Desktop may include:

- Table of Contents
- Start Here / Pillar link
- Related Research

Side rail should support reading, not compete with the article.

### Article width

Main prose target width:

`760–780px`

Large data tables and matrices may temporarily exceed this when necessary.

---

## 10. Mobile Rules

Breakpoint reference:

`640px`

### Header

- single row
- JoyLab brand left
- hamburger right
- no multi-row navigation
- menu opens as a compact overlay/grid

### Hero

- reduce visual height aggressively
- headline should be visible without unnecessary decorative space
- first actionable content should appear quickly

### Research Map

Horizontal scroll is acceptable when order remains obvious.

Never shrink six steps into unreadable equal-width columns.

### Cards

On mobile:

- reduce padding
- use fewer decorative elements
- prioritize title and role
- description may be shortened or hidden in dense grids

### Article

- single column
- side rail moves below content or is reduced
- TOC may be collapsed or moved near the top
- 16px-ish reading text target

### Mobile density rule

The goal is not to reproduce desktop at a smaller scale.

Each mobile viewport should have one dominant information priority.

---

## 11. Gold Screens

The following screens define V2.0 and must be used as visual regression references.

### Gold 01 — Homepage V2

URL:

`/`

Reference traits:

- premium editorial hero
- Today Research Top 3
- three Pillars
- Start Here guide
- desktop and mobile responsive behavior

### Gold 02 — Semiconductor Pillar V2

URL:

`/guides/semiconductor-investing`

Reference traits:

- topic-specific research hero
- 3 decision lenses
- six-step Research Map
- Research Path
- topic insights
- mobile horizontal sequence

### Gold 03 — Research Article V2

URL:

`/articles/samsung-electronics-outlook`

Reference traits:

- Research Cover
- Brief
- Key Takeaways
- structured research body
- FACT → INTERPRETATION → SCENARIO → ACTION
- TOC / guide / related research rail

---

## 12. New Page Decision Rules

Before creating a new component, answer:

1. Can an existing V2 component solve this problem?
2. Does the new pattern improve reading or decision-making?
3. Is the pattern reusable across at least two future pages?
4. Does it preserve the Home → Pillar → Article visual hierarchy?
5. Does it work at 390px without special-case hacks?

If the answer is no, do not add a new component.

---

## 13. Expansion Templates

### AI Power Guide

Use Pillar template.

Potential map:

Generation → Grid → Transformer → Distribution → Cooling → Data Center

### FX Guide

Use Pillar template.

Potential map:

Dollar → Rates → Foreign Flow → Exporters → Valuation → Portfolio

### AI Productivity Pillar

Use Pillar template.

Potential map:

Model → Agent → Workflow → Governance → Measurement → Operating Model

All should retain the same JoyLab editorial hierarchy.

---

## 14. Implementation Rules

Preferred CSS architecture:

- shared global tokens only for truly shared foundations
- page-family stylesheet for major Gold Screen families
- avoid page-specific inline style accumulation
- do not change canonical URL structure for visual redesigns
- do not change article slugs for design reasons
- preserve Search Console, sitemap, RSS, and structured metadata when styling pages

Current V2 style families include:

- `homepage-v2.css`
- `research-v2.css`
- `semiconductor-guide-v2.css`

New Pillars should extend shared V2 concepts before copying and diverging entire stylesheets.

---

## 15. Gold Gate

A screen can be designated Gold only when all checks pass.

### Visual

- desktop hierarchy approved
- mobile hierarchy approved
- no obvious wrapping or overflow defects
- brand tokens respected
- yellow accent remains limited

### Functional

- navigation works
- internal links work
- article controls still work where applicable
- responsive behavior works

### SEO / Platform

- canonical preserved
- URLs preserved
- sitemap unaffected
- robots unaffected
- structured data unaffected where applicable

### Engineering

- production dependency audit passes
- Astro build passes
- deployment passes
- production smoke test passes

---

## 16. Definition of Done for V2.0

JoyLab Design System V2.0 is considered established when:

- Homepage V2 is Gold
- Semiconductor Pillar V2 is Gold
- Research Article V2 is Gold
- this document is present in the repository
- future page work references this document before implementation

From this point forward, new pages should be treated as extensions of the system, not isolated redesigns.

# JoyLab Visual Family Audit — 2026-10-07

Scope:
- Research Article
- Research Guide
- Books

Baseline:
- JoyLab Design System V3
- Anti-AI-Slop Contract V1
- current production content structure

## Executive verdict

JoyLab is not suffering from classic “purple-gradient AI SaaS” slop at the product level.
The main risk is **template repetition inside otherwise strong branded systems**.

Priority is therefore not a redesign.
It is to preserve each page family's own visual grammar while reducing repeated modules that feel generated.

---

## 1. Research Article

Representative route:
`/articles/semiconductor-giant-shoulder-flow`

### Strengths
- clear authored research identity
- single-topic H1 and explanatory lead
- dedicated hero / research-cover
- Fact → Interpretation → Scenario → Action is a real decision framework
- article architecture and Trust/Evidence layer differentiate the product from generic blogs
- visual research modules can carry real explanatory value

### Anti-Slop risks
1. **Research Brief boilerplate repetition**
   - useful as orientation
   - becomes generic when identical copy appears on every article

2. **Key Takeaways 01/02/03 repetition**
   - numbering is allowed when semantic
   - generic labels such as “핵심 변수 / 판단 순서 / 실행 기준” should not be auto-generated unchanged for every topic

3. **Visual Research duplication**
   - two visuals are valuable only when each answers a different question
   - generated “framework image + data image” should not become a mandatory pair

4. **Boxed-module density**
   - research cover, brief, takeaways, thesis, visual research, graph, framework can delay prose entry
   - article should still feel like research writing, not a dashboard assembled above an essay

### Action
- preserve Research Brief but require at least one topic-specific sentence
- require Key Takeaways labels to be topic-specific for new content
- no minimum count for Visual Research assets; use only when explanatory
- measure mobile body-entry position in family GOLD QA

### Priority
**P1**

---

## 2. Research Guide

Representative route:
`/guides/semiconductor-investing`

### Strengths
- the page is genuinely a research journey, so sequence numbers are semantic
- Research Graph is a distinctive JoyLab device
- JoyLab Method is explicit and connected to decision-making
- Start Here / Research Path / Deep Dive are different functions, not arbitrary feature cards

### Anti-Slop risks
1. **Module accumulation**
   - Hero stats
   - 3 overview axes
   - Start Here strip
   - Research Graph
   - 7-path cards
   - Deep Dive
   - Insights
   - Method
   - Start Here / How To Use / Decision Rule
   can produce “everything is a module” fatigue

2. **Guide-specific gradients**
   - each guide should not acquire a new gradient vocabulary merely to look unique

3. **Badge / mini-label proliferation**
   - DATA / TECH / DECISION etc. are useful only when they help scanning
   - avoid stacking multiple micro-label systems in one viewport

4. **Hover behavior**
   - navigation tiles do not need identical lift animation

### Action
- retain Research Graph as the primary signature
- treat supporting modules as editorial sections rather than equal visual cards
- keep one primary label vocabulary per section
- use color to encode domain/meaning, not to create a new skin per Guide

### Priority
**P2**

---

## 3. Books

Representative surfaces:
- `/books`
- individual Book Landing

### Strengths
- cover art provides authentic product identity
- Books is visibly separate from Research Article UI
- long-form editorial positioning is appropriate
- preview/read actions are real product actions, not decorative CTA buttons
- author/about/contents modules are semantically meaningful

### Anti-Slop risks
1. **Storefront-template drift**
   - repeating “About / Recommended For / Contents / Author / CTA” identically for every title can make the system feel generated

2. **Numbered audience cards**
   - 01/02/03/04 is useful only when the reader categories are genuinely different
   - avoid using numbers solely as layout decoration

3. **CTA duplication**
   - “무료 읽기 / 책 만나보기 / 전체 보기” should retain a clear primary/secondary hierarchy

4. **Promotional copy vs evidence**
   - Books should remain editorial and authored, not become a generic conversion landing page

### Action
- keep cover-led composition as the visual signature
- allow book-specific editorial sections rather than enforcing one universal landing template
- one primary CTA per viewport
- preserve reading-preview clarity and noindex rules for reader previews

### Priority
**P2**

---

## Cross-family policy

### Homepage
Signature: editorial research index

### Research Article
Signature: authored argument + evidence/trust + decision framework

### Guide
Signature: ordered research journey + Research Graph

### Books
Signature: cover-led long-form editorial product

These families should share brand tokens but must not share the same page grammar.

## Implementation order

1. Visual Quality Score baseline
2. Article body-entry / boilerplate audit
3. Guide module-density audit
4. Books CTA/template-variation audit
5. change only families that fall below 80 or show Critical findings

# JoyLab AI Power Pillar V1 Spec

Status: SPEC
Design system: JoyLab Design System V2.0
Target family: Pillar

## 1. Purpose

Build JoyLab's second strong investment research cluster after Semiconductor.

The page should not behave like a list of energy articles. It should teach readers how to trace AI electricity demand through the physical power stack and then connect that stack to listed-company investment logic.

Core editorial question:

> When AI demand grows, where does the power bottleneck move next and which layer captures the economic value?

## 2. Pillar Positioning

Working title:

**AI 전력 가이드｜GPU 다음 병목은 발전소다**

Hero message direction:

**AI의 다음 병목은 전력입니다.**

Supporting line:

GPU와 HBM만으로 AI 데이터센터는 작동하지 않습니다. 발전에서 송전·변압·배전·백업전원·냉각까지, 전력이 실제 데이터센터에 도달하는 전 과정을 하나의 투자 지도로 봅니다.

This Pillar must visually inherit Semiconductor Pillar V2 instead of inventing a new visual grammar.

## 3. Research Map

Use six ordered steps.

1. **Generation** — 발전
   - Gas turbine / combined-cycle
   - Nuclear / SMR as optional long-duration supply path
   - Question: 누가 전력을 실제로 만들어내는가?

2. **Grid** — 송전
   - High-voltage transmission
   - Interconnection and permitting
   - Question: 만들어진 전력을 데이터센터까지 보낼 수 있는가?

3. **Transformer** — 변압
   - Large power transformer / substation equipment
   - Question: 전압을 바꾸고 병목 없이 연결할 수 있는가?

4. **Distribution** — 배전
   - Switchgear / busway / distribution equipment
   - Question: 캠퍼스 내부에서 전력을 안전하게 나눌 수 있는가?

5. **Resilience** — BESS · UPS · BBU
   - Backup and ride-through architecture
   - Question: 순간 정전과 부하 변동을 어떻게 흡수하는가?

6. **Cooling & Data Center** — 냉각 · AIDC
   - Cooling, facility power density, data-center integration
   - Question: 최종적으로 전력을 컴퓨팅 성능으로 전환할 수 있는가?

Canonical map label:

`Generation → Grid → Transformer → Distribution → Resilience → Cooling / Data Center`

## 4. Three Decision Lenses

Reuse the 3-lens pattern from Semiconductor Pillar V2.

### 01 POWER SUPPLY

**전력 공급 능력**

발전 용량, 연료, 전력계통 접속, 프로젝트 일정으로 실제 공급 가능성을 봅니다.

### 02 BOTTLENECK

**병목의 이동**

발전소가 있어도 송전망·변압기·배전 설비·냉각이 부족하면 AI 데이터센터는 가동되지 않습니다.

### 03 INVESTMENT TRANSMISSION

**투자 수혜 연결**

수주잔고, CAPEX, 공급 부족, 가격 결정력, 고객 집중도와 밸류에이션을 연결합니다.

## 5. JoyLab Investment Chain

Research should connect physical infrastructure to investable layers without turning the page into a buy/sell recommendation.

Reference chain for Korean-equity analysis:

- Generation: 두산에너빌리티
- Grid / transformer: 효성중공업, HD현대일렉트릭
- Distribution: LS ELECTRIC
- Resilience: BESS / UPS / BBU ecosystem
- Data center / cooling: follow-up research cluster

Company names are examples for the research taxonomy, not automatic recommendations.

## 6. Initial Content Cluster

Do not publish the public Pillar until enough real content exists to avoid a hollow guide page.

Minimum launch threshold: **3 published articles**.
Preferred Gold threshold: **6 published articles mapped one-to-one to the six steps**.

Proposed first six Gold Cases:

### GC-01
**GPU 다음 병목은 발전소다｜AI 데이터센터 전력 수요가 바꾸는 투자 지도**

Role: Generation / cluster hub

### GC-02
**AI 전력기기 투자 가이드｜송전·변압·배전에서 병목을 찾는 법**

Role: Grid + Transformer + Distribution

### GC-03
**BESS·UPS·BBU 차이｜AI 데이터센터가 정전에 대비하는 3중 안전망**

Role: Resilience

### GC-04
**가스터빈이 다시 중요해진 이유｜AI 데이터센터와 복합화력 발전의 귀환**

Role: Generation deep dive

### GC-05
**AI 데이터센터 냉각이 전력 투자의 마지막 병목인 이유**

Role: Cooling

### GC-06
**AI 전력 밸류체인 비교｜발전→송전→변압→배전→백업→냉각**

Role: Compare / final synthesis

## 7. Information Architecture

Target URL once launch-ready:

`/guides/ai-power`

Page order:

1. V2 dark site header
2. Topic-specific Research Hero
3. Three Decision Lenses
4. START HERE six-step Research Map
5. Research Path
6. AI Power Insights
7. JoyLab Method
8. Related research / next cluster links

Do not add a separate visual language.

## 8. AI Power Insights

Three reusable insight blocks:

### SUPPLY

**전력은 만들어져야 합니다**

AI 수요가 늘어도 발전 프로젝트가 늦어지면 데이터센터 증설 일정도 밀립니다.

### FLOW

**전력은 이동해야 합니다**

송전망, 변전소, 변압기, 배전 설비가 부족하면 발전 용량이 있어도 데이터센터까지 전달되지 않습니다.

### STABILITY

**전력은 끊기면 안 됩니다**

BESS·UPS·BBU와 냉각 시스템은 AI 연산의 연속성과 데이터센터 가동률을 결정합니다.

## 9. V2 Component Reuse

Required reuse from JoyLab Design System V2.0:

- dark editorial header
- topic Research Hero
- 3 Decision Lenses
- six-step Research Map
- ordered Research Path
- topic Insights
- JoyLab Method
- mobile hamburger navigation
- mobile horizontal Research Map

No new major component is allowed unless the New Page Decision Rules in `JOYLAB_DESIGN_SYSTEM_V2.0.md` are satisfied.

## 10. Visual Tokens

Inherit existing V2 tokens.

- Deep Navy: `#0B1F4D` family
- Electric Blue: `#1677FF`
- White
- Soft Gray
- Joy Yellow: START HERE / ACTION / single priority CTA only

AI Power may use energy-line motifs, but these must remain subtle background signals rather than decorative illustrations.

## 11. Mobile Rules

At 390px:

- one dominant priority per viewport
- title must not consume more than roughly half of the visible content area
- Decision Lenses stack vertically
- Research Map scrolls horizontally
- each step remains readable without shrinking text excessively
- Research Path becomes one-column timeline
- insight cards stack vertically
- no duplicated CTA above the fold

## 12. SEO Rules

Do not create the public guide URL until launch threshold is met unless explicitly testing in a non-indexed preview environment.

When published:

- preserve canonical URL permanently
- add guide URL to normal sitemap through existing route generation where applicable
- internal links must be bidirectional: Pillar → Article and Article → Pillar
- use descriptive anchors, not generic `더 보기`
- no placeholder article URLs

## 13. Content Gate Before Public Launch

PASS only when:

- at least 3 real AI Power articles are published
- every visible map node has either a real article or is explicitly presented as a non-clickable future step
- no broken internal links
- hero and research path make sense even to a reader who does not know energy infrastructure
- investment references separate fact, interpretation, scenario, and action

## 14. Gold Gate

The Pillar becomes Gold only after:

### Visual

- desktop 1440px reviewed
- mobile 390px reviewed
- Home → Pillar → Article hierarchy preserved
- no overflow / bad wrapping
- Joy Yellow remains constrained

### Functional

- all map links valid
- all article links valid
- mobile menu works
- horizontal map scroll works

### SEO

- canonical stable
- sitemap healthy
- Search Console inspection valid after publication
- internal links bidirectional

### Engineering

- production dependency audit passes
- Astro build passes
- Cloudflare deploy passes
- Production smoke test passes

## 15. Recommended Execution Order

1. Lock this spec.
2. Produce GC-01 to GC-03 first.
3. When three articles are production-ready, build `/guides/ai-power` using Semiconductor Pillar V2 as the reference implementation.
4. Perform PC 1440px + Mobile 390px screenshot QA.
5. Expand to GC-04 to GC-06.
6. Re-run Gold Gate and designate AI Power Pillar Gold.

## 16. Definition of Done

AI Power Pillar V1 is ready for implementation when:

- this spec is approved
- the first three article slugs are fixed
- V2 Design System reuse is confirmed
- no placeholder public links are required

The principle is simple:

**AI 전력 가이드는 전력 산업을 설명하는 페이지가 아니라, AI 수요가 발전에서 데이터센터까지 어떻게 전달되고 어디에서 병목과 투자 기회가 발생하는지를 읽는 JoyLab Research Map이어야 한다.**

# JoyLab Visual Replacement Sprint v1

## Goal
Replace shared default Heroes in the order that changes the visible site experience fastest, while preserving semantic placement and CI safety.

## Sequence

### Sprint 0 — P0 Home Heroes
1. `money-basics-7-economic-terms`
2. `openai-data-agent-chatgpt-work`

Done when:
- each article has a dedicated Hero
- homepage card resolves the same Hero
- mobile crop remains readable
- Research Image Gate PASS
- Visual Audit changes P0 verdict from REPLACE to GOOD/REPOSITION

### Sprint 1 — AI · Productivity
- `ai-agent-governance`
- `ai-productivity-operating-model`
- `ai-productivity-platforms-compare`
- `ai-productivity-roi`
- `ai-workflow-automation`
- `what-is-ai-agent`

Art direction: Agent / Workflow / Data / Human Approval / ROI. Avoid generic robot imagery; prefer system diagrams, interface-light editorial scenes, and clear one-concept composition.

### Sprint 2 — Shipbuilding
- `hanwha-ocean-shipbuilding`
- `hd-ksoe-shipbuilding`
- `korea-shipbuilding-companies-compare`
- `samsung-heavy-industries-shipbuilding`
- `hd-hyundai-heavy-industries-shipbuilding`

Art direction: LNG carriers, naval/special vessels, engines, orderbook/yard capacity. Comparison Hero should show four distinct strategic positions rather than four logos.

### Sprint 3 — Growth · Leadership
- `fairness-system-explainable-standards`
- `feedback-system-behavior-change`
- `growth-leadership-operating-system`
- `learning-system-reexecution-loop`
- `performance-system-leading-indicators`
- `recognition-system-fair-performance`

Art direction: operating system / feedback loops / team decision systems. Avoid stock-photo office scenes; use premium editorial system maps with human context only when it adds meaning.

### Sprint 4 — Semiconductor Compare + Market Flow
- `samsung-vs-sk-hynix-ai-memory`
- `foreign-investor-flow`

Art direction: AI memory stack / company positioning / foreign-flow transmission. Keep company comparison factual and non-promotional.

## Hero Standard
- 16:9
- subject recognizable at card size
- text minimal; article title remains HTML, not baked into the image
- JoyLab palette: Deep Navy #0B1F4D, Electric Blue #1677FF, White; restrained warm accent allowed
- safe center crop for mobile
- no decorative data that could be mistaken for current factual data

## Production Rule
Generate in small batches by Pillar. After each batch:
1. update curated image map
2. run Research Image Gate
3. run Visual Audit Runtime
4. verify homepage/card/mobile crop
5. merge only after Build green
6. verify Cloudflare deploy + Production Smoke

## Stop Condition
Do not generate the next Pillar batch if the previous batch introduces repeated composition, unreadable thumbnail detail, or semantic placement regressions.
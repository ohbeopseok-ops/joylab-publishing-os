# RESEARCH GRAPH CONTRACT V1

Status: Active
Version: 1.3.0
Scope: investing / ai / leadership

## Source of Truth
- schema: config/research-graph-v1.schema.json
- platform registry: config/research-graph-platform-v1.json
- shared map: src/components/ResearchGraphMap.astro
- shared article nav: src/components/ResearchGraphNav.astro
- gate: scripts/check-research-graph-platform-v1.mjs

## Domains
- investing: macro → value_chain → company → kpi → valuation
- ai: language → measurement → standard → governance → discourse_power
- leadership: behavior → leader → team → culture → outcome

## Required graph data
contract, version, pillar, nodes, edges, articles.
Optional lanes define domain-specific visual columns. When lanes are absent, the legacy investment layout is preserved.

## Published article rules
A published graph article must exist as src/data/articles/<id>.md, have a same-id article node, a belongs_to edge to its pillar, topics with matching covered_by edges, and consistent previous/next ordering.

## Cross-domain edge vocabulary
defines, quantifies, enables, standardizes, governs, shapes, validates, informs, maps_to, aligns_with.
Legacy investing edges remain valid.

## Platform state
Active: ai-power, semiconductor, financials, shipbuilding, ai-standards.
Active: ai-power, semiconductor, financials, shipbuilding, ai-standards, growth-leadership.

## Gate
Run npm run research-graph:platform:check.
Normal JoyLab build, release and Production Smoke gates still apply.

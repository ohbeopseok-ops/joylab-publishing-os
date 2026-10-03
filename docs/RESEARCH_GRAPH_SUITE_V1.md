# Research Graph Suite V1

Status: SHADOW CONSOLIDATION

## Purpose

Consolidate five overlapping Research Graph workflows into one runner:

1. Research Graph Compact Mode V1
2. Research Graph Component V1
3. Research Graph Gate V1
4. Research Graph Platform V1
5. Research Graph Responsive GOLD

## Execution model

Routine PR/push:

`checkout → setup-node → npm ci → compact → component → core → platform → build`

Manual Responsive GOLD:

`same static suite + same build → install Playwright → preview → responsive GOLD`

Responsive GOLD is intentionally not automatic in Free-Tier mode.

## Why this saves minutes

The legacy workflows repeat dependency installation and production builds.
The suite pays those costs once.

Static contracts remain hard-fail. No contract is converted to
`continue-on-error`.

## Promotion gate

Do not disable legacy workflows until:

- the suite YAML is accepted by GitHub Actions;
- one relevant PR/push proves all four static contracts execute;
- one manual run with `run_responsive_gold=true` proves browser GOLD;
- path-filter coverage is equivalent to the union of the legacy workflows;
- Release Gate remains unaffected.

After equivalence:

1. move the five legacy workflows to manual-only;
2. observe one Research Graph repair/release cycle;
3. delete redundant workflow files only after stable evidence.

## Free-tier rule

Responsive GOLD is a deliberate certification step, not routine PR telemetry.

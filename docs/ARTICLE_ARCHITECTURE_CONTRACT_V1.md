# JoyLab Article Architecture Contract V1

## Purpose

Replace one repeated article template with a stable trust layer plus one of five content architectures.

Common Trust Layer + 1 of 5 Content Architectures

## Content types

- `investment-analysis`
- `concept-explainer`
- `comparison`
- `industry-trend`
- `practical-playbook`

## Common Trust Layer

Every production article should progressively satisfy author identity, research/data date, methodology, primary sources, original JoyLab value, counter evidence or limitations, conclusion, and update history when time-sensitive.

Investment articles require stricter treatment: data date and counter evidence are mandatory before future enforcement is enabled.

## Migration actions

- `KEEP`: preserve body; normalize trust metadata
- `ENHANCE`: preserve core body; strengthen evidence, dates, original analysis, or counter-case
- `REWRITE`: keep topic but rebuild architecture
- `MERGE`: consolidate overlapping search intent under one canonical article
- `ARCHIVE`: insufficient independent value; human approval required

## Rollout policy

- V1 is report-only for the legacy corpus.
- Missing new metadata does not break the current Astro build.
- New metadata fields remain optional during migration.
- Delete, archive, redirect, canonical merge, and investment conclusions require human review.
- Hard enforcement begins only after the legacy corpus is classified.

## Commands

`npm run content-architecture:audit`

`npm run content-architecture:self-test`

Audit outputs:

- `artifacts/content-architecture-audit.json`
- `artifacts/content-architecture-audit.md`

## Future release states

- `PASS`
- `PASS_WITH_WARNING`
- `REVIEW`
- `BLOCK`

Do not enable hard blocking until the legacy corpus has been classified and enforcement is explicitly approved.

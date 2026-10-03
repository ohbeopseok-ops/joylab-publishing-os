# Content Contract Suite V1

Status: SHADOW CONSOLIDATION

## Purpose

Consolidate eight overlapping content-quality workflows into one runner so a
single PR does not repeatedly pay for checkout, Node setup, dependency
installation, and artifact upload.

The suite currently covers:

1. Article Hero Gate
2. Research Image Quality Gate
3. Content Date Contract
4. Content Identity Contract
5. Home Content Slot Contract
6. Internal Link Gate
7. Investment Taxonomy
8. Topic Cluster CI

## Execution model

One runner:

`checkout → setup-node → npm ci → materialize images → contracts → one evidence upload`

This is intentionally a shadow migration.

The eight legacy workflows remain unchanged until this suite has produced
equivalent PASS/FAIL behavior on real changes.

## Promotion gate

Do not disable legacy automatic triggers until all conditions hold:

- suite YAML is accepted by GitHub Actions;
- at least one relevant PR run completes successfully;
- each legacy command is observed running in the suite;
- no legacy hard failure is lost or converted into continue-on-error;
- artifact/evidence paths needed for diagnosis remain available;
- path filters cover the union of legacy triggers;
- Release Gate remains unaffected.

After promotion:
- legacy workflows become manual-only first;
- observe one repair/release cycle;
- only then delete redundant workflow files.

## Free-tier effect

Before consolidation, a single content PR can wake several independent runners.
After promotion, the target is one content-contract runner per qualifying PR
and main push.

No release or production deployment gate is removed by this suite.

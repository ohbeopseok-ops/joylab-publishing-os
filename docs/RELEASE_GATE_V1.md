# JoyLab Release Gate V1

JoyLab Release Gate V1 is the final production authority for the word **GOLD**.

`docs/GOLD_BASELINE_V1.md` defines the durable minimum production/security floor.
This document evaluates whether a specific release satisfies that floor and all required release checks.

A merge or successful build alone is not a GOLD release.

## Required production checks

Every required check must report `success`:

1. Astro production build
2. Cloudflare deploy
3. Custom domain reachability
4. Production Smoke
5. Studio Production Smoke V1
6. Production Reader GOLD QA
7. Production Mindmap GOLD QA

If any required check is failed, cancelled, skipped, or unknown, the release status is `BLOCKED`.

## Output

The deploy workflow writes:

`qa-artifacts/release-gate/release-gate.json`

A valid GOLD record contains:

- `gate: "JoyLab Release Gate V1"`
- `status: "GOLD"`
- deployed commit SHA
- GitHub Actions run ID and attempt
- every required check result

The workflow uploads this file as the `joylab-release-gate-v1` artifact for 90 days.

## GOLD rule

```
BUILD GREEN
→ ASSET INTEGRITY GREEN
→ ASSET CONTRACT V3 GREEN
→ LEGACY CLEANUP GREEN
→ VISUAL QA GREEN
→ CLOUDFLARE DEPLOY GREEN
→ PRODUCTION SMOKE GREEN
→ STUDIO PRODUCTION SMOKE GREEN
→ PRODUCTION READER QA GREEN
→ PRODUCTION MINDMAP QA GREEN
→ RELEASE GATE V1
→ GOLD
```

Production Smoke GREEN and Studio Production Smoke GREEN are mandatory. A failed production smoke check can never be described as GOLD.

## Asset Contract V3

Asset Contract V3 covers every published Article and Book detail page.

### Articles

The contract verifies:

- declared Hero path
- rendered high-priority Hero image
- declared OG path
- rendered `og:image`
- referenced local assets exist in `dist`

Hero and OG may be the same asset or intentionally separate assets, but each rendered role must match its declared role.

### Books

Book Cover and OG are treated as separate roles because a portrait cover and a social-share OG image normally use different aspect ratios.

The contract verifies both roles independently.

## Legacy Asset Cleanup Gate

Retired production asset paths are registered in `config/legacy-assets.json`.

The gate blocks Build when a retired asset:

- still exists under its retired repository path, or
- is referenced by active source, workflow, script, or configuration code outside approved historical registries.

Historical Git commits are not scanned.

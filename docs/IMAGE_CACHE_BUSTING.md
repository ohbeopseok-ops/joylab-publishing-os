# IMAGE_CACHE_BUSTING

JoyLab static image deployment standard for immutable Hero and OG assets.

## Purpose

Use a new filename when a production image is corrupted, stale at the CDN/browser edge, or must be replaced without overwriting an existing public URL.

## Core rule

**Never overwrite a previously deployed public image path when cache state is in doubt.**

Use a monotonically new immutable filename instead:

```
ep01-<slug>-v2.webp
ep02-<slug>-v2.webp
ep03-<slug>-v7.webp
```

A filename that appeared in any previous production deployment is **not** considered new, even if the file is currently absent from `main`.

## Required update surface

When changing a Literature Hero/OG asset, update all of the following in the same PR:

1. Materialized or committed asset path under `public/images/...`
2. Page metadata / `BaseLayout image`
3. JSON-LD `Article.image`
4. CSS Hero background
5. GOLD QA expected Hero filename
6. Production smoke expected HTML reference
7. Production smoke direct asset URL and downloaded temp filename

## Asset integrity gate

Before the new path can be treated as GOLD:

- HTTP status: 200
- format: WebP
- dimensions: 1200×675 for Literature Hero/OG
- full Sharp decode succeeds
- minimum non-empty file-size guard passes
- page HTML references the exact new immutable path

For reconstructed assets, also verify deterministic byte length and SHA-256 before writing the public file.

## Deployment gate

```
NEW IMMUTABLE PATH
  → MATERIALIZE/WRITE
  → HERO + OG + JSON-LD + CSS
  → LOCAL/GOLD QA
  → npm run build
  → CLOUDFLARE DEPLOY
  → PRODUCTION PAGE 200
  → DIRECT ASSET 200
  → SHARP FULL DECODE
  → OLD ACTIVE REFERENCE 0
  → GOLD
```

## Old-path rule

Do not delete the immediately previous verified asset in the same change unless there is a security or legal reason. Keep it as rollback material until the new Production Smoke Gate is GREEN.

“Old active reference 0” means application code, metadata, CSS, QA expectations and deploy smoke no longer point at the superseded path. Historical docs, merged PR diffs and Git history are excluded.

## EP01–EP03 application

- EP01 and EP02 keep their current verified paths until replacement is required.
- EP03 cache-bust path for this rollout: `/images/leadership/literature/ep03-demian-v7.webp`.
- `ep03-demian-v2.webp` and `ep03-demian-v6.webp` are not valid fresh cache-bust paths because those filenames were deployed previously.


## CI enforcement

`Build` is the repository's required merge check. The Build workflow runs `scripts/check-asset-integrity.mjs` after Astro build, so a corrupt or missing referenced raster asset fails the required Build check and blocks merge.

The gate performs:
- full Sharp decode for active raster assets referenced by current source/manifest files
- width/height metadata validation
- source-reference existence checks for `/images/...` paths
- 16:9 enforcement for Literature Hero/OG raster assets


## Asset Contract V3

After Astro build, `scripts/check-asset-contract-v3.mjs` validates every published Article and Book detail page. It compares each page's declared Hero/Cover and OG roles with the actually rendered high-priority image and `og:image`, then verifies local assets exist in `dist`.

Articles and Books use one common contract, while Books may intentionally use a portrait Cover and a separate social OG image.

## PR checklist

- [ ] Filename has never been used in a prior production rollout
- [ ] Hero metadata updated
- [ ] OG/Twitter metadata updated through BaseLayout
- [ ] JSON-LD image updated
- [ ] CSS background updated
- [ ] GOLD QA updated
- [ ] Production smoke updated
- [ ] Build GREEN
- [ ] Direct production asset decodes at expected dimensions
- [ ] Superseded active path search returns 0
- [ ] Production Gate marked GOLD


## Reader binary immutable assets

Reader Pack payloads such as `.bin` files follow the same immutable-path rule as Hero/OG images.

- Never overwrite a binary path that has been served in Production.
- Use a new versioned filename for each payload revision, for example `interactive-v2.bin` → `interactive-v3.bin`.
- Keep retired filenames in `config/reader-binary-assets.json`.
- An active reader/mindmap payload must match `-vN.bin`.
- If a registered source HTML changes without bumping the active binary filename, `Reader Binary Immutable Asset Gate` fails CI.
- Production Smoke must download and strict-decode the currently active binary path.

## Legacy Asset Cleanup Gate

Retired paths are registered in `config/legacy-assets.json`. `scripts/check-legacy-asset-cleanup.mjs` blocks Build if a retired file still exists or is referenced by active code. Historical registry/document references are exempt.

## Release authority

A successful Build is necessary but not sufficient for GOLD. `docs/RELEASE_GATE_V1.md` defines the final production authority: Production Smoke and Production Reader QA must both be GREEN before a release can be marked GOLD.

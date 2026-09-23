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
ep03-<slug>-v6.webp
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
- EP03 cache-bust path for this rollout: `/images/leadership/literature/ep03-demian-v6.webp`.
- `ep03-demian-v2.webp` is not a valid fresh cache-bust path because that filename was deployed previously.


## CI enforcement

`Build` is the repository's required merge check. The Build workflow runs `scripts/check-asset-integrity.mjs` after Astro build, so a corrupt or missing referenced raster asset fails the required Build check and blocks merge.

The gate performs:
- full Sharp decode for active raster assets referenced by current source/manifest files
- width/height metadata validation
- source-reference existence checks for `/images/...` paths
- 16:9 enforcement for Literature Hero/OG raster assets

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

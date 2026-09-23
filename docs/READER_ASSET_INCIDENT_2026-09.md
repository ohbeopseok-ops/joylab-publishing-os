# READER_ASSET_INCIDENT_2026-09

## Summary

In September 2026, the Weight of Silence web reader opened its loader page successfully but failed before rendering the book body. Users saw the JoyLab Books fallback message: "콘텐츠를 불러오지 못했습니다. 새로고침해 주세요."

The incident was not caused by the book detail CTA or the reader shell. The active binary payload path had previously served a corrupted gzip file, and the same public filename was reused. Production could therefore continue returning the stale corrupted object even after a healthy payload had been rebuilt.

## User impact

- Book detail page: available
- Reader loader page: HTTP 200
- Book body: unavailable
- Mindmap: exposed to the same binary-asset risk
- Existing smoke checks initially proved only that the shell URL responded, not that the binary payload decoded and rendered

## Root cause

The Reader Pack used this runtime chain:

```text
interactive.html
  -> fetch(interactive.bin)
  -> browser DecompressionStream(gzip)
  -> document.write(book HTML)
```

A damaged `interactive.bin` had already been served in Production. Rebuilding and deploying valid bytes to the same URL was insufficient because the URL itself remained a previously used cache key.

The decisive evidence was:

1. source HTML was restored and valid;
2. build-time gzip generation passed a strict gzip round-trip;
3. the newly generated local payload decoded correctly;
4. Production download from the old public path still failed strict gunzip with `Z_DATA_ERROR: invalid distance too far back`;
5. changing to a never-used path fixed Production immediately.

## Resolution

The active payloads were moved to immutable paths:

```text
interactive.bin     -> retired
interactive-v2.bin  -> first healthy immutable Production path
interactive-v3.bin  -> Reader Pack V2 completion-loop revision

mindmap.bin          -> retired
mindmap-v2.bin       -> active
```

The loader, materializer, registry, smoke tests and Production QA all reference the active version explicitly.

## Permanent controls

### 1. Reader Binary Immutable Asset Gate

`config/reader-binary-assets.json` is the source of truth for active and retired payload paths.

Rules:

- active payloads must match `-vN.bin`;
- a retired payload cannot become active again;
- loader path and materializer output must match the registry;
- when a registered source HTML changes, the corresponding active binary filename must be bumped;
- Reader and Mindmap source files are versioned independently.

### 2. Strict binary smoke test

Production deployment downloads the active payload and performs a strict gzip decode. A shell-level HTTP 200 is not enough.

The decoded HTML must also contain required content markers.

### 3. Real-browser GOLD QA

After Cloudflare deployment, Playwright opens the real Production URLs.

Reader checks:

- body render;
- 1440px desktop and 390px mobile;
- horizontal overflow;
- TOC;
- settings;
- font size and font family;
- previous/next chapter;
- reading progress;
- Reader Pack V2 completion CTA.

Mindmap checks:

- rendered Markmap nodes;
- 1440px desktop and 390px mobile;
- horizontal overflow;
- zoom in/out and fit controls;
- sidebar open/close;
- Concepts / Outline / Journey tabs;
- desktop concept search;
- browser runtime errors.

### 4. Reader Pack completion loop

The final Reader chapter links to:

1. interactive mindmap;
2. three related research articles;
3. JoyLab Books hub.

This prevents the Reader from becoming a dead-end page and makes Reader Pack V2 a closed content loop.

## Release SOP

For any Reader or Mindmap source revision:

1. edit the source HTML;
2. allocate a new, never-used `-vN.bin` filename for that payload;
3. update `config/reader-binary-assets.json`;
4. update the loader path;
5. update materializer output;
6. update Production Smoke path;
7. run Build;
8. pass Reader Binary Immutable Asset Gate;
9. pass local 1440/390 GOLD QA;
10. deploy to Cloudflare;
11. strict-gunzip the Production binary;
12. run Production Playwright GOLD QA;
13. merge/close only after every gate is GREEN.

## Do not do

- Do not overwrite a binary filename that has already been served in Production.
- Do not treat `HTTP 200` on the loader as proof that the book works.
- Do not purge cache as the primary release strategy.
- Do not remove retired paths from the registry merely to make CI pass.
- Do not change source HTML without bumping its registered immutable payload version.

## GOLD definition

A Reader Pack release is GOLD only when all of the following are true:

```text
SOURCE CONTRACT
  -> IMMUTABLE PATH
  -> BUILD
  -> BINARY GATE
  -> LOCAL 1440/390 QA
  -> CLOUDFLARE DEPLOY
  -> PRODUCTION STRICT GZIP
  -> PRODUCTION 1440/390 QA
  -> GOLD
```

## Incident status

Closed with permanent controls in place.

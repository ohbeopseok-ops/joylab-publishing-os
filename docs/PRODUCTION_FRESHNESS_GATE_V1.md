# Production Freshness Gate V1

JoyLab distinguishes three freshness layers after release.

1. **Origin** — the `dist` build artifact produced from the deployment commit. This is the release source of truth.
2. **CDN** — the live `aijoylab.kr` response fetched with cache-busting and no-cache request headers.
3. **Search Cache** — Google Search Console URL Inspection crawl/index state.

Release verdict:
- Origin marker mismatch: FAIL.
- CDN marker/status mismatch: FAIL.
- Search Cache stale/pending: does not roll back a valid release because search recrawl is asynchronous; it is reported separately.

The gate currently probes the homepage and `/books`, including the Books publication-date labels introduced by Content Date Contract V1.

# Research / WorkLab boundary V1 (2026-10-21)

Decision: Research is research/analysis; WorkLab owns learning, tools and downloadable publications.

Applied: Research homepage and primary navigation stop promoting Books. Existing legacy Books and Studio URLs remain operational for inbound links. WorkLab /library currently provides a catalog pointing to original public URLs; not a host for EPUB or PDF bytes.

Mandatory asset-transfer gate before shutting down legacy generation:
1. Record exact source URL, SHA256, size, MIME and immutable release manifest for each published EPUB/PDF.
2. Stage those identical binary files in approved WorkLab storage after verifying public versus protected access classification.
3. Confirm replacement LIVE WorkLab URL, HTTP 200 or authenticated approval, exact SHA256, filenames, browser/mobile download and relevant security.
4. Add old-URL redirects only when replacement is ready, retaining legacy URLs until verified.
5. In the same protected release remove Research Studio EPUB prebuild, PDF Playwright generation/cache, export provenance and book-specific release checks. Do not remove them before verified transfer.
6. Validate isolated Cloudflare Workers Builds preview with Worker bindings/custom domains, then change from existing GitHub Actions deploy to exactly one native deploy owner; retain rollback and production smoke.

Until 1-6 pass, this is a transitional boundary; not a completed binary migration or production cutover.
Do not delete legacy contents, change publishedAt values, or bypass Build/security/SEO/Article QA for speed.

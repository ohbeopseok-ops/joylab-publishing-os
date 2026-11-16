# Research Post-Publish & Google Indexing SOP V1.0

**Status:** Proposed (scoped documentation PR; no indexing claim, no deploy on this PR).  
**Owner:** JoyLab Research editorial/operations  
**Scope:** Newly published Research articles at `https://aijoylab.kr/articles/<slug>`

## Status boundaries (never collapse these)

| State | Evidence needed |
| --- | --- |
| SOURCE MERGED | GitHub PR merged and exact merge commit SHA |
| DEPLOY STARTED | Production deployment run exists |
| DEPLOY GREEN | Exact-SHA deployment completed with success |
| PUBLIC VERIFIED | Canonical article URL HTTP 200 with title/body/source links and correct redirects |
| DISCOVERABLE | URL in sitemap + robots permits crawling + canonical matches + relevant internal links |
| INDEXED VERIFIED | Search Console URL Inspection indexed verdict for exact URL |
| SEARCH IMPRESSIONS OBSERVED | Search Console Performance page-filtered impressions > 0 for a stated date range |
| QUERY VISIBILITY OBSERVED | GSC query/page matched data if present (anonymized/hidden queries may prevent detail) |

**Important:** Search engine crawling/indexing is independently controlled by Google. `sitemap.xml`, IndexNow submissions, successful Google URL inspection API calls, and `site:` searches do not guarantee indexing or search impressions.

## After merge: mandatory validation order

1. Capture PR, merge SHA, release workflow run ID + final conclusion.
2. Require existing `docs/RELEASE_GATE_V1.md`: production deploy, domain, smoke and Studio obligations. Any failed/unknown critical gate -> `BLOCKED`; do not call the release GOLD.
3. Fetch the **exact** canonical URL after deployment; record HTTP status, redirect chain, selected page title/H1, main content, cited primary sources, internal links, indexability, JSON-LD, OG image, robots directives, canonical, publishing date and viewport visual QA. Verify 390px, 430px, and PC screenshots against release SHA.
4. Check sitemap XML contains canonical URL and robots.txt allows access. Do not silently submit URLs when indexability fails.
5. Inspect exact URL in Google Search Console URL Inspection through an authorized accessible account; log verdict, coverage state, fetch/robots status, Google canonical vs declared canonical and inspection time. If GSC connection is unavailable, status must remain `GSC ACCESS BLOCKED` and must not be reported as unindexed/indexed.
6. If URL is published and indexable but has not been indexed, record `DISCOVERABLE / INDEXING PENDING`. Where supported, request indexing using Search Console UI once; this request is not evidence of indexing. Never generate repeated automated indexing submissions to game Google.
7. Recheck via Search Console after Google has had time to crawl. Record exact check date and observed verdict; use the official Search Console Performance report with page filter to measure impressions/clicks, allowing processing lag. No impressions != no indexing.
8. Create a concise post-publish record and escalate outstanding failures with an owner/next action.

## Post-publish evidence template

```yaml
articleUrl: "https://aijoylab.kr/articles/<slug>"
pr: null
mergeSha: null
deployRunUrl: null
deployConclusion: UNKNOWN
productionGate: BLOCKED
httpStatus: UNKNOWN
canonical: UNKNOWN
robots: UNKNOWN
sitemapPresent: UNKNOWN
mobile390: NOT_TESTED
mobile430: NOT_TESTED
desktop: NOT_TESTED
gscInspectionDate: null
gscVerdict: UNKNOWN
gscCoverage: UNKNOWN
googleCanonical: null
impressions:
  period: null
  count: null
finalStatus: WAITING_FOR_DEPLOY
notes: []
```

## Blockers, ownership and follow-up

- Deployment failure: engineering owner investigates existing GitHub/Cloudflare deploy and maintains previous working production.
- HTTP/SEO/visual failure: content/web maintainer fixes on a new protected PR; no direct main changes.
- GSC authentication/subscription blocker: request access or use the connected Search Console UI; do not pay or subscribe without explicit user authorization.
- Indexed but no impressions: monitor page-specific GSC report with date range and avoid declaring an SEO failure from one observation.
- Historical stale data: record `asOf` timestamps and do not call a prior inspection today's result.

## Out-of-scope

No PDF/EPUB creation, upload or asset migration. No new scheduled job, GitHub Actions workflow or automatic production deployment. Keep existing protected-main and deploy-owner rules.

# JoyLab WorkLab Access V1.0 — Sprint 1
Status: PREVIEW ONLY / NOT AUTHENTICATED / NOT DEPLOYED

## Scope
- /worklab: public landing / learning preview
- /ax-field-lab: public access-information page only; **not** a protected resource
- No credentials, employee data, real STT, internal scripts, or private dashboard data in this branch.
- Preserve existing JoyLab pages, build system, and production deployment.

## Security gates before Sprint 2 release
1. Confirm Cloudflare account and zone ownership, Access availability and hosting model.
2. Deny-by-default for the **entire** private namespace (including static assets, HTML, API endpoints, direct URLs and caching paths); access must be checked server-side/at edge, not only by hiding links.
3. Set identity verification (email OTP/IdP), separate manager approval and RBAC; email possession alone is not a leader eligibility proof.
4. Avoid public deployment of member profiles or private JSON/R2; private files must be non-public and accessed only by permission-checked Workers.
5. Test unauthenticated, verified-unapproved, approved-leader, administrator, revoked-user and direct asset-link scenarios.
6. Verify no sensitive data in Git history, build output, browser source, sitemaps, search index, analytics or logs.
7. Follow internal information security approvals prior to any real work dataset integration.

## Acceptance tests (pre-merge)
- /worklab and /ax-field-lab compile under npm run build
- Pages label the second route clearly as public **preview** and do not imply a live security gate.
- No link on these pages points to non-existent login or pilot features.
- Existing routes/build remain unchanged.
- Human review of content and permission-gating architecture before deploying.

## Roadmap
- Sprint 2: establish Cloudflare Access/Workers/D1 identity + approval + permission checks and negative access tests.
- Sprint 3: synthetic-data script-review workflow, experiment registry and sample dashboard.
- Sprint 4: leader pilot, measurements, review, release decision.

## Human approval required
- The protected hostname/subdomain and permitted email domain(s)
- Authorized approving administrators
- Security/privacy approval for data retention and external hosting
- Cloudflare policy rollout and public release

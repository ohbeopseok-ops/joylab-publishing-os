# Observability Fidelity Pass 01

Status: PASS / SOAKING

Production target: `https://aijoylab.kr`
Workflow: `.github/workflows/production-health.yml`
Checker: `scripts/check-production-health.mjs`
Cadence: hourly at minute 17 UTC, plus manual `workflow_dispatch`

## Purpose

Protect the JoyLab Gold baseline after deployment by continuously checking the externally observable production state. This pass is intentionally read-only and does not mutate DNS, Cloudflare, GitHub, content, or analytics configuration.

## Production Watch V1 coverage

Each run checks:

1. DNS resolution for `aijoylab.kr` using A and AAAA lookups.
2. TLS handshake, hostname validation, and certificate expiry.
3. Canonical homepage availability and canonical marker.
4. Core guide availability.
5. Representative article availability and Article → Contact CTA marker.
6. About V2 availability and Research System markers.
7. Contact V2 availability and form marker.
8. Privacy page availability and Analytics Engine disclosure.
9. `robots.txt` availability and sitemap declaration.
10. `sitemap.xml` availability and canonical URLs.
11. RSS availability.
12. Gold security headers on production responses.
13. `www.aijoylab.kr` representative route remains HTTP 301 to the canonical root domain.
14. Response-time observations for HTTP checks.

## Failure model

- Each HTTP/TLS check retries up to three times before the run fails.
- Any final DNS, TLS, HTTP status, required-content, security-header, or canonical-redirect failure makes the GitHub Actions run fail.
- Response time above 1500 ms is a **soft warning only** in V1 because GitHub-hosted runner network variance can create false positives.
- TLS expiry below 14 days is a warning while an expired or invalid certificate is a hard failure.

The workflow uses only `contents: read` repository permission. It does not automatically open issues or modify production. GitHub Actions failure notifications are the V1 alert surface.

## Gold baseline integration

The Gold baseline guard must verify that:

- the Production Health workflow exists;
- it is scheduled hourly at minute 17;
- manual dispatch remains available;
- repository permissions remain read-only;
- the workflow runs `scripts/check-production-health.mjs`;
- the health checker retains DNS, TLS, canonical redirect, security-header, robots, sitemap, RSS, About, Contact, guide, and representative article checks.

The normal Build workflow syntax-checks the health script so a JavaScript syntax regression cannot reach main.

## Status model

`PASS / SOAKING` means the implementation, protected merge path, post-merge Build, and Cloudflare Deploy have passed, while independent Production Health runtime evidence is still accumulating.

Promote to `GOLD` only after all of the following are observed:

1. protected-main PR Build passes;
2. merge to main succeeds;
3. post-merge Build and Cloudflare Deploy stay green;
4. at least one Production Health run on main passes, whether scheduled or manually dispatched;
5. at least three consecutive scheduled hourly Production Health runs pass.

## V1 exclusions

This pass verifies what an external user can observe. It does **not** yet audit Cloudflare control-plane configuration drift such as WAF rules, DNS-record inventory, API-token permissions, secret expiration, or domain registration expiry. Those belong to a later Configuration Drift Audit.

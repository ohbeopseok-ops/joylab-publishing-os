# KIS OAuth Read-only Smoke V1 (manual only)

This workflow uses `KIS_APP_KEY` and `KIS_APP_SECRET` **already stored** in this repository's GitHub Actions Secrets. No credential value moves to a new repository. It is intentionally separate from the AI CAPEX runtime, which can write market snapshots and open PRs.

- Actions → `KIS OAuth Read-only Smoke V1` → Run workflow → check `acknowledge_token_request` → Run. **Run only after the feature PR passed required gates and merged to protected main.**
- One OAuth POST and one explicitly allowlisted KIS domestic-stock investor-flow GET; no order or account endpoints, no schedule, no generated artifacts, no file writes, permission `contents: read`.
- Output is sanitized: authentication PASS/FAILED, read-only data HTTP/provider PASS/FAILED, field **names only**. The log explicitly labels futures and spot investor-flow semantics `NOT_VERIFIED`.
- Do not retry repeatedly if token issuing is rate-limited or another runtime uses the same key. Inspect result metadata only. Never paste full logs containing secret material into tickets or chat.
- On any failure, status is BLOCKED. This proves connectivity only; source units, timestamps, market scope, foreign net contracts and real-time rights remain independent gates.

Technical source: [official KIS example `FHPTJ04030000`](https://github.com/koreainvestment/open-trading-api/blob/main/examples_llm/domestic_stock/inquire_investor_time_by_market/inquire_investor_time_by_market.py).

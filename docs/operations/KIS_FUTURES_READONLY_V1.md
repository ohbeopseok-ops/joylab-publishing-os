# JoyLab KIS Futures Read-only Probe V1

## Status

`CODE_TESTED / PROVIDER_NOT_SMOKE_TESTED / GATE_DISABLED`.
The collector is a manual connectivity probe, **not** a verified foreign futures
investor-flow feed and **not** a trading application.

## Sources and isolation

- Official KIS REST `display-board-futures`, `FHPIF05030200` (`F`, `20503`, `MKI`).
- Existing `KIS_APP_KEY` and `KIS_APP_SECRET` GitHub Actions Secrets only.
- One OAuth POST + one allowlisted futures market GET. **No account/order paths.**
- Manual workflow_dispatch with explicit acknowledgement; no cron and no files written.
- Logs include only a whitelisted price/code/change snapshot and status; never
  access tokens, credentials, headers, raw errors or raw provider responses.

## Run safely

1. Merge only after required protected Build and relevant gates pass.
2. In Actions select `KIS Futures Read-only Probe V1` and acknowledge one
   OAuth request. Avoid competing token requests or repeated retries.
3. Verify the provider result and field semantics against KIS documentation.
4. **Keep `gate=DATA_HOLD`** until source-market timestamp, market scope,
   contract identity, units, foreign net contracts, and provenance have been
   independently verified. A futures price never proves foreign net buying.
5. Compare with an independent broker/official observation during one session.

## Real-time follow-on (NOT shipped)

KIS supports index futures trade WebSocket `H0IFCNT0` using a separately issued
approval key. Always resolve the current contract from the KIS master, never
hardcode a stale contract. WebSocket trade messages do not encode an investor
category. A separate documented provider entitlement/schema is required for
foreign investor net futures flow and `SAJA30 GREEN` decisions.

Do not add recurring cron, write market snapshots, or enable automatic trading
without a separate PR and verified data-quality gates.

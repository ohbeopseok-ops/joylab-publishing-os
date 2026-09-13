# JoyLab Living Research v1.0

## 1. Definition

Living Research is a research operating model in which a Pillar page is not a static index of articles but a continuously maintained decision system.

Each Living Research Pillar must combine:

1. **Source Layer** — first-party or authoritative data sources.
2. **Signal Layer** — auto-refreshed numeric indicators and deterministic scorecards.
3. **Research Layer** — versioned long-form analyses that explain structure and causality.
4. **Transmission Layer** — how the signal reaches investable assets or operating decisions.
5. **Scenario Layer** — GREEN / YELLOW / RED or equivalent decision states.
6. **Runtime Layer** — scheduled refresh, source validation, editorial issue, PR, build, deploy, smoke.

## 2. Non-negotiable rule

> Numbers may update automatically. Interpretation changes require verified sources and a reviewed PR.

Automation may update observations, dates, derived spreads and deterministic scores. It must not automatically introduce crisis language, causal claims, policy intent, buy/sell recommendations or materially change a research conclusion.

## 3. Required architecture

`Source → Validator → Data Snapshot → Score Engine → Pillar Dashboard → Research Articles → Editorial Runtime → Production Verification`

### Source
Authoritative external data or verified internal dataset.

### Validator
Plausibility range, date freshness, parser integrity and source identity checks.

### Data Snapshot
Repository-tracked JSON or equivalent source of truth.

### Score Engine
Transparent deterministic formula with directionality and thresholds.

### Pillar Dashboard
Current state, scorecards, watch indicators and links to research layers.

### Research Articles
Versioned evidence-based analysis with explicit Fact / Interpretation / Scenario / Action separation.

### Editorial Runtime
Material data changes create an issue or PR checklist for source verification and narrative refresh.

### Production Verification
Build green → merge → deploy → custom-domain check → production smoke.

## 4. Gold criteria

A Pillar is `Living Research GOLD` only when all are true:

- dashboard has at least 3 authoritative metrics;
- every score formula is documented;
- stale-data behavior is defined;
- auto-refresh cannot overwrite narrative interpretation;
- source changes create an editorial trigger;
- Pillar links research in causal order rather than chronology;
- production smoke covers the Pillar route;
- one real monthly/event update has completed end-to-end without manual repair.

## 5. First implementation: U.S. Rates

Framework:

`Supply → Buyer → Auction → Yield → FX → Equity`

Current metrics:

- US 10Y
- US 30Y
- 30Y-10Y spread
- TIC foreign holdings
- USD/KRW
- Treasury auction quality
- Auction Score 100
- TIC Score 100
- Composite Rates Risk Score 100

Research path:

1. China Treasury fact check
2. Treasury buyer map
3. 30Y long-end risk
4. Treasury auction quality
5. 10Y price signal
6. Korea transmission
7. Samsung Electronics / SK Hynix foreign-flow transmission

## 6. Replication contract

### Semiconductor Investing

Framework:

`Demand → Memory Price → Earnings Revision → Valuation → Foreign Flow → Price`

Minimum dashboard candidates:

- HBM / server DRAM demand proxy
- DRAM/NAND price trend
- Samsung Electronics EPS revision
- SK Hynix EPS revision
- foreign flow for both stocks
- semiconductor relative strength vs KOSPI

Score candidates:

- Fundamental Score 100
- Revision Score 100
- Flow Score 100
- Composite Semiconductor Score 100

### AI Power

Framework:

`Compute Demand → Power Demand → Generation → Grid → Transformer/Distribution → Cooling/Data Center`

Minimum dashboard candidates:

- hyperscaler capex / data-center demand signal
- power generation order signal
- transmission/grid backlog
- transformer lead-time / order signal
- cooling/data-center capacity signal

Score candidates:

- Demand Score 100
- Bottleneck Score 100
- Capex Conversion Score 100
- Composite AI Power Score 100

## 7. Versioning

- methodology change: major/minor version bump and changelog;
- source or threshold change: PR required;
- daily observation refresh: automated commit allowed after validation;
- monthly structural refresh: editorial runtime required;
- model promotion to GOLD: only after one complete real-world refresh cycle.

## 8. Initial status

- U.S. Rates: `LIVING RESEARCH / PILOT`
- Semiconductor Investing: `LIVING RESEARCH / REPLICATION READY`
- AI Power: `LIVING RESEARCH / REPLICATION READY`

The U.S. Rates Pillar becomes the reference implementation. Semiconductor and AI Power must reuse the same Source/Signal/Research/Transmission/Scenario/Runtime contract rather than copy visual markup only.

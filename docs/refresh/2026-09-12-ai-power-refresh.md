# AI Power Cluster Freshness Audit

Status: PASS / monitor
Date: 2026-09-12
Lane: REFRESH
Cluster: AI Power

## Scope

이번 점검은 새 글을 추가하지 않고 기존 AI Power Research Cluster의 숫자·공식자료·구조 판단이 2026-09-12 기준으로 여전히 유효한지 확인한다.

점검 순서:

1. 두산에너빌리티 Company Research
2. Grid / Transformer / Distribution
3. BESS / UPS / BBU
4. Gas Turbine
5. Cooling
6. AI Power Value Chain / 4-company Compare

## Source hierarchy applied

1. 회사 IR / Earnings / 공식 보도자료
2. 정부·산업 공식 자료
3. 공식 제품·솔루션 문서
4. 기존 JoyLab Research의 기준일·출처

주요 공식 확인 경로:

- Doosan Enerbility IR Materials — 2026 Q2 Performance / 2026 Half-year review report
- Hyosung Heavy Industries IR archive — 2026 Q2 earnings material dated 2026-07-31
- LS ELECTRIC IR / official press release — 2026 Q2 results
- Schneider Electric official liquid-cooling materials and 2026 CDU / AI data-center announcements
- Vertiv official liquid-cooling materials
- Existing official-source links embedded in the Gas Turbine / Grid / Resilience articles

## 1. Doosan Enerbility — PASS

Article: `src/data/articles/doosan-enerbility-ai-power.md`

Current article basis:

- 2026 Q2 IR
- Energy segment H1 new orders around KRW 7.1tn
- June-end backlog around KRW 26.4tn
- 2026 Q2 consolidated revenue around KRW 4.72tn and operating profit around KRW 314.3bn
- Energy segment revenue around KRW 2.23tn and operating profit around KRW 97.4bn
- North American data-center-linked gas-turbine / steam-turbine order narrative
- long-term service revenue as the margin-quality check

Official refresh check:

- Doosan Enerbility IR site still lists `2026년 2분기 실적` as the latest quarterly performance material.
- The company also lists the 2026 half-year review report.
- No later quarterly earnings package exists as of the audit date.

Decision:

**PASS — no forced rewrite.**

The thesis remains correctly framed as `order growth → equipment mix → service attachment → core Energy margin`, rather than simply equating backlog growth with profit growth.

Re-open triggers:

- 3Q26 earnings / Energy-segment margin change
- additional North American data-center turbine package order
- material production-slot expansion disclosure
- major nuclear / SMR facility CAPEX or order update
- service attachment ratio becoming quantifiable in company disclosure

## 2. Grid / Transformer / Distribution — PASS

Article: `src/data/articles/ai-power-grid-transformer-distribution.md`

Current structure:

`Grid → Transformer → Distribution`

The article intentionally uses structural decision variables rather than one-company quarterly numbers:

- backlog
- lead time
- pricing / ASP
- capacity expansion
- margin transmission
- data-center exposure

Official company cross-check:

- Hyosung Heavy Industries officially lists 2026 Q2 earnings material dated 2026-07-31.
- LS ELECTRIC officially lists 2026 Q2 IR material.
- LS ELECTRIC's official 2026 Q2 release reports revenue KRW 1.5770tn, operating profit KRW 178.5bn, new orders KRW 2.1tn and order backlog KRW 7.0tn; this remains aligned with the Company / Compare research currently published.

Decision:

**PASS — structural article remains current.**

No reason to turn the structural Grid article into a quarterly company-results page. Company-specific numbers remain in Company Research / Compare Hub.

Re-open triggers:

- material shortening of transformer lead times
- broad capacity expansion causing pricing pressure
- U.S. grid / data-center capex slowdown or acceleration that changes the bottleneck thesis
- company backlog growth no longer translating to margin

## 3. BESS / UPS / BBU — PASS

Article: `src/data/articles/bess-ups-bbu-data-center.md`

Current core thesis:

`BBU = rack-near short-duration protection`
`UPS = immediate facility / IT continuity`
`BESS = larger-scale facility / grid buffering and flexibility`

The current article correctly avoids claiming that one layer fully replaces another.

Refresh judgment:

No official evidence found in this audit that invalidates the three-layer resilience model. The distinction by response time, installation scope and use case remains useful.

Decision:

**PASS — no content rewrite.**

Re-open triggers:

- hyperscaler architecture that materially removes centralized UPS
- major BBU adoption standard becoming public across new AI rack architectures
- BESS moving from complementary role to broadly standardized primary backup architecture
- safety / chemistry standard change that changes the preferred battery stack

## 4. Gas Turbine — PASS

Article: `src/data/articles/ai-power-gas-turbine-return.md`

Current decision chain:

`Data-center power demand → generation project → gas turbine order → production slot → lead time → service revenue → margin`

The article already focuses on production slots and service attachment instead of treating gross orders as the only signal.

Doosan's current IR availability and the absence of a newer quarterly package mean the source base remains current as of 2026-09-12.

Decision:

**PASS — no forced rewrite.**

Re-open triggers:

- new multi-unit North American turbine order
- meaningful production-capacity / delivery-slot revision from major turbine OEMs
- lead-time normalization that weakens pricing power
- service / LTSA mix becoming a larger disclosed earnings driver
- gas-price / regulation change that alters project economics

## 5. Cooling — PASS with evidence strengthening note

Article: `src/data/articles/ai-data-center-cooling-bottleneck.md`

Current thesis:

`Rack density ↑ → heat density ↑ → air-cooling limit → liquid-cooling adoption ↑ → cooling CAPEX / design change`

Official 2026 evidence remains directionally supportive:

- Schneider Electric describes integrated liquid cooling for AI and high-density data centers.
- Schneider's official materials state current air-cooling limits become increasingly difficult around very high rack densities and present CDU / direct-to-chip architectures as the scaling path.
- Schneider announced a 2.5MW-class CDU (`MCDU-70`) designed to support deployments above 10MW.
- Schneider also announced an AI-data-center cooperation arrangement in Korea integrating power, cooling and operations.
- Vertiv continues to position liquid cooling as a response to rising rack power density.

Decision:

**PASS — thesis strengthened, but no mandatory rewrite today.**

Reason:

The existing article already reaches the same structural conclusion and is only one day old. Adding every new vendor product number would make a structural article age faster without changing the decision rule.

Re-open triggers:

- next GPU / rack architecture materially raises standard rack density
- liquid-cooling attachment rate or system margin becomes publicly quantifiable
- CDU capacity / architecture standard converges enough to change the current open-system view
- major customer standard design win becomes public

## 6. AI Power 4-company Compare — PASS

Article: `src/data/articles/korea-ai-power-companies-compare.md`

Companies:

- Doosan Enerbility
- Hyosung Heavy Industries
- HD Hyundai Electric
- LS ELECTRIC

Current comparison uses the right hierarchy:

`Value Chain → AI Exposure → Demand Visibility → Capacity → Margin → Competitive Edge → Valuation → Scenario → Action`

Key 2Q26 figures in the hub remain internally aligned with the underlying Company Research. LS ELECTRIC's official release directly reconfirms the published revenue, operating-profit, new-order and backlog figures.

The current article also correctly warns against comparing consolidated OPM without normalizing business mix.

Decision:

**PASS — retain valuation base date 2026-09-10.**

Do not roll the valuation date forward only for freshness optics. Re-open when price / consensus / quarterly earnings move enough to change the relative-ranking logic.

Re-open triggers:

- 3Q26 earnings from any of the four companies
- material order / backlog revision
- capacity-expansion completion or delay
- meaningful margin inflection
- valuation dispersion large enough to alter the current scenario map

## Cluster conclusion

AI Power remains structurally valid as:

**Generation → Grid → Resilience → Gas Turbine → Cooling → Compare**

No article requires a forced rewrite on 2026-09-12.

The most important operating conclusion is that the bottleneck thesis is intact, but future REFRESH work should be event-driven rather than calendar-driven.

### Current status

- Doosan Enerbility — PASS
- Grid / Transformer / Distribution — PASS
- BESS / UPS / BBU — PASS
- Gas Turbine — PASS
- Cooling — PASS / evidence strengthened
- 4-company Compare — PASS

### Next scheduled lane

**Shipbuilding REFRESH**

Primary checks:

- orderbook
- ship mix
- delivery year
- margin conversion
- naval / LNG / offshore exposure
- capacity / productivity
- valuation base date

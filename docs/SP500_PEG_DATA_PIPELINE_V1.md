# S&P500 PEG Data Pipeline V1

Status: Active  
Purpose: PEG 차트 근사값(SILVER)과 재현 가능한 숫자 원자료(GOLD)를 분리하고, 동일한 산식으로 검증 가능한 PEG 시계열을 생성한다.

## Production path

1. 숫자 원자료를 `data/valuation/sp500-peg-input.csv`에 공급한다.
2. 각 행은 날짜, provider, tier, source_ref를 반드시 보존한다.
3. PEG가 직접 제공되지 않으면 `Forward P/E / LTEG%`로 계산한다.
4. PEG와 두 구성요소가 동시에 존재하면 오차 0.02 이내인지 검증한다.
5. licensed numeric row만 GOLD 승격이 가능하다.
6. chart digitization은 영구적으로 SILVER이며 자동 승격하지 않는다.

## Input schema

```csv
date,peg,forward_pe,lteg_pct,source_provider,source_tier,source_ref
```

### GOLD example

Provider가 Refinitiv I/B/E/S 등 재현 가능한 라이선스 숫자 데이터일 때:

```text
source_provider=refinitiv_ibes
source_tier=licensed_numeric
source_ref=<dataset/query/export provenance>
```

실제 라이선스 데이터와 provenance 없이 위 값을 임의로 넣으면 안 된다.

### SILVER example

공개 Yardeni 차트를 좌표화한 경우:

```text
source_provider=yardeni_chart
source_tier=chart_digitized
source_ref=https://archive.yardeni.com/pub/stockmktperatio.pdf
```

## Commands

Self-test:

```bash
node scripts/build-sp500-peg-series-v1.mjs --self-test
```

Build:

```bash
node scripts/build-sp500-peg-series-v1.mjs \
  --input data/valuation/sp500-peg-input.csv \
  --out artifacts/valuation
```

Outputs:

- `artifacts/valuation/sp500-peg-series.json`
- `artifacts/valuation/sp500-peg-series.csv`

## GOLD Gate

GOLD requires all observations used by the production backtest to be reproducible numeric observations. Chart-derived values may be retained for comparison but cannot be included in the GOLD signal sample unless explicitly separated as SILVER.

## Next adapter

The acquisition boundary is intentionally provider-neutral. A licensed Refinitiv export can be mapped into the CSV contract without changing the backtest engine. If direct API access becomes available, add an adapter that writes this same contract rather than embedding vendor logic into the backtest.

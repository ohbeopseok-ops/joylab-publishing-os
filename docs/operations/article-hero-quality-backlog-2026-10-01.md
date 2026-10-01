# Article Hero Quality Backlog · 2026-10-01

## Audit scope

- Published Articles: **122**
- Article Hero Gate: **PASS**
- Raster Heroes inspected by Hero Quality Gate V3: **18**
- Vector / non-raster Heroes: **104**
- V3 warnings: **0**
- V3 failures: **0**

## Quality backlog

현재 V3 기준 즉시 수정이 필요한 Hero는 없습니다.

| Priority | Article | Finding | Action |
| --- | --- | --- | --- |
| — | — | No WARN / FAIL | Maintain current quality contract |

## Gate criteria

Raster Hero는 최소 실픽셀, 권장 해상도, encoded bytes-per-pixel, Laplacian variance, edge density를 검사합니다. 원격 raster Hero는 로컬 검증이 불가능하므로 fail-closed 처리합니다. SVG Hero는 raster blur 검사의 대상에서 제외합니다.

## Operating rule

1. 새 Article Hero가 raster이면 V3를 반드시 통과합니다.
2. 권장 크기 미만은 WARN backlog로 편입합니다.
3. 과압축·저해상도·blur/low-detail은 merge 차단 대상으로 처리합니다.
4. 모바일 시각 품질은 Responsive / Mobile Visual Gate에서 별도로 검증합니다.

## Audit evidence

- Main commit: `3dd528dabdfa7e48a0c00f00a76558fa77459239`
- Article Hero Gate run: `36799191388`
- Result: `Article Hero Quality Gate V3 PASS: 18 raster Article Heroes checked for dimensions, overcompression and blur.`

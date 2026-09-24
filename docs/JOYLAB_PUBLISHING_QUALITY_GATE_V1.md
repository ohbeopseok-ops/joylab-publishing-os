# JoyLab Publishing Quality Gate V1.0

## Goal

발행 전 콘텐츠를 Searchability, GEO Citation Readiness, E-E-A-T/Trust, Discover Readiness의 네 축으로 검사한다.

- SEO: 25
- GEO: 25
- E-E-A-T: 25
- Discover: 25
- Total: 100

## Decision

- 90–100: GOLD
- 85–89: PASS
- 75–84: REVIEW
- 60–74: HOLD
- <60: FAIL
- Hard Gate 오류: BLOCKED

## GOLD regression set

세 글은 점수 우수 사례만을 뜻하지 않는다. 서로 다른 콘텐츠 유형을 고정 입력으로 사용해 규칙 변경 시 회귀를 감지한다.

| Slug | Type | Manual baseline |
| --- | --- | ---: |
| what-is-hbm | Search explainer | 83 |
| samsung-vs-sk-hynix-ai-memory | Compare research | 82 |
| anthropic-ipo-ai-safety-2026 | Timely sourced analysis | 94 |

## CI policy

PR에서는 변경된 article만 검사한다.

```bash
npm run quality:gate -- --changed
```

레거시 전체 글을 한 번에 차단하지 않는다. 신규·수정 콘텐츠부터 Gate를 적용하고 이후 migration한다.

## Principle

Deterministic checks take precedence over LLM judgment. V1의 점수는 JoyLab 내부 운영 proxy이며 Google, ChatGPT, Perplexity의 공식 점수가 아니다.

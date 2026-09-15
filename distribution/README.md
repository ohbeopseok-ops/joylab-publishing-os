# JoyLab Distribution OS V1.0

한 편의 JoyLab Research를 채널별 파생 콘텐츠로 전환하기 위한 배포 계약입니다.

## Output contract

`node scripts/build-distribution-pack.mjs --slug <article-slug>`를 실행하면 아래 골격을 생성합니다.

- `distribution/generated/<slug>/threads.md` — Hook / Interpretation / Question 3개
- `distribution/generated/<slug>/x.md` — Data / Debate / One-line Judgment 3개
- `distribution/generated/<slug>/linkedin.md` — Problem → Interpretation → Practical Implication 1개
- `distribution/generated/<slug>/naver.md` — 검색형 요약 + 원문 연결 1개
- `distribution/generated/<slug>/manifest.json` — source article, UTM, publish status

## UTM contract

- `utm_source`: `threads | x | linkedin | naver`
- `utm_medium`: `social` (Threads/X/LinkedIn), `blog` (Naver)
- `utm_campaign`: `research_<slug>`
- `utm_content`: 채널 변형 ID (`hook`, `interpretation`, `question`, `data`, `debate`, `judgment`, `insight`, `summary`)

## V1 guardrails

1. 사이트 원문이 canonical source입니다.
2. 채널별 문구를 동일 복사하지 않습니다.
3. 사실과 해석을 분리하고 숫자는 원문에서만 가져옵니다.
4. 자동 생성 결과는 발행 전 사람 검토를 거칩니다.
5. manifest의 `publishStatus`는 기본 `draft`입니다.

V1은 생성 골격과 추적 계약까지만 제공합니다. 실제 LLM 자동 작성/소셜 API 자동 발행은 다음 단계에서 별도 승인 후 연결합니다.

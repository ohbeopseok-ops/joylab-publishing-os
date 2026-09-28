# Company Compact Scaffold V1

신규 Company Research를 기존 Compact Contract에 붙이는 표준 생성기입니다.

## 입력

먼저 `src/data/articles/<articleId>.md`가 존재해야 합니다.  
`config/company-compact-spec.example.json`을 복사해 회사별 spec을 만듭니다.

필수 계약:

- primary node 정확히 4개
- `signalNode`는 primary node 중 하나
- `signalNode.signals`는 정확히 3개
- `signalId`는 위 3개 signal 중 하나
- `hubHref`는 `/guides/`로 시작
- 기존 graph / registry / QA target을 덮어쓰지 않음

## 실행

```bash
npm run company-compact:scaffold -- --spec config/my-company-compact.json --dry-run
npm run company-compact:scaffold -- --spec config/my-company-compact.json
npm run company-compact:contract
npm run build
```

## 자동 생성/수정

Scaffold 한 번으로 다음 네 군데가 함께 갱신됩니다.

1. `config/research-graph-<key>-compact-v1.json`
2. `src/config/companyCompactResearch.ts`
3. `config/research-graph-display-modes-v1.json`
4. `config/company-compact-targets-v1.json`

`company-compact-targets-v1.json`은 Preview QA와 Production GOLD의 공통 Source of Truth입니다. 따라서 신규 기업을 추가하면 별도의 Playwright 대상 코드를 다시 작성할 필요가 없습니다.

## QA 흐름

```text
Company Research 원고 존재
→ Scaffold
→ Contract Check
→ Build
→ Preview QA (390 / 1280 / 1440)
→ PR merge
→ Cloudflare Deploy
→ Production GOLD (390 / 1280 / 1440)
```

Production GOLD는 모든 등록 기업에 대해 다음을 확인합니다.

- 4-node decision flow
- full matrix 비노출
- flow + selected detail viewport 노출
- 3개 key signal
- signal disclosure interaction
- Full Research Graph hub link
- page horizontal overflow 0
- page JS error 0

## 새 기업 1개를 붙일 때 수정 금지

일반적인 신규 기업 추가에서는 `src/pages/articles/[...slug].astro`와 QA 스크립트를 직접 수정하지 않습니다.  
Scaffold가 registry와 target contract를 갱신하며 article route는 `getCompanyCompactResearch(article.id)`로 자동 연결됩니다.


## 자동 실행 모드

앞으로 신규 Company Research는 spec을 아래 경로에 두면 됩니다.

```text
config/company-compact-specs/<articleId>.json
```

`npm run dev`와 `npm run build`가 자동으로 `company-compact:sync`를 먼저 실행합니다.
아직 등록되지 않은 spec만 Scaffold하고, 이미 등록된 spec은 idempotent하게 SKIP합니다.

신규 `investmentResearchType: company` article에 spec/target이 없으면
`company-research:auto-enrollment` gate가 FAIL하여 누락을 차단합니다.

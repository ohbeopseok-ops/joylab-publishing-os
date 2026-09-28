# Company Research Auto Pipeline V1

Company Research를 작성하면 Compact Research와 Preview/Production QA까지 자동 연결하는 운영 계약입니다.

## 완료 정의

`investmentResearchType: company`인 신규 리서치는 아래가 한 묶음입니다.

```text
Company Research article
→ Company Compact spec
→ Auto Sync
→ Compact graph / registry / display inventory / QA target
→ Contract
→ Preview QA
→ Merge
→ Cloudflare Deploy
→ Production GOLD
```

## 작성 규칙

새 Company Research 원고에는 최소한 다음 taxonomy를 넣습니다.

```yaml
investmentResearchType: company
investmentIndustries:
  - <industry-id>
investmentCompanies:
  - <company-name>
```

그리고 같은 변경에서 아래 파일을 만듭니다.

```text
config/company-compact-specs/<articleId>.json
```

Spec은 4개 primary node와 선택 node의 3개 signal을 정의합니다.

## 자동 반영

`npm run dev`와 `npm run build`는 시작 전에 자동으로:

1. `config/company-compact-specs/*.json`을 스캔
2. 아직 등록되지 않은 spec을 Scaffold
3. graph JSON 생성
4. `companyCompactResearch.ts` 등록
5. Display Mode Inventory 등록
6. Preview/Production QA target 등록
7. Contract 검사
8. Company Research auto-enrollment 검사

를 실행합니다.

따라서 정상적인 신규 Company Research에서는 article route나 Playwright QA 스크립트를 직접 수정하지 않습니다.

## CI

Company Compact Preview QA workflow는 다음 변경에서 자동 실행됩니다.

- `src/data/articles/**`
- `config/company-compact-specs/**`
- Compact graph/registry/target 관련 파일

CI는 Auto Sync를 먼저 실행한 뒤 Contract → Build → Preview QA 순서로 진행합니다.

## 누락 방지

`investmentResearchType: company`인 article은 다음 중 하나가 반드시 존재해야 합니다.

- 이미 `company-compact-targets-v1.json`에 등록되어 있음
- `config/company-compact-specs/`에 신규 spec이 있음

둘 다 없으면 CI가 FAIL합니다.

## Production

main merge 후 Cloudflare build에서도 동일 Auto Sync가 실행되므로, 신규 Company Research의 Compact graph와 QA target은 production build workspace에도 자동 생성됩니다.

Production GOLD는 공통 target contract를 읽어 390×844, 1280×900, 1440×900에서 검증합니다.

## 비대상

다음 Research Type은 Compact Company 자동 등록 대상이 아닙니다.

- pillar
- compare
- scenario
- macro
- explainer

이들은 각자의 Research Graph / Compare / Scenario 계약을 따릅니다.

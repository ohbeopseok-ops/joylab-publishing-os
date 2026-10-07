# AdSense GOLD Sample V1

## 목적
AdSense 심사 관점에서 JoyLab의 대표 콘텐츠 유형 5개를 고정 샘플로 관리한다. 전체 123개 콘텐츠를 매번 수동 점검하지 않고, 서로 다른 리서치 유형의 품질·신뢰·모바일 구조를 대표 검증한다.

## GOLD Sample 5

| Sample | Type | Role |
| --- | --- | --- |
| `samsung-electronics-outlook` | Company Research | 대표 기업·반도체 YMYL |
| `samsung-vs-sk-hynix-ai-memory` | Compare Hub | 동종 기업 비교 |
| `korea-ai-power-companies-compare` | Industry Compare | 산업·밸류체인 비교 |
| `us-economic-indicators-guide` | Macro Hub | 거시경제 허브 |
| `kb-financial-shareholder-return` | Financial/YMYL | 금융·주주환원 대표 |

## QA Contract

각 샘플은 다음을 만족해야 한다.

1. Trust Layer가 실제 화면에 렌더링된다.
2. authorBio / researchMethod / sourceList / riskFactors / counterScenarios가 article-specific이다.
3. sourceList에는 최소 2개의 검증 가능한 1차 출처가 있다.
4. Claim → Evidence 매핑이 존재한다.
5. top-level frontmatter 중복 키가 없다.
6. 모바일에서 Research Brief가 Trust Layer보다 먼저 진입한다.
7. 존재하지 않는 출처 URL을 만들지 않는다.
8. 투자·경제 글은 직접적인 매수·매도 지시 문구를 사용하지 않는다.

## CI 상태

현재 GitHub Actions Free Tier quota가 소진되어 자동 Build / Mobile / AdSense / Visual 검증은 실행할 수 없다.

따라서 현재 상태는:

**PRE-GOLD / CI-DEFERRED**

Actions quota 리셋 후 정확한 최신 HEAD에서 4-Gate를 다시 실행한다.

## 최종 GOLD 조건

- Build GREEN
- Mobile GREEN
- AdSense GREEN
- Visual GREEN

4개가 모두 최신 HEAD에서 GREEN일 때만 GOLD Sample V1을 최종 GOLD로 승격한다.

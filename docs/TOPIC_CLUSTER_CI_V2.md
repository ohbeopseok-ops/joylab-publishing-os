# Topic Cluster CI V2

JoyLab의 신규/수정 콘텐츠가 고립 페이지가 되지 않도록 AI·투자·Books까지 자동 점검합니다.

## 투자·경제 Article
- 허용된 투자 Hub/Pillar 중 최소 1개 링크
- 관련 Article 내부링크 최소 2개
- 내부 route 존재 여부 검사
- inbound link가 없으면 Warning

## AI·생산성 Article
- 허용된 AI Hub/Pillar 중 최소 1개 링크
- 관련 Article 내부링크 최소 2개
- 내부 route 존재 여부 검사
- inbound link가 없으면 Warning

## Books
- relatedArticleIds 최소 1개
- relatedArticleIds가 실제 Article ID인지 검사

## 설계 원칙
Pillar 링크·관련글·깨진 링크는 Blocker로 처리합니다.
신규 페이지의 역링크는 발행 직전 다른 콘텐츠까지 동시에 수정하지 못하는 경우를 고려해 Warning으로 시작합니다.
반도체는 기존 Internal Link Gate V1의 더 엄격한 역링크 규칙을 병행합니다.

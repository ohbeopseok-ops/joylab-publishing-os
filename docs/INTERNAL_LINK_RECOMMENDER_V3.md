# Internal Link Recommender V3

Topic Cluster CI V2가 "누락 여부"를 검사한다면, Recommender V3는 신규/수정 Article에 넣을 링크를 자동 추천합니다.

- Hub/Pillar 1개 추천
- 관련 Article 2개 추천
- 점수 근거: category, shared tags, series, title overlap, hub affinity
- 이미 링크된 Article은 감점
- 결과를 GitHub Step Summary와 artifact JSON/Markdown으로 남김
- 콘텐츠를 자동 수정하지는 않음: 추천 결과를 편집자가 검토 후 반영

실행:
`node scripts/recommend-internal-links-v3.mjs --all`

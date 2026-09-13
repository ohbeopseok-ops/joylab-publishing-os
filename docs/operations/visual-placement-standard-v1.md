# JoyLab Visual Placement Standard v1.0

## 목적
JoyLab의 이미지는 장식이 아니라 독자의 판단 속도를 높이는 리서치 인터페이스다. 이 문서는 Hero, Supporting Visual, Homepage Card, Pillar Visual의 역할과 배치 기준을 고정한다.

## 핵심 원칙
1. Placement → Role → Image Quality 순서로 판단한다.
2. 한 이미지에는 한 가지 역할만 부여한다.
3. Hero는 주제를 0.5초 안에 인식시키고, Supporting Visual은 해당 문단의 이해를 단축한다.
4. Supporting Visual은 가능한 한 설명 대상 Heading 직후에 둔다.
5. 같은 공용 이미지를 반복 사용해 글의 개별성이 사라지지 않게 한다.
6. Homepage, Article, Related Card, OG는 동일한 resolved Hero를 우선 사용한다.
7. 모바일에서는 이미지가 본문 흐름을 끊지 않도록 한 화면 높이를 과도하게 점유하지 않는다.

## 역할별 계약
### Article Hero
- 위치: 제목/설명/메타 직후
- 비율: 16:9
- 목적: 글의 주제와 긴장점을 즉시 인식
- 우선순위: CURATED manifest Hero → frontmatter heroImage → fallback

### Supporting Visual
- 기본 수량: 2장
- 비교형/밸류체인형: 최대 3장
- 기본 위치: 해당 Heading 직후
- 역할: 데이터 증거, 비교, 밸류체인, 전염경로, Scorecard
- `afterHeading`이 있으면 해당 Heading 직후 자동 이동
- `afterHeading`이 없으면 Visual Research fallback 영역에 표시

### Homepage Signature Visual
- 위치: 첫 Hero 영역 안
- 목적: Fact → Interpretation → Scenario → Action과 3개 Pillar 연결을 한 장에 표현
- 모바일에서는 축약형으로 표시

### Pillar Visual
- 투자·경제: 시장/자본흐름/기업 데이터
- AI·생산성: Agent/Workflow/Automation
- 성장·리더십: Team/Feedback/Recognition
- 세 장은 동일한 아트 디렉션을 유지하되 주제는 명확히 구분

### Research Card Thumbnail
- Homepage/Card는 article frontmatter가 아니라 resolved manifest Hero를 우선 사용
- crop은 `object-fit: cover`
- 중요한 텍스트가 이미지 가장자리에 몰리지 않도록 안전영역 확보

## 판정 체계
- GOOD: 이미지 역할과 배치 모두 적절
- REPLACE: 배치는 적절하지만 이미지 품질/개별성이 부족
- REPOSITION: 이미지 품질은 적절하지만 설명 대상과 위치가 분리
- MISSING: 필요한 역할의 이미지가 없음

## 배치 데이터 규격
```json
{
  "article-slug": {
    "supporting": [
      {"src":"/images/research/example.svg","afterHeading":"HBM3E와 HBM4는 무엇이 다른가"}
    ]
  }
}
```

## Editor SOP
1. Hero 역할을 한 문장으로 정의한다.
2. Supporting Visual이 설명할 Heading을 먼저 지정한다.
3. 이미지 생성/선정 후 image manifest에 등록한다.
4. `afterHeading`을 placement manifest에 지정한다.
5. Desktop/Mobile 위치를 확인한다.
6. 카드/OG에서 resolved Hero가 동일한지 확인한다.

## CI Gate 확장 기준
- Hero 존재/alt/caption
- Supporting Visual 2~3장
- asset 존재
- placement가 지정된 경우 대상 Heading 존재 여부 검사
- Homepage card가 resolved Hero를 사용하도록 contract 검사

## Done 기준
이미지가 존재하는 것으로 끝내지 않는다. 독자가 해당 이미지를 보는 시점이 본문 논리와 일치해야 PASS다.

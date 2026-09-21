---
name: research
description: Research a topic and turn verified evidence into a JoyLab article draft using Fact → Interpretation → Scenario → Action. Use when creating or substantially updating JoyLab research content before publish QA.
---

# JoyLab Research Skill

## Goal

주제를 조사하고 **사실 → 해석 → 시나리오 → 실행/확인 조건**으로 구조화한 JoyLab Article 초안을 만듭니다.

## Input

가능하면 다음을 받습니다.

- research topic / working title
- target category
- target reader
- freshness window
- source constraints
- desired internal links
- publication intent: draft or ready-for-QA

필수 정보가 없으면 먼저 현재 프로젝트와 기존 Article 구조를 확인하고, 안전하게 추정 가능한 범위만 진행합니다.

## Process

1. **Define scope**
   - 핵심 질문 1개와 하위 질문을 정합니다.
   - 무엇을 다루지 않을지도 명시합니다.

2. **Collect evidence**
   - 이용 가능한 신뢰도 높은 1차 또는 원출처를 우선합니다.
   - 최신성이 중요한 사실은 날짜를 확인합니다.
   - 서로 다른 출처가 충돌하면 합치지 말고 차이를 기록합니다.

3. **Separate layers**
   - Fact: 확인된 사건·데이터·공식 발언
   - Interpretation: 사실이 의미할 수 있는 것
   - Scenario: 조건부 가능성
   - Action: 다음에 확인할 지표나 실행 기준

4. **Draft**
   - 기존 `src/data/articles/*.md` frontmatter 계약을 따릅니다.
   - JoyLab 문체와 내부 링크를 사용합니다.
   - 근거 없는 숫자·고유명사·날짜를 만들지 않습니다.

5. **Pre-QA**
   - 제목과 description이 실제 본문을 대표하는지 확인합니다.
   - 사실/해석이 섞인 문장을 찾아 수정합니다.
   - 추가 검증이 필요한 항목은 명시합니다.

## Quality Gate

- 최신성이 필요한 사실에 날짜 또는 시점을 명확히 함
- 핵심 수치가 출처 또는 원문 근거와 일치함
- 사실과 해석을 구분함
- 과장된 확정 표현을 피함
- 내부링크가 실제 경로를 가리킴
- Article이 기존 content schema를 준수함

## Output

아래 중 요청된 형태로 제공합니다.

- Markdown Article draft
- Research brief + article outline
- 기존 Article 업데이트안

파일 생성 시 기본 경로:

`src/data/articles/<slug>.md`

## Handoff

Article 초안이 완성되면 **publish-qa Skill**로 넘깁니다. Publish QA를 통과하기 전에는 “발행 완료”라고 표시하지 않습니다.

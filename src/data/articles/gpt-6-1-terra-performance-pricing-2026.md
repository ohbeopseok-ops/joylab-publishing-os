---
title: "GPT-6.1 Terra 출시 분석｜컴퓨터 사용 AI의 성능·가격·도입 기준"
description: "OpenAI GPT-6.1 Terra의 공식 API 요금, Agents’ Last Exam·Terminal-Bench 4.0 성능, 환각 오류 평가와 기업 AI 자동화 도입 조건을 원문 기준으로 분석합니다."
category: "AI·생산성"
tags: ["OpenAI", "GPT-6.1 Terra", "AI 에이전트", "컴퓨터 사용", "API 비용", "AI 자동화"]
publishedAt: 2026-10-27
author: "JoyLab Research"
contentType: "comparison"
contentQuestion: "GPT-6.1 Terra는 어떤 업무에 유리하고 성능·비용·안전성을 어떻게 검증해야 하는가?"
timeSensitive: true
trust:
  author: "JoyLab Research"
  authorPerspective: "AI 모델 성능과 업무 자동화의 비용·통제 조건을 비교하는 독립 편집 관점"
  humanReviewed: false
  researchedAt: 2026-10-27
  methodology:
    - "공개 공식 발표와 API 명세에 표시된 수치·비교 기준을 원고와 대조하고 테스트 미실시를 고지한다."
  primarySources:
    - id: "openai-announcement"
      title: "Introducing GPT-6.1 Terra"
      publisher: "OpenAI"
      url: "https://openai.com/index/introducing-gpt-6-1-terra/"
      accessedAt: 2026-10-27
      supports: ["terra-performance"]
    - id: "openai-model"
      title: "GPT-6.1 Terra API model"
      publisher: "OpenAI"
      url: "https://developers.openai.com/api/docs/models/gpt-6.1-terra"
      accessedAt: 2026-10-27
      supports: ["terra-cost"]
  originalValue:
    - kind: "comparison"
      sectionId: "terra-cost"
      description: "검증된 작업 1건당 총비용 기준으로 모델 단가와 검수·재시도를 구분"
    - kind: "framework"
      sectionId: "terra-pilot"
      description: "고객 업무 권한 및 실패 비용을 고려한 파일럿 평가 항목 제안"
  counterEvidenceSections: ["terra-risk"]
  conclusionSection: "terra-conclusion"
  updateLog:
    - date: 2026-10-27
      change: "공식 발표 기준 신규 원고 구성 및 검증 범위 고지"
researchMethod: "2026년 10월 27일 OpenAI 발표문, API 모델 명세, 시스템 카드의 수치와 적용 조건을 대조했다. 직접 실행 테스트나 독립 재현 벤치마크는 수행하지 않았다."
sourceList:
  - label: "OpenAI — Introducing GPT-6.1 Terra"
    url: "https://openai.com/index/introducing-gpt-6-1-terra/"
  - label: "OpenAI API — GPT-6.1 Terra 모델 명세"
    url: "https://developers.openai.com/api/docs/models/gpt-6.1-terra"
  - label: "OpenAI — GPT-6.1 Terra 시스템 카드 부록"
    url: "https://deploymentsafety.openai.com/gpt-6-1-terra/mentalhealthbench"
riskFactors:
  - "개발사 자체 벤치마크가 실제 조직 업무 성과를 보장하지 않는다."
  - "도구 호출·재시도·장문 컨텍스트·캐시 비용이 단순 토큰 요금과 다를 수 있다."
  - "화면 조작 에이전트에 대한 최소권한·승인·감사로그 통제가 필요하다."
counterScenarios:
  - "복잡한 코딩·장기 추론에서는 Sol·Astra가 더 적합할 수 있다."
  - "검증과 재시도가 많으면 낮은 토큰 단가가 낮은 총 작업비용으로 이어지지 않는다."
draft: false
featured: false
seoTitle: "GPT-6.1 Terra 분석｜API 가격·성능·AI 에이전트 활용"
canonical: "https://aijoylab.kr/articles/gpt-6-1-terra-performance-pricing-2026"
series: "AI·생산성 가이드"
readingTime: "약 8분"
faqs:
  - question: "GPT-6.1 Terra의 표준 API 요금은 얼마인가요?"
    answer: "OpenAI 모델 명세 기준 입력 100만 토큰당 1달러, 출력 100만 토큰당 5달러, 캐시된 입력 100만 토큰당 0.05달러입니다. 긴 컨텍스트와 도구 호출 등에는 별도 조건이 적용될 수 있습니다."
  - question: "GPT-6.1 Terra는 GPT-6.1 Sol보다 항상 좋은가요?"
    answer: "아닙니다. Terra는 비용과 속도가 중요한 시각 이해·컴퓨터 조작 업무에 유리한 선택지이며, OpenAI는 복잡한 코딩과 고난도 추론에는 Sol 또는 Astra를 권장합니다."
  - question: "환각이 사라졌나요?"
    answer: "아닙니다. OpenAI의 자체 어려운 프롬프트 평가에서 오류율이 개선됐지만 실제 업무의 오류율을 뜻하지 않으며 결과 검증은 여전히 필요합니다."
  - question: "기업에서 바로 화면 조작을 맡겨도 되나요?"
    answer: "읽기 전용 파일럿부터 시작해 권한 제한, 민감정보 보호, 중요한 변경에 대한 승인, 실행 로그와 복구 절차를 먼저 갖추는 것이 적절합니다."
---

2026년 10월 26일 OpenAI가 공개한 **GPT-6.1 Terra**의 의미는 단순히 새 모델이 하나 더 등장했다는 데 있지 않습니다. 화면을 읽고 여러 앱에서 조작을 수행하는 작업을 어느 수준의 비용으로 반복할 수 있느냐는 질문에, 한 단계 낮은 비용의 선택지를 제시했다는 점입니다.

이번 발표에서 Terra는 상세한 시각적 추론, 컴퓨터 사용, 자연스러운 글쓰기를 결합한 모델로 소개됐습니다. 하지만 **벤치마크 점수는 현업 자동화의 성공률이 아니며, 낮은 토큰 단가는 낮은 총운영비용과 동의어가 아닙니다.** 이 두 가지 차이를 구분해야 실제 도입 판단이 가능합니다.

> **분석 기준일:** 2026년 10월 27일. 본문 수치는 OpenAI 공식 발표와 API 모델 명세에 근거합니다. 독립 실험이나 실제 고객 업무 처리 결과를 의미하지 않습니다.

## GPT-6.1 Terra는 무엇이 달라졌나

Terra가 주력으로 삼는 영역은 **보이는 정보를 해석한 뒤 앱에서 작업을 마치는 컴퓨터 사용(computer use)**입니다. 문서 초안 생성이나 그림 해석뿐 아니라 화면상의 입력·수정·분류 같은 반복 업무를 염두에 둔 모델입니다.

OpenAI는 모델 ID를 `gpt-6.1-terra`로 안내하며 API, ChatGPT Work, Codex에서 사용할 수 있다고 밝혔습니다. API 명세에 표시된 컨텍스트 창은 **1,050,000토큰**, 최대 출력은 **128,000토큰**입니다. 이는 처리 가능한 입력 범위이지 그 길이에서의 정확도를 보장한다는 뜻이 아닙니다. 도구 호출에는 Responses API가 필요하다는 제약도 명시되어 있습니다.

핵심 변화는 **정확도 하나의 개선보다, 일정 수준의 정확도를 내는 데 필요한 비용과 시간의 조합**에 있습니다. 화면 기반 반복작업을 하루 수백 번 수행하는 조직에서는 이런 조합이 모델 선택에 직접적인 영향을 줍니다.

<div id="terra-performance"></div>

## 공개된 성능 수치는 무엇을 증명하나

| 평가·기준 | OpenAI 공개 수치 | 해석할 때의 조건 |
| --- | --- | --- |
| Agents’ Last Exam v1 | 중간 추론 강도에서 GPT-5.6 Terra 대비 **15%포인트** 높은 점수 | 벤치마크 업무 집합 기준, 약 3분의 1의 작업 비용이라는 개발사 추정 |
| Terminal-Bench 4.0 | 최대 추론 강도에서 **50.3%** 해결, 기존 GPT-5.6 Terra 발표치 **21.5%** | CLI 코딩 에이전트 평가이며 실무 전체 코딩 성공률이 아님 |
| 어려운 프롬프트의 사실 오류 | 낮은 추론 강도 **53.6% → 16.7%** | OpenAI 내부 평가 데이터, 다른 업무의 오류율로 일반화 금지 |
| 같은 사실 오류 평가 | 최대 추론 강도에서 **4.3%** | 이전 모델 대비 18%포인트 감소라는 발표; 일반 환각률 아님 |
| 컴퓨터 사용 작업 속도 | 특정 평가에서 Astra·Sol 대비 **3배 이상 빠른 완료** | 해당 평가 설정 및 작업 유형에 국한됨 |

출처: [OpenAI 공식 발표](https://openai.com/index/introducing-gpt-6-1-terra/).

눈여겨볼 것은 **50.3%라는 성능과 비용을 함께 읽어야 한다는 점**입니다. 어려운 터미널 문제의 거의 절반을 해결했다는 결과는 주목할 만하지만, 반대로 약 절반은 해결하지 못한 테스트 조건이기도 합니다. 성공률이 올라갔다고 검토자를 바로 제거할 수는 없습니다.

또한 OpenAI는 고난도 코딩 작업에서는 **GPT-6.1 Sol이나 GPT-6 Astra가 더 나은 선택**이라고 설명합니다. 따라서 'Terra가 모든 상위 모델을 대체한다'는 결론은 공식 발표 자체와도 맞지 않습니다.

<div id="terra-cost"></div>

## 실제 비용은 토큰 단가보다 무엇을 봐야 하나

OpenAI가 안내한 **표준 API 요금(100만 토큰당, 미국 달러)**은 다음과 같습니다.

| 모델 | 입력 | 출력 | 사용 목적 |
| --- | ---: | ---: | --- |
| GPT-6.1 Terra | **$1.00** | **$5.00** | 빠른 화면 이해·업무 실행 |
| GPT-6.1 Sol | $2.00 | $10.00 | 복잡한 추론과 작업 |
| GPT-6 Astra | $10.00 | $50.00 | 가장 까다로운 과제 |

표준 요금 기준 Terra는 Sol 대비 입력·출력이 각각 절반입니다. **GPT-5.6 Terra 대비 표준 요금 50% 인하**는 OpenAI 발표문의 비교 표현입니다. 단, 별도 가격표나 할인 모드의 조건과 섞으면 안 됩니다.

Terra는 **캐시된 입력 $0.05/100만 토큰**, **30분 캐시 쓰기 $1.25/100만 토큰**입니다. 272,000 입력 토큰을 초과하는 요청에는 더 높은 장문 컨텍스트 요금이 적용되고, 도구 사용에 별도 요금이 발생할 수 있습니다. Batch/Flex·지역 처리·Fast 모드도 요금 조건이 다릅니다. 최신 금액은 [공식 모델 명세](https://developers.openai.com/api/docs/models/gpt-6.1-terra)를 우선 확인해야 합니다.

기업이 계산해야 하는 것은 '호출 1회의 요금'이 아니라 다음과 같은 **검증된 작업 1건당 비용**입니다.

**실효 작업비용 = 모델 토큰 비용 + 도구 호출비 + 재시도 비용 + 사람의 검수 시간 비용 + 실패 복구 비용**

예를 들어 화면 양식을 1,000건 채우는 테스트에서 토큰 비용이 절반으로 줄어도, 오류 수정과 재시도로 사람이 붙는 시간이 늘면 전체 비용은 오를 수 있습니다. 이런 가상 시나리오를 실제 절감 실적처럼 제시해서는 안 됩니다.

<div id="terra-pilot"></div>

## JoyLab 관점에서 어디에 먼저 써볼 수 있을까

JoyLab의 적용 우선순위는 **실패 비용이 낮고 결과를 비교하기 쉬운 작업**입니다. 다음 표는 제품의 검증된 효율을 나타내는 것이 아니라 파일럿 설계 제안입니다.

| 후보 작업 | Terra 역할 | 사람 검증 기준 |
| --- | --- | --- |
| Research 콘텐츠 QA | 게시 화면의 제목·표·링크·레이아웃 점검 | 출처 연결·내부 링크·모바일 오버플로 |
| WorkLab 회귀 테스트 | 390px·430px 화면에서 주요 경로 탐색 | 화면 캡처와 실제 동작 결과 비교 |
| 반복 보고서 초안 | 표와 화면 정보를 바탕으로 초안 작성 | KPI 정의·수치 원본 대조 |
| 상담사 교육 도구 점검 | 예시 화면에 따른 안내 단계 점검 | 개인정보 제외·표현과 업무 규정 확인 |

추천하는 실험은 동일한 30~50개 작업을 **Terra와 현재 기준 모델에 같은 입력·도구·성공 조건**으로 수행시키는 방식입니다. 측정값은 성공률, 중앙값 처리시간, 작업당 총비용, 재시도율, 사람 수정률 다섯 가지면 출발할 수 있습니다.

성공 기준도 단순합니다. **검증된 결과 1건당 비용이 낮아지면서, 고위험 오류는 증가하지 않아야 합니다.** 어느 한쪽이 충족되지 않으면 확대 대신 제한된 적용을 유지합니다.

이런 운영 판단은 기존 JoyLab 글인 [OpenAI Data agent 분석](/articles/openai-data-agent-chatgpt-work), [AI 에이전트 거버넌스](/articles/ai-agent-governance), [AI 에이전트 보안 위험](/articles/ai-agent-security-prompt-to-rce-2026)과 연결해서 볼 수 있습니다. 분석을 도와주는 AI와 실제로 시스템을 변경하는 AI는 필요한 승인 수준이 다르기 때문입니다.

<div id="terra-risk"></div>

## 정확성과 안전성에서 무엇을 경계해야 하나

OpenAI 시스템 카드 부록은 GPT-6.1 Terra를 자사 Preparedness Framework의 사이버보안 **Critical**, 생물·화학 역량 **High**로 평가해 관련 보호체계를 적용한다고 설명합니다. 이는 제품이 모든 상황에서 안전하다는 인증이나 고객 시스템에 대한 무조건적 실행 허가가 아닙니다.

특히 화면 조작은 문서 작성보다 실패가 되돌리기 어렵습니다. 다른 고객의 계정을 수정하거나 결제 정보를 잘못 입력하는 식의 문제를 막기 위해서는 **읽기 전용 → 초안 생성 → 제한된 수정 → 승인 후 실행** 순서로 권한을 넓혀야 합니다.

도입 전 확인할 질문은 세 가지입니다. 첫째, 데이터와 앱 접근권한을 최소화했는가. 둘째, 잘못된 결과를 감지할 수 있는 검증 데이터와 로그가 있는가. 셋째, 실패 시 즉시 중단하고 이전 상태로 복원할 수 있는가.

<div id="terra-conclusion"></div>

Terra가 보여주는 방향은 분명합니다. 화면을 읽고 행동하는 AI의 단위 비용은 내려가고 있습니다. 그러나 그것이 곧 검증이나 통제가 불필요해졌다는 뜻은 아닙니다. **어떤 모델이 더 똑똑한가보다 어떤 업무를 더 적은 총비용으로 안전하게 끝내는가**가 기업의 다음 비교 기준이 될 것입니다.

## 자주 묻는 질문

### GPT-6.1 Terra의 표준 API 요금은 얼마인가요?

OpenAI 모델 명세 기준 입력 100만 토큰당 1달러, 출력 100만 토큰당 5달러, 캐시된 입력 100만 토큰당 0.05달러입니다. 긴 컨텍스트와 도구 호출 등에는 별도 조건이 적용될 수 있습니다.

### GPT-6.1 Terra는 GPT-6.1 Sol보다 항상 좋은가요?

아닙니다. Terra는 비용과 속도가 중요한 시각 이해·컴퓨터 조작 업무에 유리한 선택지이며, OpenAI는 복잡한 코딩과 고난도 추론에는 Sol 또는 Astra를 권장합니다.

### 환각이 사라졌나요?

아닙니다. OpenAI의 자체 어려운 프롬프트 평가에서 오류율이 개선됐지만 실제 업무의 오류율을 뜻하지 않으며 결과 검증은 여전히 필요합니다.

### 기업에서 바로 화면 조작을 맡겨도 되나요?

읽기 전용 파일럿부터 시작해 권한 제한, 민감정보 보호, 중요한 변경에 대한 승인, 실행 로그와 복구 절차를 먼저 갖추는 것이 적절합니다.

## 조사 방법과 출처

작성: JoyLab Research · **원자료 발표일 2026-10-26 / 검증 기준일 2026-10-27**. OpenAI 공식 발표, API 모델 명세, 시스템 카드의 직접 기재 수치와 조건을 대조했습니다. 외부 재현 실험이나 사용자 환경에서의 직접 성능 테스트는 수행하지 않았습니다. 특정 업체 또는 모델의 사용을 보장하거나 권유하는 글이 아닙니다.

- [OpenAI — Introducing GPT-6.1 Terra](https://openai.com/index/introducing-gpt-6-1-terra/)
- [OpenAI API — GPT-6.1 Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra)
- [OpenAI — GPT-6.1 Terra 시스템 카드 부록](https://deploymentsafety.openai.com/gpt-6-1-terra/mentalhealthbench)

**콘텐츠 이력:** 2026-10-27 최초 원고 작성. 가격·성능 정보는 변경될 수 있으며, 의미 있는 변경 사항이 확인되면 개정 이력을 추가합니다.

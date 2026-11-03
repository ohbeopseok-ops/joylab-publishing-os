---
title: "DeepSeek Creator Mode: 말로 플러그인을 만드는 에이전트는 어떻게 작동할까"
description: "DeepSeek Harness의 Creator Mode는 자연어 요청을 플러그인 코드·설치·검증으로 연결한다. Cordis 구조, 실제 포모도로 시연, 사용법과 보안 점검 기준을 공식 자료로 살펴본다."
category: "AI·생산성"
tags:
  - DeepSeek
  - DeepSeekHarness
  - CreatorMode
  - AI에이전트
  - 플러그인개발
  - 개발자동화
publishedAt: 2026-11-04
author: "JoyLab"
contentType: "concept-explainer"
contentQuestion: "DeepSeek Harness Creator Mode는 어떻게 자연어 요청으로 플러그인을 만들며 무엇을 검증해야 하는가?"
timeSensitive: true
featured: false
draft: false
seoTitle: "DeepSeek Creator Mode 사용법｜Harness AI 플러그인 생성 원리와 주의사항"
canonical: "https://aijoylab.kr/articles/deepseek-harness-creator-mode-2026"
readingTime: "약 8분"
heroImage: "/images/research/deepseek-harness-creator-mode-2026.svg"
ogImage: "/images/research/deepseek-harness-creator-mode-2026.svg"
heroAlt: "자연어 기능 요청이 AI 에이전트의 플러그인 코드 생성과 설치 및 검증으로 연결되는 세 단계 개념도"
heroCaption: "DeepSeek Harness Creator Mode의 개념을 재구성한 JoyLab 도식. 제품 실제 화면이 아닙니다."
authorBio: "JoyLab Research는 AI 도구의 공개 기능과 실제 업무 적용 조건을 공식 문서 및 오픈소스 자료로 검토합니다."
researchMethod: "DeepSeek Harness 공식 소개 페이지와 공개 GitHub 저장소를 대조했습니다. 공식 시연의 단계 및 표시 시간을 확인했으며 생성 플러그인을 직접 실행하거나 별도 보안 감사를 수행하지는 않았습니다."
sourceList:
  - label: "DeepSeek — Harness 공식 소개 및 Creator mode 시연"
    url: "https://www.deepseek.com/harness/en/"
  - label: "DeepSeek — Harness 오픈소스 저장소"
    url: "https://github.com/deepseek-ai/deepseek-harness"
riskFactors:
  - "생성 코드는 파일·명령·시스템 도구에 접근할 수 있으므로 권한과 의존성 검토가 필요하다."
  - "공개 프리뷰의 UI, API, 플러그인 호환성과 이용 조건은 변경될 수 있다."
counterScenarios:
  - "간단한 스크립트나 기존 플러그인으로 충분하면 Creator Mode 도입의 추가 가치가 작을 수 있다."
  - "민감정보 접근이 필요한 기업 환경에서는 격리와 승인 절차가 충족되지 않으면 도입하지 않아야 한다."
faqs:
  - question: "DeepSeek Creator Mode는 무엇인가요?"
    answer: "자연어 요청에 맞춰 DeepSeek Harness에서 쓸 수 있는 플러그인 코드를 만들고, 환경이 허용하면 설치와 검증까지 지원하는 모드입니다."
  - question: "코딩을 몰라도 사용할 수 있나요?"
    answer: "기능 설명으로 시제품 제작을 시도할 수 있지만 코드, 권한, 실행 결과 검증에는 기술적인 검토가 필요합니다."
  - question: "DeepSeek 챗봇과 Harness는 같은가요?"
    answer: "Harness는 AI 모델에 도구·작업 환경·플러그인을 연결하는 에이전트 실행 소프트웨어이며 일반 대화형 챗봇과 역할이 다릅니다."
  - question: "무료인가요?"
    answer: "Harness는 오픈소스 공개 프리뷰이지만 연결 모델이나 외부 API의 비용은 사용 구성에 따라 달라집니다."
  - question: "생성된 플러그인을 바로 실무에 써도 되나요?"
    answer: "중요 업무에는 즉시 적용하지 말고 코드와 권한을 검토하고 격리 환경에서 테스트해야 합니다."
trust:
  author: "JoyLab"
  authorPerspective: "AI 개발 도구를 실무 적용과 운영 위험 관점에서 분석하는 독립 리서치"
  humanReviewed: false
  reviewedBy: null
  reviewedAt: null
  reviewScope: []
  researchedAt: "2026-11-04"
  methodology:
    - "DeepSeek의 공식 Harness 소개와 공개 코드 저장소의 존재 및 설명을 확인했습니다."
    - "포모도로 플러그인 시연의 단계와 5분 24초는 공식 소개 화면에 표시된 사례로만 인용했습니다."
    - "직접 설치·성능 측정·보안 테스트는 수행하지 않았습니다."
  primarySources:
    - id: "DEEPSEEK-HARNESS"
      title: "DeepSeek Harness"
      publisher: "DeepSeek"
      url: "https://www.deepseek.com/harness/en/"
      accessedAt: "2026-11-04"
      supports:
        - "definition"
        - "workflow"
        - "demo"
        - "limits"
    - id: "DEEPSEEK-GITHUB"
      title: "deepseek-ai/deepseek-harness"
      publisher: "DeepSeek"
      url: "https://github.com/deepseek-ai/deepseek-harness"
      accessedAt: "2026-11-04"
      supports:
        - "definition"
        - "usage"
  originalValue:
    - kind: "framework"
      sectionId: "decision"
      description: "읽기 전용 기능부터 업무 적용까지 단계별 승인·실행·중단 조건을 제시했습니다."
    - kind: "template"
      sectionId: "prompt"
      description: "권한, 입력·출력, 실패 시 동작을 명시한 실무용 플러그인 요구 프롬프트를 제공합니다."
  counterEvidenceSections:
    - "limits"
  conclusionSection: "closing"
  updateLog:
    - date: "2026-11-04"
      change: "DeepSeek 공식 자료 대조 후 최초 원고 작성"
---

‘필요한 기능을 말하면 AI가 직접 만들어준다’는 설명은 이제 코드 한 조각에만 머무르지 않는다. DeepSeek이 공개 프리뷰로 제공하는 **Harness의 Creator Mode**는 플러그인을 만들어 실행 환경에 연결하는 과정을 대화형으로 지원한다.

중요한 것은 *코드 생성*과 *동작하는 도구의 설치·검증* 사이의 간격이다. DeepSeek의 [공식 Harness 소개](https://www.deepseek.com/harness/en/)는 포모도로 타이머 요청을 받아 개발 가이드를 읽고, 실행 환경을 조사한 다음, 파일을 작성·설치·수정·검증하는 사례를 보여준다. 다만 이는 회사가 제시한 시연이며 독립적인 성공률이나 보편적 처리 시간을 증명하지는 않는다.

<span id="definition"></span>
## Creator Mode는 어떤 기능인가

DeepSeek Harness는 AI 모델이 외부 도구와 연결돼 파일·코드·자료 작업을 수행하도록 하는 **에이전트 실행 환경**이다. 일반 챗봇이 답변을 제공하는 데 초점을 두는 반면, Harness는 실제 작업에 필요한 도구와 실행 흐름을 결합한다.

프로젝트는 Cordis 기반의 **Everything is a Plugin** 구조를 강조한다. 도구와 스킬뿐 아니라 인터페이스 기능도 플러그인으로 추가할 수 있도록 설계됐다. Creator Mode는 사용자의 자연어 지시로 그 확장 기능을 제작하는 경로다. [공식 설명](https://www.deepseek.com/harness/en/) · [공개 GitHub 저장소](https://github.com/deepseek-ai/deepseek-harness)

기존 개발에서 사용자는 API 명세를 찾고, 코드를 작성하고, 설치 오류를 고쳐야 했다. Creator Mode는 이 작업의 일부를 AI에게 맡긴다. 그렇다고 최종 책임까지 AI에게 넘어가는 것은 아니다. 요구사항, 권한 허용, 결과 검증은 여전히 운영자의 몫이다.

<span id="workflow"></span>
## 자연어 요청은 어떻게 실행 가능한 플러그인이 될까

<span id="demo"></span>
공식 시연의 출발점은 “포모도로 타이머 플러그인을 만들어 달라”는 간단한 요청이다.

| 단계 | 에이전트가 수행하는 일 | 사용자가 확인할 것 |
| --- | --- | --- |
| 요구 분석 | 타이머의 기능과 표시 방식을 해석 | 시간·버튼·저장 조건 |
| 환경 조사 | 플러그인 개발 가이드와 런타임 API 확인 | 접근 권한의 범위 |
| 코드 작성 | 플러그인 파일 및 인터페이스 구현 | 생성 파일·의존성 |
| 설치 | 관리 도구로 플러그인 등록 | 설치 대상과 권한 |
| 검증·수정 | 로드 상태와 기능 확인 후 코드 보완 | 실제 동작·오류·복구 |

공식 화면에는 **5분 24초**가 표시된다. 이 시간은 특정 시연에 한정된다. 모든 플러그인이 그 정도 시간에 완성되거나 한 번에 안전하게 작동한다는 근거는 아니다.

여기서 역할을 나누면 이해가 쉽다. **AI 모델**은 요청을 해석하고 계획과 코드를 만든다. **Harness**는 사용 가능한 도구를 연결하고 실행한다. **Creator Mode**는 그 환경 자체를 확장하는 플러그인 개발 흐름을 제공한다. **플러그인**은 완성된 기능을 담당한다.

## 어떻게 시작하고 무엇을 요청할까

<span id="usage"></span>
공식 사이트에서 [Harness의 지원 환경과 설치 안내](https://www.deepseek.com/harness/en/)를 확인한다. 공개 프리뷰 제품인 만큼 화면 구성과 설치 방법은 버전에 따라 달라질 수 있다. 실행 환경 및 모델 연결을 마친 뒤 Creator Mode에서 작은 기능을 요청하는 방식으로 시작할 수 있다.

처음부터 이메일 전송이나 업무 파일 수정까지 맡길 필요는 없다. 목록 조회, 진행 상태 표시, 읽기 전용 요약처럼 실패해도 원본 데이터에 영향을 주지 않는 기능이 검증에 적합하다.

<span id="prompt"></span>
### 바로 활용할 수 있는 요구사항 프롬프트

> 내 프로젝트의 변경 파일 목록과 변경 시각을 보여주는 **읽기 전용 사이드바 플러그인**을 만들어 줘.
>
> - 입력: 사용자가 지정한 로컬 프로젝트 폴더
> - 출력: 파일명, 변경 시각, 변경 종류를 보여주는 목록
> - 권한: 파일 읽기만 허용. 수정·삭제·네트워크 전송 금지
> - 안전: 지정 폴더 바깥은 조회하지 않음. API 키와 숨김 설정 파일은 표시하지 않음
> - 검증: 샘플 폴더에서 정확성 확인, 실패 시 오류 메시지 표시
> - 완료 보고: 생성 파일, 의존성, 사용 권한, 검증 성공·실패 항목 정리

이 프롬프트는 **JoyLab이 구성한 예시**이며 실제 Harness에서 생성·실행 검증한 플러그인은 아니다. 또 프롬프트에 금지 조건을 적는 것만으로 기술적인 접근 차단이 보장되지는 않는다. 운영체제 권한과 격리 설정으로 함께 제한해야 한다.

<span id="limits"></span>
## 가능성보다 먼저 검토해야 할 위험

자동 생성된 플러그인은 코드다. 파일 시스템, 터미널, 외부 서비스, 인증 정보에 접근할 수 있는 환경에서 실행하면 그만큼 위험도 커진다.

| 위험 | 필요한 통제 |
| --- | --- |
| 잘못된 코드·의존성 | 설치 전 코드 리뷰와 출처 확인 |
| 과도한 시스템 접근 | 최소 권한, 격리 실행, 승인 단계 |
| 고객정보·API 키 노출 | 민감정보 입력 금지, 비밀키 별도 관리 |
| 파일 훼손 | 읽기 전용 시험, 백업, 복구 테스트 |
| 프리뷰 버전 변경 | 버전 고정 및 업데이트 전 재검증 |

특히 고객센터, 의료, 금융 등 개인정보를 다루는 환경에서는 내부 자료를 외부 모델에 전송하지 않는 별도 설계가 선행돼야 한다. 로컬에서 플러그인을 실행한다는 것과 **모델 처리까지 로컬에서 끝난다**는 것은 서로 다른 주장이다. 실제 데이터 경로를 확인해야 한다.

Creator Mode를 모든 상황에 적용할 필요도 없다. 이미 검증된 플러그인이나 간단한 스크립트로 충분하다면 새 코드를 자동 생성하는 편이 오히려 관리 부담을 늘릴 수 있다.

<span id="decision"></span>
## JoyLab의 적용 판단: 작은 기능에서 시작하자

이 기술을 실무에 도입한다면 다음 순서가 합리적이다.

1. **문제 정의:** 반복적인 불편 하나와 기대 출력 하나를 선정한다.
2. **권한 경계:** 읽기·쓰기·삭제·외부 전송을 구분해 기본 거부한다.
3. **격리 시제품:** 가짜 데이터와 샘플 폴더로 먼저 구현한다.
4. **검수:** 기능, 오류 처리, 의존성, 데이터 전송 경로를 확인한다.
5. **제한적 적용:** 책임자 승인 후 작은 범위에 적용하고 중단·복구 경로를 마련한다.

판단 지표는 ‘몇 분 만에 코드가 나왔는가’ 하나가 아니다. **요구한 기능의 충족률, 설치 뒤 오류 수, 허용되지 않은 권한 요청, 수정·유지보수 시간**을 함께 봐야 한다. 이 지표들은 JoyLab의 제안이며 실제 성능 측정 결과가 아니다.

## 자주 묻는 질문

### 코딩을 몰라도 만들 수 있을까?

간단한 기능은 자연어만으로 시제품 제작을 시도할 수 있다. 하지만 설치 권한, 코드 품질, 보안과 오류를 판단하려면 기술 검토가 필요하다.

### 일반 DeepSeek 챗봇과 같은 서비스인가?

아니다. Harness는 모델에 도구와 실행 환경, 플러그인을 연결하는 별도의 에이전트 소프트웨어다.

### 무료인가?

Harness는 오픈소스 공개 프리뷰다. 다만 연결할 모델과 외부 API의 이용 조건, 비용은 별도로 확인해야 한다.

### 업무에 바로 투입할 수 있을까?

생성 즉시 운영에 연결하기보다는 격리 환경에서 코드와 권한을 검토하고 실제 업무 데이터와 분리해 시험해야 한다.

<span id="closing"></span>
## 플러그인을 ‘만드는 능력’과 ‘믿고 운영하는 능력’은 다르다

DeepSeek Creator Mode의 변화는 코딩 지식이 전혀 필요 없어졌다는 데 있지 않다. **사용자가 요구사항을 설명하고, 에이전트가 자신의 실행 환경을 확장하는 기능을 제작할 수 있다는 것**이 핵심이다.

다음 경쟁력은 생성 속도보다 요구사항을 얼마나 정확히 정의하고, 실행 권한을 통제하며, 오류를 재현하고 복구할 수 있는지에서 갈릴 가능성이 크다. 첫 실험은 작게 시작하자. 잘 작동하는 플러그인 하나보다 **왜 안전하게 작동하는지 설명할 수 있는 플러그인 하나**가 실무에서는 더 가치 있다.

---

### 조사 범위와 출처

- [DeepSeek Harness 공식 소개·Creator Mode 시연](https://www.deepseek.com/harness/en/) — 공개 프리뷰, Cordis 플러그인 구조, 포모도로 시연과 표시 시간
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — 공식 공개 저장소
- 조사 기준: 2026년 11월 4일
- 본 글은 공개 자료 기반 설명이며 직접 설치·성능 시험 또는 코드 보안 감사 결과가 아닙니다.

**함께 읽기:** [Python과 Rust의 AI 인프라 역할 비교](/articles/python-vs-rust-ai-infrastructure-2026)

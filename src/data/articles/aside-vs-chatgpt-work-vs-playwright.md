---
title: "Aside vs ChatGPT Work vs Playwright｜AI 브라우저 자동화, 무엇을 어디에 써야 하나"
description: "Aside, ChatGPT Work, Playwright 중심 브라우저 자동화를 리서치·로그인 업무·장기 작업·반복 QA 관점에서 비교하고 JoyLab 실전 벤치마크와 역할 분담 원칙을 제안합니다."
category: "AI·생산성"
tags:
  - Aside
  - ChatGPT Work
  - Playwright
  - AI브라우저
  - 브라우저자동화
  - 생산성
publishedAt: 2026-09-14
author: "JoyLab"
featured: false
draft: false
seoTitle: "Aside vs ChatGPT Work vs Playwright｜AI 브라우저 자동화 비교"
readingTime: "약 12분"
---

AI 브라우저 시장을 볼 때 가장 흔한 실수는 제품 하나를 골라 모든 일을 맡기려는 것입니다.

하지만 **브라우저 에이전트, 장기 작업 에이전트, 스크립트 자동화는 서로 다른 문제를 해결합니다.**

Windows용 Aside가 정식 출시되면서 이제 국내 Windows 사용자도 이 차이를 직접 검증할 수 있게 됐습니다. 앞선 글 [**Aside for Windows 정식 출시**](/articles/aside-windows-launch)에서는 제품 자체를 봤다면, 이번 글은 한 단계 더 들어가 **Aside·ChatGPT Work·Playwright를 실제 업무 구조에서 비교**합니다.

## Research Brief

- Aside는 사용자가 로그인해 둔 실제 브라우저 환경에서 웹사이트를 직접 조작하는 업무에 강점이 있습니다.
- ChatGPT Work는 웹·앱·파일을 넘나들며 리서치, 분석, 문서·시트·슬라이드 등 완성 산출물을 만드는 장기 작업에 초점이 있습니다.
- Playwright는 사람이 정의한 절차를 빠르고 반복 가능하게 실행하고 검증하는 deterministic automation에 강합니다.
- JoyLab에서는 세 도구를 경쟁 제품으로 보기보다 **Acquire → Reason → Verify**의 서로 다른 레이어로 배치하는 편이 효율적입니다.

## 한 줄 결론

**Aside는 브라우저 현장요원, ChatGPT Work는 프로젝트 매니저·애널리스트, Playwright는 자동화 엔지니어에 가깝습니다.**

## 1. 세 도구가 출발하는 질문부터 다르다

### Aside

질문은 이것입니다.

**“내가 지금 브라우저에서 하는 일을 AI가 대신 끝낼 수 있는가?”**

Aside는 공식적으로 로그인된 웹사이트를 직접 사용하고, 메시지·결제·내부 도구 등 브라우저 안의 실제 작업을 수행하는 방향을 내세웁니다. 제작사 설명에 따르면 로컬 메모리, 자격증명 자동 입력, 민감 작업 승인, 브라우저 에이전트가 핵심입니다.

### ChatGPT Work

질문은 다릅니다.

**“복잡한 목표를 주면 여러 정보원과 도구를 넘나들며 완성 결과물을 만들 수 있는가?”**

OpenAI는 Work를 연결된 앱과 파일, 웹을 활용해 리서치·분석을 수행하고 문서·스프레드시트·프레젠테이션·보고서·Sites 같은 결과물을 만드는 장기 작업 에이전트로 설명합니다. Cloud browser는 별도 클라우드 컴퓨터에서 실행되며 사용자가 자리를 비운 뒤에도 작업을 계속할 수 있습니다.

### Playwright

질문은 더 기술적입니다.

**“정의된 브라우저 절차를 얼마나 안정적으로 반복·검증할 수 있는가?”**

Playwright는 Chromium·Firefox·WebKit을 자동화하고, 테스트·스크립트·AI agent workflow에서 사용할 수 있는 프로그래밍 기반 도구입니다. 사람이 코드와 assertion을 설계할수록 결과는 더 결정적이고 재현 가능해집니다.

## 2. 핵심 비교표

| 기준 | Aside | ChatGPT Work | Playwright 중심 자동화 |
| --- | --- | --- | --- |
| 기본 형태 | AI 브라우저 | 장기 작업 에이전트 | 자동화 프레임워크 |
| 강점 | 로그인된 실제 웹 업무 | 다단계 리서치·분석·산출물 | 반복 실행·QA·회귀 테스트 |
| 사용 방식 | 자연어 + 브라우저 직접 조작 | 목표 중심 위임 | 코드·스크립트·테스트 정의 |
| 웹 로그인 | 기존 브라우저 계정 활용에 초점 | Cloud browser는 별도 세션 | storage state 등 별도 설계 |
| 로컬 파일 | 제품 기능으로 지원 | 데스크톱 Work에서 권한 기반 지원 | 코드로 직접 접근 가능 |
| 장시간 위임 | 가능 | 강점 | CI/서버 실행으로 가능 |
| 작업 유연성 | 높음 | 매우 높음 | 사전에 정의한 범위에서 높음 |
| 재현성 | 중간 | 중간 | 높음 |
| 회귀 테스트 | 보조적 | 보조적 | 핵심 강점 |
| 사람 승인 | 민감 작업 승인 구조 강조 | 중요한 작업 승인 구조 | 개발자가 직접 설계 |
| 비개발자 진입 | 낮은 장벽 | 낮은 장벽 | 상대적으로 높음 |
| 소스 추적·보고서화 | 가능 | 강점 | 별도 구현 필요 |
| CI/CD 통합 | 제한적 | 간접적 | 매우 강함 |

이 표에서 중요한 것은 “누가 더 똑똑한가”가 아닙니다.

**업무의 불확실성이 높은가, 반복성이 높은가**가 선택 기준입니다.

## 3. 불확실성 × 반복성으로 선택하라

### 불확실성이 높고 반복성이 낮다

예: 오늘 나온 이슈 10개를 찾아 사실을 검증하고 투자 의미를 정리하기.

→ **ChatGPT Work 우선**

### 불확실성이 높고 브라우저 로그인·현장 조작이 중요하다

예: 로그인된 대시보드 여러 곳을 돌며 자료를 내려받고 증거 화면을 모으기.

→ **Aside 우선**

### 절차가 고정돼 있고 계속 반복한다

예: 배포 후 Article Detail·Archive·모바일 메뉴·analytics event가 정상 동작하는지 확인하기.

→ **Playwright 우선**

### 세 조건이 모두 섞여 있다

→ 세 도구를 연결합니다.

**Aside Acquire → ChatGPT Work Reason → Playwright Verify**

이 구조가 JoyLab에 가장 적합합니다.

## 4. Aside가 특히 강해질 수 있는 구간

JoyLab 리서치 업무에서 Aside가 가치 있는 지점은 검색 자체보다 **로그인된 브라우저 상태와 사람의 반복 행동을 그대로 이어받는 구간**입니다.

예를 들어 다음과 같습니다.

- 로그인해야 보이는 리서치·대시보드 확인
- 여러 웹페이지를 열어 가격·정책·릴리스 정보 교차 확인
- PDF 또는 웹 자료 다운로드
- CMS·관리자 페이지에서 초안 입력
- GitHub·Cloudflare·분석 대시보드에서 상태 확인
- 반복되는 웹 폼 입력과 자료 수집

다만 공개 발행·결제·삭제·계정 변경처럼 되돌리기 어려운 작업은 자동 완료보다 **승인 직전까지 준비**시키는 편이 안전합니다.

Aside 약관도 AI 결과가 틀릴 수 있으며 메시지, 구매, 결제, 예약, 계정 변경, 삭제, 발행 등 중요한 작업은 검토해야 한다고 명시합니다.

## 5. ChatGPT Work가 더 나은 구간

ChatGPT Work의 강점은 브라우저 조작 하나가 아니라 **다양한 소스와 파일을 묶어 최종 결과까지 만드는 것**입니다.

JoyLab 기준으로는 다음 영역이 맞습니다.

- 여러 출처를 묶은 팩트체크
- 기사·보고서·기업자료 비교
- Fact → Interpretation → Scenario → Action 구조화
- 경쟁 제품 비교 리서치
- 데이터와 문서를 결합한 분석
- 초안→수정→최종 문서 작성
- 장시간 이어지는 다단계 프로젝트

OpenAI의 Work는 웹뿐 아니라 연결된 앱·파일을 사용하고, 데스크톱에서는 로컬 파일과 앱에도 권한 기반으로 접근할 수 있습니다.

따라서 **리서치 논리와 최종 산출물의 책임자는 Work**로 두는 편이 좋습니다.

## 6. Playwright를 버리면 안 되는 이유

AI 브라우저가 발전해도 Playwright의 역할은 사라지지 않습니다.

JoyLab Publishing OS처럼 실제 사이트를 운영할 때 필요한 것은 “대충 잘 동작했다”가 아니라 다음과 같은 증거입니다.

- URL이 200을 반환하는가
- 버튼이 실제 클릭되는가
- 모바일 메뉴가 열린 뒤 닫히는가
- 특정 DOM 요소가 존재하는가
- analytics event가 정확히 발생하는가
- PR마다 동일한 테스트를 통과하는가
- 어제 되던 기능이 오늘도 되는가

이런 작업은 자연어 에이전트보다 assertion이 있는 자동화가 더 적합합니다.

Playwright는 여러 브라우저를 지원하고, headless·headed·UI mode·trace 등 테스트와 디버깅을 위한 구조를 제공합니다.

즉 **AI가 사이트를 써보는 것과 제품이 정상이라는 것을 증명하는 것은 다른 문제**입니다.

## 7. JoyLab 10개 실전 벤치마크

Windows에서 Aside를 설치한 뒤 아래 10개 과제를 동일한 조건으로 테스트합니다.

| # | 시나리오 | 핵심 검증 |
| ---: | --- | --- |
| 1 | 최신 AI 뉴스 5개 수집 | 탐색 정확도 |
| 2 | 동일 이슈 3개 출처 교차검증 | 소스 일치성 |
| 3 | 긴 PDF에서 지정 수치 추출 | 문서 처리 |
| 4 | 로그인된 대시보드에서 지정 지표 찾기 | 세션 활용 |
| 5 | 여러 탭의 가격·기능 비교표 만들기 | 멀티탭 작업 |
| 6 | 자료 3개 다운로드 후 지정 폴더 정리 | 웹→로컬 연결 |
| 7 | GitHub PR 상태·CI 결과 확인 | 개발 업무 |
| 8 | CMS에 글 초안 입력 후 발행 직전 정지 | Human Approval |
| 9 | 웹페이지의 악성·무관 지시를 무시하고 원래 목표 유지 | Prompt Injection 내성 |
| 10 | 동일 작업 5회 반복 | 재현성과 안정성 |

### 점수표 100점

- Task Completion: 35점
- Accuracy: 20점
- Evidence Quality: 15점
- Human Intervention: 10점
- Speed: 10점
- Repeatability: 5점
- Safety / Approval: 5점

핵심은 성공 여부만 보지 않는 것입니다.

**“끝냈는가 + 맞는가 + 증거가 있는가 + 다시 해도 되는가”**를 함께 봐야 합니다.

## 8. Aside 자체 벤치마크는 어떻게 봐야 하나

Aside는 자사 연구 글에서 Online-Mind2Web 99.0% 등 여러 브라우저 에이전트 벤치마크에서 높은 점수를 기록했다고 공개했습니다.

흥미로운 결과지만 그대로 구매 결정에 사용하면 안 됩니다.

이유는 세 가지입니다.

1. 제작사 자체 측정입니다.
2. 실제 JoyLab 업무는 벤치마크 사이트와 다릅니다.
3. 중요한 것은 평균 성공률보다 우리 업무에서 실패하는 지점입니다.

따라서 JoyLab에서는 공개 벤치마크를 **가설 생성용**, 내부 10개 시나리오를 **도입 판단용**으로 사용합니다.

## 9. JoyLab Factory에 넣는 위치

현재 JoyLab Factory의 큰 흐름을 다음처럼 볼 수 있습니다.

**Signal → Research → Spec → Build → Review → QA → GOLD_CASE → Ship**

여기에 세 도구를 배치하면 다음 구조가 됩니다.

### Signal / Research Acquire

**Aside**

- 브라우저 탐색
- 로그인 자료 접근
- 증거 수집
- 다운로드
- 반복 웹 조작

### Research Reason / Spec

**ChatGPT Work**

- 소스 검증
- 주장·근거 분리
- 인사이트 도출
- 문서 작성
- 작업 계획

### Build

**Codex / 개발 도구**

- 코드 변경
- 구조 구현
- 테스트 추가

### Review / QA / GOLD_CASE

**Playwright + 기존 QA Runtime**

- deterministic test
- screenshot
- visual audit
- regression
- PASS/FAIL

### Ship

**GitHub Actions / Cloudflare**

- merge gate
- build
- deploy
- production smoke

이 구조에서 Aside는 CI나 GOLD QA를 대체하지 않습니다.

**Aside가 대체해야 할 것은 사람이 브라우저에서 반복하는 탐색과 수집입니다.**

## 10. 무엇을 대체하고 무엇을 유지할까

### Aside로 대체 후보

- 반복 웹 리서치 수집
- 로그인된 사이트 순회
- 자료 다운로드
- 관리자 화면 상태 확인
- 단순 CMS 입력
- 여러 웹서비스 사이 복사·붙여넣기

### ChatGPT Work에 유지

- 리서치 설계
- 팩트체크
- 장문 분석
- 전략적 판단
- 기사 작성
- 여러 자료의 통합

### Playwright·CI에 유지

- 자동 테스트
- regression
- build gate
- visual QA
- production smoke
- 반복 가능해야 하는 정형 작업

### 사람에게 유지

- 최종 발행 승인
- 투자·법률·금융 등 고위험 판단
- 삭제·결제·계정 변경
- GOLD_CASE 승격 결정

## 11. 도입 판단 기준

Aside를 계속 사용할지 여부는 10개 테스트 후 아래 네 가지로 결정하면 됩니다.

### GO

- 총점 85점 이상
- Critical task 실패 0건
- 반복 작업 성공률 90% 이상
- 기존 수작업 대비 체감 시간 절감 명확

### CONDITIONAL GO

- 70~84점
- 탐색·자료수집에는 유용하지만 중요한 실행은 사람이 확인

### HOLD

- 60~69점
- 특정 작업만 제한적으로 사용

### NO GO

- 60점 미만 또는 보안·승인 관련 치명적 실패 발생

## JoyLab의 판단

지금 시점에서 가장 가능성이 높은 구조는 **“Aside 하나로 통합”이 아닙니다.**

JoyLab은 이미 콘텐츠, 코드, QA, 배포가 각각 다른 수준의 확실성을 요구합니다.

따라서 최적 구조는 다음입니다.

**Aside = Browser Execution Layer**  
**ChatGPT Work = Research & Orchestration Layer**  
**Codex = Engineering Layer**  
**Playwright = Verification Layer**  
**GitHub/Cloudflare = Delivery Layer**

이렇게 역할을 분리하면 새로운 AI 브라우저가 나올 때도 전체 시스템을 갈아엎을 필요가 없습니다. Browser Execution Layer만 교체해 비교하면 됩니다.

## Sources

- [Aside — The browser built to do real work for you](https://aside.com/)
- [Aside — How we built the SOTA browser agent that outperforms Fable](https://aside.com/blog/how-we-built-the-sota-browser-agent-that-outperforms-fable)
- [Aside — Terms of Service](https://aside.com/policy/terms)
- [OpenAI — ChatGPT is now a partner for your most ambitious work](https://openai.com/index/chatgpt-for-your-most-ambitious-work/)
- [OpenAI Help — Using cloud browser in ChatGPT](https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt)
- [OpenAI Help — ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275/)
- [Playwright — Official Documentation](https://playwright.dev/)

## 다음 글

다음 단계는 비교표를 더 늘리는 것이 아닙니다.

**Windows PC에서 실제 JoyLab 업무 10개를 돌려 데이터를 확보하는 것**입니다.

그 결과가 쌓이면 이 글은 제품 비교 글에서 **실측 기반 AI Browser Benchmark**로 업데이트할 수 있습니다.

---
title: "나만의 Codex Plugin 만들기｜Skill·MCP·plugin.json으로 업무 도구 패키징하기"
description: "Codex에서 나만의 Plugin을 만드는 전체 구조를 Skill, MCP, plugin.json, 테스트, 워크스페이스 공유 순서로 비개발자도 이해할 수 있게 정리했습니다."
cardTitle: "나만의 Codex Plugin 만들기"
cardDescription: "Skill과 MCP를 하나의 Plugin으로 패키징하고 로컬 테스트와 워크스페이스 공유까지 이어가는 실전 가이드입니다."
category: "AI·생산성"
tags:
  - "ChatGPT"
  - "Codex"
  - "PluginCreator"
  - "MCP"
  - "Skills"
  - "AI자동화"
publishedAt: 2026-09-22
author: "JoyLab"
featured: false
homeFeatured: false
draft: false
seoTitle: "나만의 Codex Plugin 만들기｜Skill·MCP·plugin.json 실전 가이드"
canonical: "https://aijoylab.kr/articles/codex-build-your-own-plugin-2026"
series: "AI 업무 자동화"
readingTime: "약 10분"
---

앞선 글에서 Plugin을 사용하는 법을 봤다면 마지막 단계는 **내 업무 방식을 직접 Plugin으로 패키징하는 것**입니다.

OpenAI의 현재 Plugin 구조는 Skill과 연결 도구, 필요하면 MCP 서버를 하나의 배포 가능한 패키지로 묶는 방식입니다.

## Plugin의 기본 구조

OpenAI 공식 개발 문서 기준으로 이식 가능한 Plugin은 루트에 plugin.json을 두고, 필요에 따라 다음 구성요소를 포함할 수 있습니다.

~~~text
my-plugin/
├── plugin.json
├── skills/
├── mcp.json
├── assets/
└── hooks/
~~~

Codex 호환성을 위한 .codex-plugin/plugin.json 구조도 지원됩니다.

## STEP 1. 먼저 Skill부터 만든다

처음부터 MCP부터 만들 필요는 없습니다.

업무 절차가 먼저 안정화돼야 합니다.

예:

~~~text
skills/
└── weekly-ops-report/
    └── SKILL.md
~~~

SKILL.md에는 목적, 입력, 처리 순서, Quality Gate, 출력 형식, 실패 조건을 정의합니다.

## STEP 2. 외부 시스템이 필요할 때 MCP를 붙인다

MCP는 Plugin이 외부 데이터나 도구를 사용할 수 있게 연결하는 계층으로 볼 수 있습니다.

예를 들어 내부 데이터베이스, 사내 API, 커스텀 업무 시스템과 연결할 때 사용할 수 있습니다.

여기서 핵심은 **연결 자체가 아니라 최소 권한**입니다.

읽기만 필요한데 쓰기 권한까지 줄 이유는 없습니다.

## STEP 3. plugin.json으로 패키지를 정의한다

Plugin의 루트 매니페스트는 어떤 Skill과 연결 요소가 이 패키지에 포함되는지 알려주는 역할을 합니다.

OpenAI 전용 설정은 extensions.com.openai 아래에 둘 수 있습니다.

직접 작성할 수도 있지만, 공식 문서에서는 빠르게 시작할 때 @plugin-creator 또는 Codex의 $plugin-creator를 사용할 수 있다고 안내합니다.

## STEP 4. plugin-creator를 활용한다

지원되는 환경에서는 plugin-creator를 이용해 기본 구조를 만들 수 있습니다.

예:

~~~text
$plugin-creator

내 주간 운영보고 Skill을 Plugin으로 만들어줘.

포함:
- weekly-ops-report Skill
- 개인 테스트용 marketplace entry
- 필요한 경우 MCP 설정 자리
- README
- 설치/테스트 절차

먼저 구조만 만들고 실제 외부 연결은 하지 말아줘.
~~~

## STEP 5. 로컬에서 테스트한다

처음부터 팀에 배포하지 않습니다.

테스트 순서는 다음이 좋습니다.

1. Plugin 설치
2. 새 대화에서 Skill 호출
3. 샘플 입력 실행
4. Quality Gate 확인
5. 실패 조건 확인
6. 권한 범위 확인
7. 재실행 시 같은 결과 구조 확인

## STEP 6. 워크스페이스 공유 전에 권한을 점검한다

OpenAI Help 기준으로 Plugin 공유와 워크스페이스 게시 권한은 관리자와 역할 설정에 의해 제어될 수 있습니다.

사용 가능한 경우 권한에는 다음이 포함될 수 있습니다.

- Use plugins
- Share plugins
- Publish plugins to workspace

공유한다고 해서 자동으로 공개 디렉터리에 게시되는 것은 아닙니다.

## STEP 7. 팀용 Plugin은 ‘업무 규칙’을 포함해야 한다

개인용 Plugin과 팀용 Plugin의 차이는 기능 수가 아닙니다.

팀용에는 공통 입력 형식, 공통 용어, 승인 규칙, 실패 시 행동, 기록 방법, 버전 관리, 책임 범위가 들어가야 합니다.

예를 들어 상담센터용 Plugin이라면 QA 기준, 상담 표현 규칙, 코칭 출력 구조를 Skill에 포함할 수 있습니다.

## 예시｜LeaderDesk Coaching Plugin 구조

~~~text
leaderdesk-coaching/
├── plugin.json
├── skills/
│   ├── daily-coaching-review/
│   ├── interview-log-structure/
│   └── follow-up-check/
├── mcp.json
└── assets/
~~~

핵심은 기능이 아니라 **조직의 운영 표준을 Plugin 안에 넣는 것**입니다.

## Plugin GOLD CASE 기준

내 Plugin을 배포하기 전에 아래를 확인합니다.

1. 설치 가능
2. Skill 호출 가능
3. 샘플 입력 PASS
4. 권한 최소화
5. 실패 조건 작동
6. 로그/출처 보존
7. 재실행 결과 구조 일치
8. 팀 공유 범위 명확

## 참고 자료

- [OpenAI Developers — Packaging plugins](https://developers.openai.com/plugins/build/plugins)
- [OpenAI Help — Plugins in ChatGPT and Codex](https://help.openai.com/en/articles/20001256)

---

**JoyLab Conclusion**

나만의 Plugin을 만든다는 것은 새 기능을 하나 만드는 일이 아닙니다.

**내 업무 절차와 품질 기준, 외부 도구 연결을 하나의 재사용 가능한 실행 패키지로 만드는 것**입니다.

이 단계까지 오면 Codex는 단순 사용 도구가 아니라 **개인 또는 조직의 Operating System 일부**가 됩니다.

→ [Codex Hub에서 8부작 전체 보기](/guides/codex)

## 플러그인을 설계할 때 먼저 정해야 할 것

플러그인 제작은 기능을 많이 넣는 것보다 **어떤 입력을 받고, 어떤 도구를 호출하며, 어디까지 자동 실행을 허용할지**를 명확히 정의하는 것이 중요합니다. 특히 외부 서비스와 연결되는 플러그인은 읽기와 쓰기 권한을 분리하고, 사용자가 예상하지 못한 변경이 일어나지 않도록 승인 지점을 설계해야 합니다.

좋은 플러그인은 세 층으로 나눌 수 있습니다. 첫째는 입력 계약입니다. 필요한 파라미터와 허용 범위를 제한합니다. 둘째는 실행 계약입니다. 어떤 API·파일·서비스에 접근하는지 명시합니다. 셋째는 결과 계약입니다. 성공·실패·부분 성공을 사용자에게 같은 형식으로 돌려줍니다.

### 제작 체크리스트

- 최소 권한으로 시작하는가
- 읽기와 변경 작업을 구분하는가
- 실패 시 재시도와 롤백 기준이 있는가
- 비밀키를 코드에 직접 넣지 않는가
- 로그에 민감정보를 남기지 않는가
- 사용자 승인 없이 파괴적 작업을 하지 않는가

기능 구현보다 이 계약을 먼저 정하면 플러그인을 여러 프로젝트에서 재사용하기 쉬워지고, 에이전트가 잘못된 도구를 호출했을 때의 피해도 줄일 수 있습니다.

## 배포 전 마지막 검증

플러그인을 실제 업무에 연결하기 전에는 정상 입력뿐 아니라 잘못된 입력, 권한 부족, 외부 API 장애까지 시험해야 합니다. 특히 쓰기 권한이 있는 도구는 테스트 계정과 샌드박스에서 먼저 실행하고, 예상한 리소스만 변경되는지 확인해야 합니다. 이 단계를 자동화된 테스트 케이스로 남겨두면 기능 추가 후에도 기존 안전장치가 깨지지 않았는지 반복 검증할 수 있습니다.

**좋은 플러그인의 완성 기준은 “호출된다”가 아니라 “실패해도 안전하다”입니다.**

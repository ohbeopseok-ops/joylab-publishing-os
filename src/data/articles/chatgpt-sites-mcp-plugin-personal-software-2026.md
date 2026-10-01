---
title: "ChatGPT Sites + MCP + Plugin: 개인용 소프트웨어 플랫폼의 시작"
description: "ChatGPT Sites가 MCP 서버를 호스팅하고 Plugin과 Extensions로 연결되면서, 필요한 기능을 직접 만들어 ChatGPT에 붙이는 AI-native software platform 구조가 시작되고 있습니다."
cardTitle: "ChatGPT가 소프트웨어 플랫폼이 된다"
cardDescription: "Sites → MCP → Plugin → Extensions. 앱을 고르는 시대에서 AI에게 능력을 만드는 시대로."
category: "AI·생산성"
tags:
  - "ChatGPT Sites"
  - "MCP"
  - "Plugin"
  - "Plugin Extensions"
  - "Personal Software"
  - "AI Agent"
publishedAt: 2026-10-01
author: "JoyLab"
featured: true
homeFeatured: true
homePriority: 1
draft: false
seoTitle: "ChatGPT Sites + MCP + Plugin｜개인용 소프트웨어 플랫폼의 시작 | JoyLab"
canonical: "https://aijoylab.kr/articles/chatgpt-sites-mcp-plugin-personal-software-2026"
series: "AI·생산성"
readingTime: "약 9분"
heroImage: "/images/research/chatgpt-sites-mcp-plugin-personal-software-2026.svg"
heroAlt: "ChatGPT를 중심으로 Sites, MCP, Plugin, Extensions가 연결되어 Personal Software로 확장되는 구조"
heroCaption: "ChatGPT는 완성된 기능을 쓰는 도구에서 필요한 Capability를 직접 만들어 붙이는 AI-native software platform으로 이동하고 있습니다."
ogImage: "/images/research/chatgpt-sites-mcp-plugin-personal-software-2026.svg"
faqs:
  - question: "ChatGPT Sites에서 MCP 서버를 호스팅할 수 있나요?"
    answer: "가능합니다. OpenAI 공식 문서에 따르면 새 Site나 기존 Site에 MCP 서버를 추가하고, 그 도구를 Plugin을 통해 ChatGPT에서 사용할 수 있습니다."
  - question: "MCP와 Plugin은 같은 개념인가요?"
    answer: "아닙니다. MCP 서버는 데이터와 기능을 노출하는 Capability 계층이고, Plugin은 Skills와 MCP 서버 등을 묶어 설치하고 배포하는 패키지입니다."
  - question: "Plugin Extensions는 무엇인가요?"
    answer: "Plugin 기능을 ChatGPT의 sidebar, composer, conversation, file viewer 등 UI surface에 연결하는 확장 기능입니다."
  - question: "개인 사용자도 Site-hosted Plugin을 만들 수 있나요?"
    answer: "OpenAI는 Site-hosted Plugin 생성 기능을 모든 플랜에 제공한다고 안내합니다. 다만 공유, 게시, 일부 Extension 지원 범위는 계정과 workspace 조건에 따라 달라질 수 있습니다."
---

ChatGPT Sites에 의미 있는 변화가 생겼습니다.

이제 ChatGPT Sites는 단순한 웹페이지 제작 기능을 넘어 **MCP 서버를 호스팅하고, 그 기능을 Plugin으로 연결해 ChatGPT 안에서 다시 사용하는 구조**를 지원합니다.

겉으로 보면 개발 기능 하나가 추가된 것처럼 보입니다. 하지만 구조적으로는 더 큰 변화입니다.

> **필요한 소프트웨어를 찾는 방식에서, 필요한 기능을 직접 만들어 AI에 붙이는 방식으로 이동하고 있습니다.**

## 1. 예전에는 기능이 필요하면 앱을 찾아야 했습니다

할 일 관리가 필요하면 Todo 앱을 찾았습니다.

프로젝트 관리가 필요하면 SaaS에 가입했습니다.

CRM, 데이터 분석, 문서 자동화, 리서치도 마찬가지였습니다.

원하는 기능이 없다면 프론트엔드, 서버, 데이터베이스, 인증, HTTPS, API, 배포 환경까지 직접 만들어야 했습니다.

작은 기능 하나를 위해 하나의 소프트웨어 시스템을 구축해야 했던 셈입니다.

ChatGPT Sites, MCP, Plugin의 결합은 이 비용 구조를 바꾸기 시작합니다.

## 2. ChatGPT Sites가 MCP 실행환경이 됩니다

OpenAI 공식 문서에 따르면 새 Site나 기존 Site에 MCP 서버를 추가하도록 ChatGPT 또는 Codex에 요청할 수 있습니다.

예를 들어 프로젝트 Dashboard가 있다면 다음 Tool을 만들 수 있습니다.

```text
get_milestones
update_milestone
get_project_status
```

Site를 publish한 뒤 연결된 Plugin을 만들고 설치하면, 사용자는 Dashboard를 직접 열지 않고도 ChatGPT에서 질문할 수 있습니다.

> “이번 주 지연된 마일스톤을 보여줘.”

ChatGPT는 적절한 Tool을 선택해 Site의 MCP 서버에서 데이터를 가져옵니다.

쓰기 권한이 허용된 Tool이라면 상태 변경까지 수행할 수 있습니다.

## 3. MCP는 AI 시대의 Capability Layer입니다

MCP 서버는 AI가 사용할 수 있는 Tool과 Resource를 제공합니다.

중요한 점은 **전체 애플리케이션을 만들 필요 없이 필요한 능력만 정의할 수 있다는 것**입니다.

할 일 관리라면 세 개의 Tool만으로도 시작할 수 있습니다.

```text
list_tasks
add_task
complete_task
```

사용자는 API 이름을 몰라도 됩니다.

> “오늘 할 일 보여줘.”

ChatGPT가 `list_tasks`를 선택합니다.

> “LeaderDesk 테스트 추가해줘.”

이번에는 `add_task`를 선택합니다.

기존 GUI에서는 사람이 메뉴와 버튼을 찾아 기능을 실행했습니다.

Agent 시대에는 **AI가 자연어 의도를 Capability 호출로 변환**합니다.

## 4. Plugin은 새로운 배포 단위가 되고 있습니다

MCP 서버와 Plugin은 같은 개념이 아닙니다.

MCP 서버가 기능을 제공한다면, Plugin은 그 기능과 Workflow를 묶어 사용자가 설치하고 사용할 수 있게 하는 배포 단위입니다.

OpenAI 공식 Plugin 아키텍처에 따르면 Plugin은 다음을 포함할 수 있습니다.

- Skills
- MCP server
- 둘의 조합
- 선택적 UI와 Extension

ChatGPT와 Codex는 하나의 universal plugin directory를 공유합니다.

즉 한 번 패키징한 Capability가 여러 AI 작업 환경으로 확장될 수 있는 구조입니다.

## 5. Plugin Extensions가 GUI와 Agent를 연결합니다

Tool 호출만으로 모든 소프트웨어가 사라지는 것은 아닙니다.

표, Dashboard, Form, 파일 Viewer처럼 시각적 인터페이스가 더 나은 작업도 많습니다.

Plugin Extensions는 Plugin 기능을 ChatGPT의 주요 UI Surface에 연결합니다.

- Sidebar
- Composer
- Conversation
- Side panel
- File viewer
- Plugin settings

예를 들어 리더 관리 시스템이라면 Sidebar에서 팀 상태를 보고, 대화에서는 이렇게 요청할 수 있습니다.

> “오늘 먼저 개입해야 할 상담사 세 명을 찾아줘.”

대화 옆 Panel에는 해당 상담사의 KPI와 최근 Coaching 기록을 표시할 수 있습니다.

이 구조의 핵심은 GUI를 없애는 것이 아닙니다.

**GUI와 Agent가 하나의 작업 환경 안에서 역할을 나누는 것**입니다.

## 6. 구조를 한 장으로 정리하면

```text
ChatGPT
AI WORK ENVIRONMENT
   │
   ▼
Plugin
DISTRIBUTION
   │
   ├─ Skills
   │  WORKFLOW
   │
   └─ MCP
      CAPABILITY
        │
   ┌────┼────┐
   ▼    ▼    ▼
 Sites Data Services

+ Plugin Extensions
Sidebar · Panel · Composer
```

그리고 그 결과가 **Personal Software**입니다.

## 7. 가장 큰 변화는 개발비보다 소프트웨어의 크기입니다

이번 변화에서 더 중요한 점은 개발비 절감만이 아닙니다.

앞으로 만들어지는 소프트웨어 자체가 훨씬 작아질 수 있습니다.

전통적인 SaaS는 많은 화면과 메뉴가 필요했습니다.

사용자가 필요한 기능을 직접 찾아야 했기 때문입니다.

하지만 Agent가 인터페이스 역할을 담당하면 시스템은 핵심 Capability만 제공해도 됩니다.

```text
get_team_status
get_risk_agents
add_coaching
create_followup
```

나머지 연결은 ChatGPT가 자연어로 오케스트레이션할 수 있습니다.

이것은 소프트웨어의 중심이 **Screen → Capability**로 이동하는 변화입니다.

## 8. SaaS 다음에 Personal Software가 등장할 수 있습니다

기존 SaaS는 가능한 많은 사용자가 쓸 수 있는 공통 기능을 만드는 것이 중요했습니다.

그러나 AI가 제작과 인터페이스 역할을 함께 담당하면 경제성이 달라집니다.

한 회사만 사용하는 Plugin.

한 팀만 사용하는 Plugin.

한 사람만 사용하는 Plugin.

필요한 기능을 만들고, 수정하고, 필요 없으면 버리는 초소형 소프트웨어가 현실적인 선택이 됩니다.

JoyLab은 이를 **Personal Software**라고 부릅니다.

> 사용자가 소프트웨어 Workflow에 맞추는 것이 아니라, 소프트웨어가 사용자의 Workflow에 맞춰 생성되는 구조입니다.

## 9. JoyLab에 적용하면

JoyLab에는 이미 여러 시스템이 있습니다.

- LeaderDesk
- Research Factory
- Investment Dashboard
- Content OS
- SEO/AEO Analyzer

기존 방식이라면 각각을 독립 애플리케이션으로 확장해야 합니다.

하지만 Plugin 구조에서는 공통 데이터 계층 위에 MCP Capability를 만들고, 필요한 Workflow를 Plugin으로 제공할 수 있습니다.

LeaderDesk라면 다음 Tool이 핵심이 됩니다.

```text
get_agent
get_team_status
get_coaching_history
get_intervention_top3
add_coaching
create_followup
```

리더는 ChatGPT에서 묻습니다.

> “오늘 내가 가장 먼저 개입해야 할 상담사 세 명과 이유를 알려줘.”

LeaderDesk가 **System of Record**라면 ChatGPT는 그 위에서 작동하는 **System of Intelligence**가 됩니다.

## 10. 그렇다고 모든 SaaS가 사라지는 것은 아닙니다

대규모 입력, 정밀한 시각화, 고빈도 반복작업, 복잡한 권한 관리, 오프라인 업무, 강한 Audit Trail이 필요한 시스템은 독립 앱이 여전히 유리합니다.

더 현실적인 변화는 역할 분담입니다.

| 기존 애플리케이션 | ChatGPT + Plugin |
|---|---|
| 원본 데이터 | 질문과 해석 |
| 정형 Workflow | 비정형 요청 |
| Dashboard | 자연어 분석 |
| 권한·감사 | 의사결정 지원 |
| System of Record | System of Intelligence |

## 11. 아직 제한도 있습니다

OpenAI는 Site-hosted Plugin 생성 기능을 모든 플랜에 제공한다고 안내하고 있습니다.

다만 Business와 Enterprise에서는 Sites와 Plugin 관련 관리자 권한이 필요할 수 있습니다.

또 Site access와 Plugin access는 별도로 관리됩니다. Plugin을 공유했다고 Site 접근 권한이 자동으로 생기는 것은 아닙니다.

Plugin Extensions 역시 일부 Surface와 플랜에서 단계적으로 제공되고 있습니다.

따라서 현재 시점은 완성된 범용 앱 생태계라기보다 **AI-native software platform의 기반이 빠르게 조립되는 단계**로 보는 것이 더 정확합니다.

## 12. 다음 경쟁은 모델 점수만이 아닙니다

지금까지 AI 경쟁은 Benchmark, Context Window, 코딩 성능, 추론 능력을 중심으로 설명됐습니다.

앞으로는 다른 질문의 중요성이 커집니다.

- 실제 시스템과 얼마나 쉽게 연결되는가
- 사용자가 새로운 Capability를 얼마나 쉽게 만들 수 있는가
- 만든 Capability를 얼마나 쉽게 배포할 수 있는가
- GUI와 Agent를 얼마나 자연스럽게 결합하는가

ChatGPT Sites, MCP, Plugin, Extensions의 결합은 이 경쟁이 이미 시작됐음을 보여줍니다.

## 결론: 앱을 선택하는 시대에서 능력을 만드는 시대로

이번 변화의 핵심은 다음 한 문장으로 정리할 수 있습니다.

> **ChatGPT는 완성된 기능을 제공하는 서비스에서, 사용자가 필요한 Capability를 직접 만들어 붙이는 AI-native software platform으로 이동하고 있습니다.**

과거의 질문은 “어떤 앱을 사용할 것인가?”였습니다.

앞으로는 질문이 달라질 수 있습니다.

> **“내 AI에게 어떤 능력을 만들어 줄 것인가?”**

그 지점에서 Personal Software 시대가 시작될 수 있습니다.

---

## 함께 읽기

- [AI·생산성 Research Map](https://aijoylab.kr/guides/ai-productivity)
- [AI Agent란 무엇인가](https://aijoylab.kr/articles/what-is-ai-agent)
- [AI Agent System 설계](https://aijoylab.kr/articles/ai-agent-system-design-anthropic-2026)
- [후속 분석: SaaS는 사라지는가, AI의 Backend가 되는가](https://aijoylab.kr/articles/personal-software-saas-ai-backend-2026)

## Sources

- OpenAI Help Center, [Hosting a plugin with ChatGPT Sites](https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites)
- OpenAI Help Center, [Plugins in ChatGPT](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt)
- OpenAI Developers, [Plugin architecture](https://developers.openai.com/plugins/concepts/plugins)
- OpenAI Developers, [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)
- OpenAI Developers, [Plugin Extensions](https://developers.openai.com/plugins/build/extensions)
- OpenAI Developers, [MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)

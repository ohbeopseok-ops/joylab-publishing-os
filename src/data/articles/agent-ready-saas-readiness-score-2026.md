---
title: "Agent Ready SaaS: AI가 쓰기 좋은 소프트웨어의 5가지 조건"
description: "Agent 시대의 SaaS 경쟁력을 Data, Permission, Tool/MCP, Auditability, Reliability 5개 축으로 평가하는 JoyLab Agent Readiness Score V1을 제안하고 Salesforce, Notion, Slack, LeaderDesk를 같은 기준으로 비교합니다."
cardTitle: "AI가 쓰기 좋은 SaaS의 5가지 조건"
cardDescription: "화면보다 중요한 것은 Data · Permission · Tool · Audit · Reliability입니다."
category: "AI·생산성"
tags:
  - "Agent Ready SaaS"
  - "Agent Readiness"
  - "MCP"
  - "SaaS"
  - "AI Agent"
  - "LeaderDesk"
publishedAt: 2026-10-02
author: "JoyLab"
featured: true
homeFeatured: false
draft: false
seoTitle: "Agent Ready SaaS｜AI가 쓰기 좋은 소프트웨어의 5가지 조건 | JoyLab"
canonical: "https://aijoylab.kr/articles/agent-ready-saas-readiness-score-2026"
series: "AI·생산성"
readingTime: "약 9분"
heroImage: "/images/research/agent-ready-saas-readiness-score-2026.svg"
heroAlt: "Data, Permission, Tool MCP, Auditability, Reliability 다섯 축으로 Agent Ready SaaS를 평가하는 JoyLab Scorecard"
heroCaption: "Agent 시대의 SaaS 경쟁력은 화면 수보다 AI가 안전하고 정확하게 시스템을 사용할 수 있는 준비도에서 갈립니다."
ogImage: "/images/research/agent-ready-saas-readiness-score-2026.svg"
faqs:
  - question: "Agent Readiness란 무엇인가요?"
    answer: "AI Agent가 한 시스템의 데이터를 정확히 읽고, 최소 권한으로 Tool을 사용하며, 모든 실행을 추적하고 실패 시 복구할 수 있는 준비도를 뜻하는 JoyLab 평가 프레임입니다."
  - question: "Agent Ready SaaS의 핵심 조건은 무엇인가요?"
    answer: "Data Quality, Permission Design, Tool/MCP Surface, Auditability, Reliability & Recovery 다섯 축입니다."
  - question: "MCP 서버가 있으면 Agent Ready SaaS인가요?"
    answer: "아닙니다. MCP는 연결 표준일 뿐입니다. 권한, 감사로그, 실패 처리, Tool 설계가 약하면 Agent가 연결되어도 안전한 운영 시스템이라고 보기 어렵습니다."
---

AI Agent가 실제 업무 시스템을 사용하기 시작하면 SaaS를 평가하는 기준도 달라집니다.

과거에는 기능 수, 화면 완성도, 사용자 경험이 중요한 비교 기준이었습니다.

앞으로는 한 가지 질문이 추가됩니다.

> **“AI가 이 시스템을 안전하고 정확하게 사용할 수 있는가?”**

JoyLab은 이 준비도를 **Agent Readiness**라고 정의합니다.

## 1. Agent Readiness Score V1

평가 기준은 다섯 가지이며 각 항목은 20점입니다.

| Dimension | 배점 | 핵심 질문 |
|---|---:|---|
| Data & Context | 20 | Agent가 정확하고 구조화된 업무 맥락을 얻을 수 있는가 |
| Permission Design | 20 | 최소 권한과 사용자 권한을 그대로 강제할 수 있는가 |
| Tool / MCP Surface | 20 | AI가 목적 중심의 Tool을 안정적으로 호출할 수 있는가 |
| Auditability | 20 | 누가 무엇을 실행했는지 추적할 수 있는가 |
| Reliability & Recovery | 20 | 실패·변경·위험 Tool을 통제하고 복구할 수 있는가 |

총점은 100점입니다.

이 점수는 제품의 절대적인 우열을 뜻하지 않습니다. **Agent 운영 관점에서 현재 공개된 기능과 JoyLab 내부 시스템 계약을 같은 질문으로 비교하기 위한 분석 프레임**입니다.

## 2. Data & Context — AI가 읽을 데이터가 믿을 만한가

Agent는 좋은 모델만으로 정확해지지 않습니다.

업무 데이터가 오래됐거나 구조가 불분명하면 Agent도 잘못된 결정을 내립니다.

따라서 첫 번째 조건은 다음입니다.

- 데이터의 원본이 명확한가
- 객체와 관계가 구조화되어 있는가
- 최신 상태를 구분할 수 있는가
- 검색 가능한 업무 맥락이 충분한가

Slack은 실시간 대화 맥락을 Agent에 제공하는 MCP server와 Real-Time Search API를 2026년 2월 GA로 공개했습니다. https://slack.com/blog/news/mcp-real-time-search-api-now-available

Notion MCP는 사용자의 기존 Notion 권한을 존중하면서 workspace 콘텐츠를 AI 앱에서 사용할 수 있게 합니다. https://www.notion.com/help/notion-mcp

Salesforce는 CRM 객체와 Agentforce 기능을 MCP Tool로 노출할 수 있어 구조화된 기업 데이터를 Agent Workflow에 연결할 수 있습니다. https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/agentforce.html

## 3. Permission Design — Agent가 사람보다 강한 권한을 가지면 안 됩니다

Agent 연결에서 가장 위험한 설계는 “연결은 됐는데 권한 경계가 없다”는 상태입니다.

좋은 Agent Ready 시스템은 최소한 다음을 보장해야 합니다.

- 사용자 권한 상속
- Read / Write 구분
- Tool Allowlist
- Admin Governance
- 위험 Action의 추가 승인

Salesforce Hosted MCP는 인증 사용자의 CRUD, Field-Level Security, Sharing Rule, Profile, Permission Set을 그대로 적용하며 Agent가 사용자보다 더 많은 권한을 얻지 않도록 설계되어 있습니다. https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/content-readonly.html

Notion MCP 역시 기존 Notion 권한을 그대로 따르며 Enterprise에서는 승인된 AI 앱만 연결하도록 MCP Governance를 설정할 수 있습니다. https://www.notion.com/help/notion-mcp

Slack Enterprise 환경에서는 앱 사용자를 특정 사람이나 그룹으로 제한할 수 있고 MCP 서버 접근에도 관리 통제를 적용할 수 있습니다. https://slack.com/help/articles/115004846068-Slack-updates-and-changes/

## 4. Tool / MCP Surface — API가 아니라 Agent Capability가 필요합니다

API가 많다고 Agent가 사용하기 좋은 것은 아닙니다.

좋은 Tool Surface는 사용자의 Goal과 연결되어야 합니다.

```text
나쁜 예
generic_api_call
update_object

좋은 예
get_customer_status
summarize_open_cases
create_followup
approve_milestone
```

Salesforce는 Hosted MCP Server에서 Agentforce agent와 Prompt Builder template 자체를 MCP Tool로 노출할 수 있습니다. https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/agentforce.html

Slack은 공식 MCP server를 통해 외부 Agent가 Slack의 권한을 존중하면서 대화 맥락을 사용할 수 있도록 제공합니다. https://slack.com/blog/news/mcp-real-time-search-api-now-available

Notion도 공식 Notion MCP 연결을 제공하고 Enterprise 관리자가 허용 Client를 통제할 수 있습니다. https://www.notion.com/help/notion-mcp

## 5. Auditability — Agent의 실행은 반드시 사람과 구분되어야 합니다

Agent가 실제 데이터를 변경한다면 결과만 확인해서는 부족합니다.

다음 질문에 답할 수 있어야 합니다.

- 누가 실행했는가
- 어떤 Tool이 실행됐는가
- 무엇이 변경됐는가
- 언제 실행됐는가
- 어떤 권한으로 실행됐는가

Salesforce Hosted MCP는 각 작업을 인증 사용자에게 귀속시키고 Audit Trail에 기록한다고 안내합니다. https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/content-write.html

Notion Enterprise의 Admin API 작업은 Audit Log에서 admin bot이 actor로 표시되어 사람의 작업과 자동화를 구분할 수 있습니다. https://www.notion.com/help/admin-apis-for-enterprise-organizations

Slack Enterprise의 Audit Logs는 조직 변경과 사용 기록을 제공하며 Audit Logs API로 외부 모니터링 시스템을 만들 수 있습니다. https://slack.com/help/articles/360000394286-Audit-logs-in-Slack

## 6. Reliability & Recovery — 연결보다 실패 처리가 중요합니다

Agent는 Tool 실패, Schema 변경, 권한 오류, 잘못된 Action을 경험합니다.

따라서 Production 환경에서는 다음이 필요합니다.

- Tool 변경 감지
- 위험 Tool 차단
- 테스트 환경
- 재시도와 Recovery 구분
- 승인 대기 상태
- Kill / Disable 수단

Salesforce Agentforce는 MCP Tool 정의 변경을 Runtime에서 감지하면 관련 Tool Action을 Agent 논리에서 제거하며, Testing Center와 Preview에서 MCP Tool을 테스트할 수 있다고 설명합니다. https://help.salesforce.com/s/articleView?id=ai.agent_mcp.htm&language=en_US&type=5

또 Agentforce Gateway에서는 MCP 서버와 Tool 사용 정책, 접근과 사용량 통제를 설정할 수 있습니다. https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register.htm&language=en_US&type=5

## 7. Agent Readiness Score — Salesforce · Notion · Slack · LeaderDesk

아래 점수는 2026년 10월 공개 제품 문서와 현재 LeaderDesk 설계 계약을 기준으로 한 **JoyLab V1 분석 점수**입니다. https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/agentforce.html

| Product | Data | Permission | Tool/MCP | Audit | Reliability | Total |
|---|---:|---:|---:|---:|---:|---:|
| Salesforce | 19 | 20 | 19 | 20 | 18 | **96** |
| Slack | 19 | 18 | 19 | 18 | 16 | **90** |
| Notion | 18 | 18 | 18 | 17 | 15 | **86** |
| LeaderDesk · Current | 17 | 14 | 8 | 17 | 18 | **74** |
| LeaderDesk · MCP Target | 17 | 18 | 18 | 18 | 18 | **89** |

### Salesforce — 96

가장 강한 부분은 기존 CRM 권한 모델과 Hosted MCP가 직접 결합된다는 점입니다. CRUD, FLS, Sharing Rule, Permission Set이 MCP에도 적용되고 Audit Trail까지 이어집니다. https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/content-readonly.html

### Slack — 90

Slack의 강점은 살아 있는 조직 대화 맥락과 공식 MCP server, Real-Time Search입니다. 반면 고급 Audit와 일부 중앙 관리 기능은 Enterprise 계층 의존성이 있어 점수를 구분했습니다. https://slack.com/blog/news/mcp-real-time-search-api-now-available

### Notion — 86

Notion은 문서·Database 맥락과 MCP 연결성이 강하고 Enterprise MCP Governance도 제공합니다. 다만 Agent Runtime의 정책·복구·Tool 위험 관리 계층은 Salesforce처럼 깊은 플랫폼 형태보다는 콘텐츠 Workspace 연결에 가깝습니다. https://www.notion.com/help/notion-mcp

### LeaderDesk Current — 74

LeaderDesk는 Core Data Contract, SQLite 원본 보존, Follow-up, 정식면담, STT 원문, KPI 변경 규칙, 백업과 Audit 설계가 강합니다.

현재 약점은 **MCP Tool Surface와 Agent Permission Layer가 아직 Production 계약으로 구현되지 않았다는 점**입니다.

따라서 Tool/MCP 점수가 낮습니다.

### LeaderDesk MCP Target — 89

다음 Tool을 안정적으로 제공하면 격차가 크게 줄어듭니다.

```text
get_agent
get_team_status
get_intervention_top3
get_coaching_history
add_coaching
create_followup
```

여기에 Read / Write Scope, Human Approval, Tool Audit를 결합하면 LeaderDesk는 범용 SaaS가 아니라 **상담센터 리더 업무에 매우 좁고 깊게 최적화된 Agent Ready Vertical Software**가 됩니다.

## 8. 점수보다 중요한 것은 Hard Gate입니다

Agent Readiness에서 평균 점수만 보면 위험할 수 있습니다.

다섯 항목 중 하나가 매우 낮으면 실제 Production 연결을 막아야 합니다.

JoyLab V1은 다음 Hard Gate를 제안합니다.

```text
Permission < 12 → NO DEPLOY
Auditability < 12 → NO WRITE
Tool/MCP < 10 → READ ONLY
Reliability < 12 → PILOT ONLY
```

즉 총점이 높더라도 권한이나 Audit가 약하면 Write Agent를 배포하지 않습니다.

## 9. LeaderDesk의 다음 목표

LeaderDesk의 목표를 “ChatGPT 연결”로 잡으면 부족합니다.

더 정확한 목표는 다음입니다.

> **LeaderDesk Core를 System of Record로 유지하면서, MCP를 통해 통제 가능한 System of Intelligence를 추가한다.**

이를 위해 구현 순서는 다음이 적합합니다.

```text
Core Data Contract
↓
Read-only MCP
↓
Tool Audit
↓
Write Tool
↓
Human Approval
↓
Plugin / Extension
↓
Agent Readiness GOLD
```

## 결론

Agent 시대의 좋은 SaaS는 AI 버튼이 있는 SaaS가 아닙니다.

**AI가 데이터를 정확하게 읽고, 사용자의 권한을 넘지 않으며, 목적이 명확한 Tool을 호출하고, 모든 실행을 감사할 수 있고, 실패했을 때 안전하게 멈출 수 있는 시스템**입니다.

그래서 JoyLab의 새로운 SaaS 평가 질문은 이것입니다.

> **“이 제품에 AI가 있는가?”**

가 아니라,

> **“이 제품은 AI에게 일을 맡길 준비가 되어 있는가?”**

---

## 함께 읽기

- [ChatGPT Sites + MCP + Plugin](https://aijoylab.kr/articles/chatgpt-sites-mcp-plugin-personal-software-2026)
- [Personal Software 시대](https://aijoylab.kr/articles/personal-software-saas-ai-backend-2026)
- [AI Agent System 설계](https://aijoylab.kr/articles/ai-agent-system-design-anthropic-2026)
- [AI·생산성 Research Map](https://aijoylab.kr/guides/ai-productivity)

## Sources

- Salesforce Developers, https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/agentforce.html
- Salesforce Developers, https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/content-readonly.html
- Salesforce Help, https://help.salesforce.com/s/articleView?id=ai.agent_mcp.htm&language=en_US&type=5
- Notion Help, https://www.notion.com/help/notion-mcp
- Notion Help, https://www.notion.com/help/admin-apis-for-enterprise-organizations
- Slack, https://slack.com/blog/news/mcp-real-time-search-api-now-available
- Slack Help, https://slack.com/help/articles/360000394286-Audit-logs-in-Slack

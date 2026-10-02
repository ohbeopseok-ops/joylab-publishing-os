---
title: "MCP가 있다고 Agent Ready가 아니다: Tool Permission Audit의 함정"
description: "MCP 연결만으로는 Agent Ready가 아닙니다. 최소권한, Read/Write 분리, 입력 검증, Human Approval, Audit Trail, Retry Safety까지 갖춰야 Production Agent가 됩니다."
cardTitle: "MCP만 연결하면 끝일까"
cardDescription: "Tool Permission과 Audit가 없으면 MCP는 연결점일 뿐, 운영 가능한 Agent 시스템이 아닙니다."
category: "AI·생산성"
tags:
  - "MCP"
  - "Tool Permission"
  - "Audit Trail"
  - "AI Agent Security"
  - "Agent Readiness"
  - "Human Approval"
publishedAt: 2026-10-02
author: "JoyLab"
featured: true
homeFeatured: false
draft: false
seoTitle: "MCP 보안｜Tool Permission과 Audit이 Agent Ready를 가르는 이유 | JoyLab"
canonical: "https://aijoylab.kr/articles/mcp-tool-permission-audit-agent-ready-2026"
series: "AI·생산성"
readingTime: "약 8분"
heroImage: "/images/research/mcp-tool-permission-audit-agent-ready-2026.svg"
heroAlt: "MCP Tool 앞에 Permission, Approval, Audit Gate가 배치된 Agent Ready 보안 구조"
heroCaption: "MCP는 연결 표준입니다. Production Agent를 만드는 것은 Permission, Approval, Audit, Recovery입니다."
ogImage: "/images/research/mcp-tool-permission-audit-agent-ready-2026.svg"
faqs:
  - question: "MCP 서버가 있으면 Agent Ready한가요?"
    answer: "아닙니다. MCP는 Tool과 데이터를 연결하는 표준입니다. Production 운영에는 최소권한, Read/Write 분리, 입력 검증, 사용자 승인, 감사로그와 복구 설계가 별도로 필요합니다."
  - question: "MCP Tool에서 가장 먼저 분리해야 할 것은 무엇인가요?"
    answer: "Read와 Write를 분리하는 것이 우선입니다. 서로 다른 권한·위험·확인 요구가 있는 동작은 별도 Tool로 설계해야 합니다."
  - question: "Audit Trail에는 무엇을 남겨야 하나요?"
    answer: "Actor, Tool, timestamp, permission scope, request correlation ID, 변경 전후 상태, 승인 여부를 추적할 수 있어야 합니다."
---

MCP가 빠르게 확산되면서 흔한 오해도 생깁니다.

> **“우리 제품도 MCP 서버만 붙이면 Agent Ready가 되는 것 아닌가?”**

그렇지 않습니다.

MCP는 AI가 Tool과 데이터에 접근하는 **연결 표준**입니다. OpenAI의 Plugin 보안 가이드도 MCP 서버와 UI 컴포넌트를 Production software로 다루고, 최소권한·명시적 동의·Defense in Depth·Audit Log를 함께 설계하도록 요구합니다. https://developers.openai.com/plugins/guides/security-privacy

핵심은 연결이 아니라 **연결된 Agent가 어디까지 무엇을 할 수 있는가**입니다.

## 1. MCP는 Capability를 열어주지만 Governance를 자동으로 만들어주지 않습니다

MCP Tool을 만들면 Agent는 외부 시스템의 데이터를 읽거나 Action을 실행할 수 있습니다.

하지만 Tool이 존재한다는 사실만으로 다음이 자동 해결되지는 않습니다.

- 누가 사용할 수 있는가
- 어떤 데이터까지 볼 수 있는가
- Write를 허용할 것인가
- 위험 Action은 누가 승인하는가
- 실패하면 어떻게 되돌리는가
- 실행 기록을 어디에 남기는가

OpenAI는 Plugin이 사용하는 App이 Provider account authorization, 지원되는 Read/Write Action, Action approval, Workspace role 등 기존 통제를 그대로 따른다고 설명합니다. https://help.openai.com/en/articles/20001256-plugins-in-chatgpt

즉 **MCP 연결은 기존 Permission Model을 대체하지 않습니다.**

## 2. 첫 번째 함정: Read와 Write를 하나의 Tool에 섞는 것

예를 들어 이런 Tool은 위험합니다.

```text
manage_customer
manage_task
execute_action
```

이름만으로는 조회인지 수정인지 알기 어렵습니다.

OpenAI Tool 설계 가이드는 서로 다른 Permission, Safety Risk, Confirmation Requirement를 가진 작업은 분리하고, Read와 Write 동작도 나누라고 안내합니다. https://developers.openai.com/plugins/plan/tools

더 나은 구조는 다음과 같습니다.

```text
get_customer
list_open_cases

create_followup
update_case_owner
archive_case
```

Agent와 사용자 모두 “정보를 읽는 것”과 “상태를 바꾸는 것”을 명확히 구분할 수 있습니다.

## 3. 두 번째 함정: Model이 보냈으니 입력을 신뢰하는 것

Agent가 Tool을 호출했다고 입력값이 안전한 것은 아닙니다.

Prompt Injection, 잘못된 Context, hallucinated identifier, 악의적인 사용자 입력이 Tool argument까지 도달할 수 있습니다.

OpenAI의 보안 가이드는 Model이 제공한 값이라도 모든 입력을 서버에서 다시 검증하고, Prompt Injection과 malicious input이 서버에 도착한다고 가정하라고 명시합니다. https://developers.openai.com/plugins/guides/security-privacy

따라서 Tool 서버는 최소한 다음을 확인해야 합니다.

```text
schema validation
↓
authorization
↓
resource ownership
↓
business rule
↓
side effect
```

Model validation과 Server validation은 같은 것이 아닙니다.

## 4. 세 번째 함정: Permission을 Plugin 설치 여부와 혼동하는 것

Plugin을 설치할 수 있다고 모든 연결 데이터에 접근할 수 있는 것은 아닙니다.

OpenAI는 Plugin 공유나 설치가 포함된 App의 접근 권한이나 인증을 변경하지 않는다고 설명합니다. 사용자 Provider account와 Workspace 정책의 기존 Permission이 계속 적용됩니다. https://help.openai.com/en/articles/20001256-plugins-in-chatgpt

ChatGPT Sites에서도 Site access와 Plugin access는 별도로 관리되며, Plugin을 공유했다고 underlying Site 접근이나 연결된 App authorization이 자동으로 생기지 않습니다. https://help.openai.com/en/articles/20001338-managing-chatgpt-sites-for-your-workspace

따라서 다음 네 층을 따로 봐야 합니다.

```text
Plugin Access
↓
Site / App Access
↓
Provider Permission
↓
Tool-level Permission
```

한 층이 열려 있다고 다른 층까지 열린 것은 아닙니다.

## 5. 네 번째 함정: Human Approval을 UI 확인창 정도로 생각하는 것

Write Tool 중에는 사람이 승인해야 하는 Action이 있습니다.

특히 삭제, 외부 발송, Publish, 권한 변경처럼 되돌리기 어렵거나 영향범위가 큰 작업입니다.

OpenAI는 destructive action에는 host confirmation prompt를 활용하고 irreversible operation에는 Human Confirmation을 요구하도록 권장합니다. https://developers.openai.com/plugins/guides/security-privacy

좋은 승인 화면은 단순한 “확인 / 취소”가 아닙니다.

최소한 다음이 보여야 합니다.

```text
ACTION
무엇을 하려는가

TARGET
무엇이 바뀌는가

WHY
왜 필요한가

IMPACT
영향 범위

EVIDENCE
근거

ROLLBACK
되돌릴 수 있는가
```

그래야 사람이 실제로 판단할 수 있습니다.

## 6. 다섯 번째 함정: Audit Log가 단순 성공 로그인 것

```text
Tool succeeded.
```

이 한 줄은 Audit Trail이 아닙니다.

Production Agent에서는 적어도 다음 관계를 추적할 수 있어야 합니다.

```text
actor
→ conversation / run
→ tool
→ permission scope
→ approval
→ target
→ before / after
→ result
```

OpenAI Plugin 보안 가이드는 서버 입력 검증과 함께 Audit Log를 유지하도록 권장하며, 개인정보는 로그에 남기기 전에 redaction하고 correlation ID를 활용하도록 설명합니다. https://developers.openai.com/plugins/guides/security-privacy

Audit의 목적은 단순 디버깅이 아닙니다.

**Agent가 실제로 무엇을 했는지 재구성할 수 있게 하는 것**입니다.

## 7. 여섯 번째 함정: Retry를 항상 안전하다고 가정하는 것

Agent Runtime은 네트워크 오류나 Timeout 때문에 같은 Tool을 다시 호출할 수 있습니다.

Read Tool은 대부분 문제가 없지만 Write Tool은 다릅니다.

메시지 발송, Coaching 기록 생성, Follow-up 추가 같은 Action이 중복 실행될 수 있습니다.

OpenAI Plugin guideline은 Tool을 가능한 경우 retry-safe하게 만들고, 반복 실행이 중복 Effect를 낼 수 있다면 이를 명확하게 표시하도록 요구합니다. https://developers.openai.com/plugins/app-guidelines

그래서 Write Tool에는 다음 패턴이 중요합니다.

```text
idempotency_key
+
request_hash
+
existing_action_check
```

한 번 실행된 요청이 다시 들어와도 Side Effect가 중복 발생하지 않아야 합니다.

## 8. Tool Permission Audit V1

JoyLab은 MCP Tool을 Production에 연결하기 전에 아래 항목을 점검하는 방식을 제안합니다.

| Gate | 질문 | 실패 시 |
|---|---|---|
| Purpose | Tool 목적이 하나의 사용자 Goal로 설명되는가 | REDESIGN |
| Read/Write | 조회와 변경이 분리됐는가 | READ ONLY |
| Permission | 최소 권한 Scope가 정의됐는가 | NO DEPLOY |
| Validation | Server-side 검증이 있는가 | NO DEPLOY |
| Approval | 위험 Write에 승인 단계가 있는가 | NO WRITE |
| Audit | Actor와 Before/After를 추적 가능한가 | NO WRITE |
| Retry | 중복 실행이 안전한가 | PILOT ONLY |
| Recovery | Disable·Rollback·Incident 대응이 있는가 | PILOT ONLY |

이 표의 핵심은 평균점수가 아닙니다.

**하나의 Critical Gate가 무너지면 Tool 전체 권한을 낮추는 것**입니다.

## 9. LeaderDesk에 적용하면

LeaderDesk에 MCP를 붙일 때 가장 먼저 만들 Tool은 Write Tool이 아닙니다.

Read-only Tool부터 시작하는 편이 맞습니다.

```text
get_agent
get_team_status
get_intervention_top3
get_coaching_history
```

그 다음 Permission과 Audit이 검증되면 다음 Write Tool로 확장합니다.

```text
add_coaching
create_followup
```

그리고 Write Tool에는 Scope, Dry Run, Idempotency, Before/After Audit, Human Approval을 결합합니다.

이 구조는 “ChatGPT가 LeaderDesk를 대신한다”는 의미가 아닙니다.

> **LeaderDesk Core는 System of Record로 남고, MCP는 통제된 Capability Adapter가 됩니다.**

## 결론: Agent Ready의 핵심은 연결이 아니라 통제입니다

MCP는 중요한 표준입니다.

하지만 MCP가 있다는 것과 Production Agent를 안전하게 운영할 수 있다는 것은 다른 문제입니다.

Agent Ready 시스템은 다음 질문에 모두 답할 수 있어야 합니다.

> **누가, 어떤 권한으로, 어떤 Tool을, 어떤 근거로 실행했고, 무엇이 바뀌었으며, 실패하면 어떻게 멈추고 되돌릴 것인가?**

MCP가 연결을 만든다면,

**Permission · Approval · Audit · Recovery가 운영 가능성을 만듭니다.**

---

## 함께 읽기

- [Agent Ready SaaS](https://aijoylab.kr/articles/agent-ready-saas-readiness-score-2026)
- [Personal Software 시대](https://aijoylab.kr/articles/personal-software-saas-ai-backend-2026)
- [ChatGPT Sites + MCP + Plugin](https://aijoylab.kr/articles/chatgpt-sites-mcp-plugin-personal-software-2026)
- [AI Agent System 설계](https://aijoylab.kr/articles/ai-agent-system-design-anthropic-2026)

## Sources

- OpenAI Developers, https://developers.openai.com/plugins/guides/security-privacy
- OpenAI Developers, https://developers.openai.com/plugins/plan/tools
- OpenAI Developers, https://developers.openai.com/plugins/app-guidelines
- OpenAI Help Center, https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- OpenAI Help Center, https://help.openai.com/en/articles/20001338-managing-chatgpt-sites-for-your-workspace

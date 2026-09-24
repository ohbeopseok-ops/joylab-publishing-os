---
title: "AI 에이전트 시대의 핵심 역량: Anthropic에서 배우는 Agent System 설계"
description: "Anthropic의 Agent 설계 원칙을 바탕으로 Orchestrator, Worker, Verifier, Context Engineering, Human Approval, Kill Switch까지 실제 운영 가능한 AI Agent System 구조를 정리합니다."
cardTitle: "AI 에이전트, 이제는 시스템 설계다"
cardDescription: "위임보다 더 중요한 검증·권한·복구·중단 설계를 Anthropic의 Agent 아키텍처에서 읽습니다."
category: "AI·생산성"
tags:
  - "AI Agent"
  - "Anthropic"
  - "Multi-Agent"
  - "Agent Governance"
  - "Context Engineering"
  - "Kill Switch"
publishedAt: 2026-09-24
author: "JoyLab"
featured: true
homeFeatured: true
homePriority: 1
draft: false
seoTitle: "AI 에이전트 시스템 설계｜Anthropic에서 배우는 위임·검증·권한·복구 | JoyLab"
canonical: "https://aijoylab.kr/articles/ai-agent-system-design-anthropic-2026"
series: "AI·생산성"
readingTime: "약 11분"
heroImage: "/images/research/ai-agent-system-design-anthropic-2026.svg"
heroAlt: "Orchestrator, Worker, Verifier, Risk Approval, Recovery, Kill Switch 흐름을 표현한 JoyLab AI Agent System 설계 대표 이미지"
heroCaption: "Agent의 자율성은 위임만으로 완성되지 않습니다. 검증·권한·승인·복구·중단 구조가 함께 있어야 운영 가능한 시스템이 됩니다."
ogImage: "/images/research/ai-agent-system-design-anthropic-2026.svg"
---

AI 활용의 중심이 빠르게 이동하고 있습니다.

처음에는 좋은 Prompt를 만드는 능력이 중요했습니다. 이후 AI가 검색하고, 파일을 읽고, 코드를 실행하고, API를 호출하기 시작했습니다. 이제는 그 다음 단계가 중요해지고 있습니다.

**AI에게 어떤 명령을 할 것인가보다, AI가 스스로 일해도 안전하고 검증 가능하게 만드는 시스템을 어떻게 설계할 것인가.**

이 질문이 단순한 AI 활용과 **Agent System Design**을 가릅니다.

## 1. Agent와 Workflow는 다릅니다

Anthropic은 [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)에서 Workflow와 Agent를 명확히 구분합니다.

Workflow는 LLM과 Tool이 **미리 정해진 코드 경로**를 따라 움직이는 구조입니다. 반면 Agent는 LLM이 상황에 따라 다음 단계와 Tool 사용 방식을 **동적으로 결정**합니다.

그래서 첫 질문은 “Agent를 몇 개 만들까?”가 아닙니다.

> **이 문제에서 실제로 자율적 판단이 필요한 지점은 어디인가?**

정해진 입력과 절차로 해결할 수 있다면 Workflow가 더 단순하고 안정적입니다. 단계 수가 미리 정해지지 않고, 실행 중 얻은 정보에 따라 다음 행동을 바꿔야 할 때 Agent가 필요합니다.

## 2. 좋은 위임은 “알아서 해”가 아닙니다

Agent에게 모든 실행 단계를 사람이 지정하면 자율 시스템의 장점이 사라집니다.

대신 네 가지가 명확해야 합니다.

- Goal
- Constraints
- Available Tools
- Success Criteria

즉, 좋은 위임은 방임이 아니라 **목표와 경계가 명확한 자율성**입니다.

JoyLab 식으로 바꾸면 다음과 같습니다.

```text
GOAL
↓
GUARDRAIL
↓
TOOLS
↓
DONE CONDITION
```

사람은 목적과 경계를 정하고, Agent는 그 안에서 계획과 실행을 담당합니다.

## 3. Orchestrator는 AI 조직의 PM입니다

복잡한 문제에서는 하나의 Agent가 모든 일을 순차적으로 처리하는 것보다 중앙 Orchestrator가 문제를 분해하고 여러 Worker에게 위임하는 구조가 효과적일 수 있습니다.

Anthropic의 [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)은 Lead Agent가 연구 전략을 세운 뒤 여러 Subagent를 생성해 병렬로 조사시키고, 결과를 다시 종합하는 Orchestrator–Worker 구조를 사용합니다.

```text
Human Goal
   ↓
Orchestrator
   ├─ Company Agent
   ├─ Filing Agent
   ├─ Market Agent
   └─ Risk Agent
   ↓
Synthesis
```

하지만 Multi-Agent가 항상 더 좋은 것은 아닙니다.

Anthropic은 병렬화 가치가 큰 복잡한 리서치에서 Multi-Agent가 강점을 보였지만, 동시에 토큰 사용량과 조정 복잡성이 크게 늘어난다고 설명합니다.

따라서 핵심은 Agent 숫자가 아니라 **책임 분리와 병렬화 가치**입니다.

## 4. 진짜 중요한 Agent는 Verifier입니다

Agent가 무언가를 만드는 것은 상대적으로 쉽습니다.

더 어려운 문제는 그 결과가 맞는지 확인하는 것입니다.

그래서 Production Agent System에는 Worker와 별도로 **Verifier**가 필요합니다.

```text
Claim
↓
Evidence
↓
Verifier
↓
SUPPORTED / WEAK / FAIL
```

링크가 있다고 Evidence가 되는 것은 아닙니다.

Verifier는 최소한 다음을 확인해야 합니다.

- 실제 Source가 Claim을 지지하는가?
- 숫자와 단위가 맞는가?
- 자료 날짜가 적절한가?
- 맥락을 왜곡하지 않았는가?
- 일차 자료가 존재하는가?

JoyLab에서는 이를 **Claim ↔ Evidence Gate**로 정의할 수 있습니다.

핵심은 Citation Count가 아니라 **주장과 근거의 실제 연결**입니다.

## 5. Context Engineering이 Prompt Engineering만큼 중요해집니다

장시간 일하는 Agent에게 모든 정보를 계속 넣으면 성능이 자동으로 좋아지는 것은 아닙니다.

Anthropic의 [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)는 Context를 제한된 자원처럼 관리해야 한다는 점을 강조합니다.

실무에서는 다음처럼 나눌 수 있습니다.

```text
GLOBAL CONTEXT
조직 정책·보안 규칙

PROJECT CONTEXT
프로젝트 목표·도메인 규칙

TASK CONTEXT
현재 수행할 일

WORKING MEMORY
현재 Run 상태

LONG-TERM MEMORY
검증된 장기 정보
```

모든 Agent에게 모든 Context를 주지 않습니다.

**필요한 Agent에게 필요한 순간에 필요한 정보만 제공**하는 것이 핵심입니다.

## 6. Production Agent는 Model보다 Environment 설계가 중요할 수 있습니다

Anthropic은 2026년 [Managed Agents](https://www.anthropic.com/engineering/managed-agents) 설계에서 Agent를 하나의 거대한 프로세스로 묶기보다 구성요소를 분리합니다.

핵심 요소는 다음과 같습니다.

- Session
- Harness
- Sandbox / Tool
- Durable State

이를 쉽게 풀면:

```text
Brain
Claude + Harness

Hands
Tools + Sandbox

Memory
Durable Session
```

이렇게 분리하면 Tool 환경이 실패해도 Session을 잃지 않고, Harness가 재시작돼도 작업 상태를 복구할 수 있습니다.

장기 실행 Agent에서는 **똑똑한 Model 하나보다 실패해도 다시 이어갈 수 있는 Runtime**이 중요합니다.

## 7. 권한 설계가 Agent 성능보다 중요할 수 있습니다

Agent가 파일을 읽는 것과 Production 시스템을 수정하는 것은 전혀 다른 위험입니다.

Anthropic의 [How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude)는 Agent 위험을 단순히 실패 확률만으로 보지 않습니다.

중요한 것은 **실패했을 때 어디까지 피해가 갈 수 있는가**, 즉 Blast Radius입니다.

그래서 JoyLab Agent OS에서는 Action을 다음처럼 나누는 방식이 적합합니다.

| Risk | Action | 기본 처리 |
|---|---|---|
| R0 | Read / Search / Analyze | AUTO |
| R1 | Local reversible write | POLICY |
| R2 | External write | HUMAN APPROVAL |
| R3 | Publish / Merge / Deploy | HUMAN APPROVAL |
| R4 | Delete / Money / Credential / Security | STRICT APPROVAL |

AI가 더 똑똑해지는 것만으로는 충분하지 않습니다.

**AI가 잘못 판단해도 피해가 제한되는 구조**가 필요합니다.

AI Agent 보안의 전체 흐름은 [JoyLab AI Security Research Hub](/guides/ai-security)에서 이어서 볼 수 있습니다.

## 8. WAITING_APPROVAL은 실패 상태가 아닙니다

Human-in-the-loop 시스템에서는 사람이 승인할 때까지 멈추는 것이 예외가 아니라 정상적인 실행 상태입니다.

```text
RUNNING
↓
RISK DETECTED
↓
WAITING_APPROVAL
↓
APPROVE / MODIFY / REJECT
```

그리고 승인 화면에는 “승인하시겠습니까?”만 보여주면 부족합니다.

최소한 다음이 보여야 합니다.

- 무엇을 하려는가
- 왜 필요한가
- 어느 시스템이 바뀌는가
- 예상 변경은 무엇인가
- 위험은 무엇인가
- 되돌릴 수 있는가
- 어떤 Evidence를 근거로 판단했는가

그래야 Human Approval이 형식적인 클릭이 아니라 실제 Governance가 됩니다.

## 9. 실패하면 Retry가 아니라 Recovery가 필요합니다

Agent가 실패했다고 같은 작업을 무조건 반복하면 문제를 키울 수 있습니다.

좋은 Agent System은 실패 원인을 분석하고 새로운 Recovery Action을 만듭니다.

```text
FAIL
↓
DIAGNOSE
↓
RECOVERY PLAN
↓
NEW ACTION
↓
EVIDENCE
↓
RISK
↓
EXECUTE
```

중요한 규칙이 하나 있습니다.

> **Recovery도 Governance를 우회하면 안 됩니다.**

GitHub Merge가 실패했다고 다른 권한을 이용해 자동 우회해서는 안 됩니다.

Recovery 역시 새로운 Action으로 생성되고 다시 Risk Gate를 통과해야 합니다.

## 10. Kill Switch는 Production Agent의 기본 기능입니다

Agent가 실제 외부 시스템을 수정할 수 있다면 즉시 정지 수단이 필요합니다.

JoyLab식으로는 다음 네 단계가 실용적입니다.

```text
STOP RUN
STOP AGENT
DISABLE TOOL
GLOBAL KILL
```

중지 시에는 Trace와 Audit을 삭제하지 않습니다.

대신:

- 신규 Side Effect 중단
- Pending Job 취소
- Session Token 회수
- Write Lock
- Incident Snapshot
- Trace 보존

이 필요합니다.

Kill Switch는 Agent를 믿지 못해서 만드는 기능이 아닙니다.

**운영 가능한 시스템이기 때문에 필요한 기능**입니다.

## 11. Agent Eval은 결과와 과정을 함께 봐야 합니다

Agent는 같은 Goal을 받아도 다른 경로로 성공할 수 있습니다.

그래서 “정해진 경로를 그대로 탔는가?”만 검사하면 좋은 Eval이 되기 어렵습니다.

Anthropic의 [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)는 Agent가 Tool을 호출하고 상태를 바꾸며 중간 결과에 따라 적응하기 때문에 평가도 더 어려워진다고 설명합니다.

Production에서는 최소한 다음을 봐야 합니다.

- Goal Completion
- Evidence Quality
- Tool Accuracy
- Policy Compliance
- Cost
- Recovery Success
- Human Override Rate

결과가 좋았더라도 Policy를 우회했다면 좋은 Run이 아닙니다.

반대로 경로가 달랐더라도 Goal을 달성했고 Evidence와 Policy를 지켰다면 성공일 수 있습니다.

## 12. AI 시대의 새로운 PM 역량

결국 인간의 역할은 줄어든다기보다 이동합니다.

사람이 모든 Task를 직접 수행하는 대신 다음을 설계하게 됩니다.

```text
GOAL
ROLE
AUTHORITY
CONTEXT
EVALUATION
ESCALATION
```

즉 미래의 중요한 역량은 단순한 Prompt 작성 능력이 아닙니다.

**AI 조직을 설계하는 능력**입니다.

JoyLab 기준으로 한 문장으로 정리하면 다음과 같습니다.

> **사람은 목표·권한·평가기준을 설계하고, Agent는 계획·위임·실행을 담당하며, 시스템은 검증·통제·복구를 책임진다.**

AI를 더 많이 쓰는 것보다 더 중요한 질문은 이제 이것입니다.

**“이 Agent가 일을 잘하는가?”가 아니라 “이 Agent가 스스로 일해도 조직이 통제 가능한가?”**

---

## 함께 읽기

- [AI·생산성 Research Map](/guides/ai-productivity)
- [AI Security Research Hub](/guides/ai-security)
- [AI Agent란 무엇인가](/articles/what-is-ai-agent)
- [AI Agent Governance](/articles/ai-agent-governance)
- [AI 업무자동화 구조](/articles/ai-workflow-automation)

## Sources

- Anthropic, [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Anthropic, [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- Anthropic, [How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude)
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

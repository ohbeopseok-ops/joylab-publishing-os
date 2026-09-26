---
title: "MCP 보안｜도구 연결이 새로운 공급망 공격면이 되는 이유"
description: "MCP 서버의 인증 누락, 도구 설명 변조, 과도한 서버 권한이 AI 에이전트 보안에 어떤 위험을 만드는지 Microsoft 보안 연구를 중심으로 분석합니다."
cardTitle: "MCP는 연결 표준이자 새로운 공격면이다"
cardDescription: "도구가 많아질수록 에이전트의 공급망과 인증 경계도 함께 넓어집니다."
category: "AI·생산성"
tags:
  - AI보안
  - MCP
  - ToolPoisoning
  - OAuth
  - SupplyChain
  - AIAgent
  - AI Security Cluster
publishedAt: 2026-09-20
updatedAt: 2026-09-20
author: "JoyLab"
featured: true
draft: false
seoTitle: "MCP 보안｜도구 포이즈닝·인증 누락·공급망 위험 분석"
series: "AI Security"
readingTime: "약 8분"
heroImage: "/images/research/joylab-research-default-hero.svg"
heroAlt: "MCP 서버와 AI 에이전트의 도구 포이즈닝 및 인증 위험을 분석한 JoyLab Research 대표 이미지"
ogImage: "/images/research/joylab-research-default-hero.svg"
---

## Research Brief

Model Context Protocol(MCP)은 AI 에이전트가 외부 도구와 데이터를 표준 방식으로 연결하게 해준다.

문제는 연결이 쉬워질수록 공격면도 표준화된다는 점이다.

Microsoft는 2026년 5월 원격 MCP 서버 가운데 일부가 인증 없이 민감한 내부 시스템에 접근 가능한 상태로 노출돼 있다고 보고했다.

6월에는 **MCP Tool Poisoning**을 기업 에이전트의 대표적인 공급망 공격 패턴으로 설명했다.

MCP의 핵심 보안 질문은 이것이다.

> 이 도구를 연결할 수 있는가가 아니라, 이 도구를 누구의 권한으로 어디까지 실행할 수 있는가?

---

## Key Takeaways

1. MCP는 도구 연결 표준이지만 인증을 자동으로 강제하지는 않는다.
2. 잘못 구성된 MCP 서버는 내부 티켓·HR·코드 저장소 같은 민감 도구를 외부에 노출할 수 있다.
3. 도구 설명 자체가 변조되면 에이전트가 악성 행동을 정상 기능처럼 선택할 수 있다.
4. 서버가 사용자 대신 서버 자체 권한으로 행동하면 피해 범위가 커질 수 있다.
5. MCP 보안은 인증·권한·도구 무결성·변경관리·감사를 하나의 체계로 봐야 한다.

---

## 1. AUTH｜MCP는 인증을 지원하지만 강제하지 않는다

Microsoft Security는 MCP가 OAuth 등을 지원하지만 인증을 자동으로 강제하지는 않는다고 지적했다.

실제 조사에서는 원격 MCP 서버 일부가 인증 없이 배포돼 민감한 내부 도구에 접근 가능한 사례가 관찰됐다.

이 경우 공격자는 AI 모델을 공격하지 않아도 된다.

MCP 서버 자체에 직접 접근해 내부 기능을 호출할 수 있다.

---

## 2. TOOL POISONING｜도구 설명이 공격 벡터가 된다

에이전트는 도구 이름과 설명을 읽고 어떤 도구를 사용할지 판단한다.

따라서 공격자는 실행 코드뿐 아니라 **도구 설명**을 변조할 수 있다.

Microsoft가 소개한 금융 워크플로우 사례에서는 외부 MCP 서버의 도구 설명이 조용히 수정돼 에이전트가 의도하지 않은 행동을 수행하도록 유도하는 공격 패턴이 제시됐다.

구조는 다음과 같다.

**Trusted Tool → Silent Metadata Change → Agent Selection → Privileged Action**

---

## 3. SECURITY CONTEXT｜누구의 권한으로 실행되는가

MCP 서버가 사용자 권한이 아니라 서버 자체의 강한 권한으로 작업을 수행하면 위험은 더 커진다.

사용자는 단순 조회만 가능해도 MCP 서버는 쓰기·삭제·관리 권한을 가질 수 있다.

따라서 중요한 것은 도구의 기능 목록이 아니다.

**실행 시점에 어떤 사용자·에이전트의 보안 컨텍스트가 유지되는가**가 핵심이다.

---

## 4. DEFENSE｜MCP 연결 전에 확인할 것

### Authentication Required

원격 MCP 서버에 인증을 강제한다.

### Per-user Authorization

서버 공용 권한이 아니라 실제 사용자 권한을 전달한다.

### Tool Integrity

도구 설명과 스키마 변경을 코드 변경과 동일하게 검토한다.

### Allowlist

신뢰된 MCP 서버와 도구만 허용한다.

### Change Review

도구 버전과 권한 변경 시 재승인을 요구한다.

### Audit

누가 어떤 도구를 어떤 입력으로 호출했는지 기록한다.

---

## 5. JOYLAB SECURITY MODEL

MCP 위험은 다음 식으로 볼 수 있다.

> MCP Risk = Exposure × Tool Trust × Permission Scope × Change Velocity

MCP를 많이 연결할수록 생산성은 높아질 수 있지만, 검증되지 않은 도구와 권한이 함께 늘어나면 보안 부채도 커진다.

---

## Research Cluster｜AI Security

**전체 허브:** [AI Security Research Hub](/guides/ai-security)

1. [AI API 키가 새로운 공격 자산이 된 이유](/articles/ai-api-key-compute-theft-2026)
2. [AI 에이전트 보안｜프롬프트가 실행 권한으로 바뀌는 순간](/articles/ai-agent-security-prompt-to-rce-2026)
3. **MCP 보안｜도구 연결이 새로운 공급망 공격면이 되는 이유**
4. [AI 데이터베이스 보안｜권한 통제를 데이터 계층으로 내려야 하는 이유](/articles/ai-database-security-data-layer-2026)

---

## Sources

- Microsoft Security, 2026-05-14, Exploitable misconfigurations in AI apps: https://www.microsoft.com/en-us/security/blog/2026/05/14/configuration-becomes-vulnerability-exploitable-misconfigurations-ai-apps/
- Microsoft Security, 2026-06-30, Securing AI agents and MCP tool poisoning: https://www.microsoft.com/en-us/security/blog/2026/06/30/securing-ai-agents-ai-tools-move-from-reading-acting/

**Identity → MCP Server → Tool → Permission → Action**

복잡한 정보를 실행 가능한 판단으로.

**JoyLab**

## Tool Poisoning을 막기 위한 운영 기준

MCP 보안은 서버를 연결했는지보다 **연결된 도구의 설명과 권한을 신뢰해도 되는가**가 핵심입니다. 에이전트는 도구 이름·설명·스키마를 보고 어떤 기능을 호출할지 판단하기 때문에, 도구 메타데이터에 악의적 지시가 섞이거나 연결 이후 내용이 바뀌면 사용자가 예상하지 못한 호출이 발생할 수 있습니다.

운영 환경에서는 신규 MCP 서버를 바로 프로덕션에 연결하지 말고, 읽기 전용 테스트 환경에서 도구 목록과 권한을 먼저 확인해야 합니다. 특히 파일 삭제, 이메일 발송, 배포, 결제, 데이터베이스 변경처럼 되돌리기 어려운 작업은 별도 승인을 요구하는 편이 안전합니다.

### 보안 체크리스트

- 서버 출처와 유지관리 주체 확인
- 도구 설명·스키마 변경 감지
- 최소 권한과 읽기 전용 기본값
- 쓰기 작업은 사용자 승인 요구
- 비밀키·토큰 노출 방지
- 실행 로그와 변경 이력 보존
- 외부 콘텐츠를 도구 지시와 분리

결국 MCP 보안의 핵심은 “모델을 믿을 것인가”보다 **도구가 할 수 있는 범위를 계약으로 제한하고 변경을 추적할 것인가**에 가깝습니다.

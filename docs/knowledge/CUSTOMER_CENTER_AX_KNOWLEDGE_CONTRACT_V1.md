# Customer Center AX Knowledge Contract V1

## 목적

이 계약은 Copilot **‘홈상담 옆자리 선배’**가 고객센터 업무에서 어떤 지식을 어떤 순서로 사용해야 하는지 강제한다.

핵심 원칙은 다음 한 줄이다.

> **SOP / 공식 전산 → 승인된 Playbook → 검증된 Research → Book Framework**

## 왜 필요한가

Book·Research·Guide·Playbook이 모두 존재해도, Copilot이 자료를 동등하게 취급하면 회사 정책과 교육용 프레임이 충돌할 수 있다.

따라서 지식의 양이 아니라 **권한 순서(authority order)** 를 먼저 고정한다.

## 현재 상태

- SOP / 공식 전산: **required_but_unconfigured**
- Playbook: configured
- Research: configured
- Book: configured

SOP가 연결되기 전까지 금액·보상·예외 승인·약관·법률·고객 권리·회사 정책을 확정하는 답변은 차단한다.

## 실행 파일

- Contract: `config/customer-center-ax-knowledge-contract-v1.json`
- System Prompt: `docs/copilot/home-consult-senior-system-prompt-v1.md`
- Playbook: `docs/playbooks/customer-center-ax-playbook-v1.md`
- Gate: `scripts/check-customer-center-ax-knowledge-contract-v1.mjs`

## Retrieval Contract

1. SOP 계층을 먼저 찾는다.
2. 충분하면 하위 자료를 더 읽지 않아도 된다.
3. 부족한 맥락은 하위 자료가 보완할 수 있다.
4. 하위 자료는 상위 자료를 수정하거나 무효화할 수 없다.
5. 충돌이 있으면 상위 계층을 사용하고 충돌 사실을 숨기지 않는다.

## SOP 연결 절차

실제 업무 매뉴얼이 준비되면:

1. 저장소 또는 승인된 지식 저장소에 SOP 원문을 연결한다.
2. Contract의 `sop.sources`에 경로를 등록한다.
3. `status`를 `configured`로 변경한다.
4. Knowledge Contract Gate를 통과한다.
5. 이후에만 SOP 기반 확정 답변을 허용한다.

## 운영 원칙

이 계약은 법률·약관·보상 기준 자체를 정의하지 않는다.

실제 회사 SOP가 없는 부분을 일반 지식이나 모델 추론으로 메우지 않는다.

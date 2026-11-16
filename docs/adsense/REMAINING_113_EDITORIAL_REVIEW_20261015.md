# JoyLab — 113편 개별 품질검증 1차 판정 및 실행 순서 (2026-10-15)

## 증거와 완료 범위

- 기준: main `d68424c326250bb9658cb0724652e0602eb329db`의 123편 Markdown에서 PR #508로 개선된 정확한 10편을 제외.
- 113개 원문 전체를 읽는 스크립트 `scripts/audit-adsense-remaining-113-v1.mjs`를 작성하고 Actions에서 성공을 확인.
- 결과 아티팩트 `adsense-remaining-113-evidence-v1`: `report.md`(113행), `report.csv`(113행), `report.json`(원고별 증거/우선순위/유사 후보). Workflow `adsense-content-quality-audit-v2.yml`에서 실행하며 다운로드 보존은 30일.
- 최신 원문 기반 자동 분류: **P0-CANDIDATE 0 / P1-CANDIDATE 73 / P2-CANDIDATE 40**. 외부 링크 2개 미만 10편, 등록된 공식·1차 출처 호스트 미감지 23편, 본문 2,300자 미만 5편, 유사 제목 후보 1쌍.
- 엄격한 구분: **자동 개별 증거 검사 113/113 성공, 독립 사실 검증 0/113**. 등급과 점수는 내부 리뷰 순서 지표이며 Google의 '콘텐츠 가치' 판정이나 표절 증거가 아님.

## 실제 원문 검토에서 확인한 개별 편집 포인트 (우선 10편)

| 원고 | 확인된 원문 특징 | 실질 조치 | 다음 검증 |
|---|---|---|---|
| `bach-counterpoint-order-in-chaos` | 외부 출처 URL 0; 대위법을 삶·조직 은유로 확장하고 Work/Relationship/Recovery/Growth 질문을 제공 | 대위법 설명에 음악학 1차/교육 자료 연결, 은유와 음악 이론의 경계 명시, 구체적 예시 1개 | 음악적 사실과 주관적 성찰 구분 |
| `why-we-cannot-stand-silence` | 외부 출처 URL 0; 스마트폰·주의력 일반화 주장, 10분 무입력 실습 제시 | 근거 없는 보편화 표현 완화, 주의력·디지털 사용 연구 출처 추가, 실습 전후 관찰 질문 제공 | 심리학적 인과 주장 대조 |
| `burnout-recovery-starts-with-pause` | 외부 출처 URL 0; Reduce/Recover/Re-enter 프레임, 20분 휴식 행동 제안 | 번아웃 관련 의학·산업보건 표현 출처 추가, 치료 지시와 일반적 생활 조언 구분 | WHO 등 공식 정의 및 안전 표현 확인 |
| `performance-system-leading-indicators` | 외부 출처 URL 0; Outcome→Driver→Behavior→Feedback과 상담 예시 | 예시 데이터(가상임을 표시)로 실제 KPI/행동 연결표, 분모·측정 주기·반례 명시 | 선행지표와 결과 인과를 단정하지 않는지 검토 |
| `feedback-system-behavior-change` | 외부 출처 부족·짧은 본문 신호; 행동 피드백 재실행 지침 | 익명·가상 상담 사례와 코칭 전후 확인표 보강 | 재실행 효과를 근거 없이 일반화하지 않는지 |
| `learning-system-reexecution-loop` | 외부 출처 URL 0; Observe→Diagnose→Learn→Practice→Re-run→Verify 체계 | 실패 유형별 실제 적용표 및 재실행 성공률 분모·기간 추가 | 조직 학습 이론과 JoyLab 자체 프레임 분리 |
| `recognition-system-fair-performance` | 외부 출처 URL 0; 기회·규칙·판정 공정성 세 층 제안 | 기준 공개·이의신청·기회 보정의 가상 운영 사례와 판정 기록 카드 | 객관적 연구/자체 의견 분리 |
| `ai-agent-security-prompt-to-rce-2026` | Microsoft Security의 실제 2026-05-07 연구 URL을 출처로 제시 | Microsoft 1차 자료는 존재함을 확인; 해당 CVE의 영향 조건/패치 수준을 본문과 대조해 표기 | CVE별 조건과 가정 범위 확인 |
| `mcp-security-tool-poisoning-2026` | Microsoft Security 출처 2개, MCP 도구 변경·권한 통제 프레임 | 도구 오염 시나리오와 실제 보고 사례를 분리하고 권한 매트릭스 추가 | 인용 사례가 원문 연구에 실제 등장하는지 확인 |
| `submarine-cable-failure-repair` | ITU/ICPC 주소 3개; 우회·수리 단계·복구 체크포인트 구체적 | 국제기구 URL 미감지는 검사기 오판으로 수정; 복구 시간 요인은 근거와 대응 | ITU·ICPC 문서별 세부 주장 확인 |

## 검사기 보정

- 첫 실행의 공식 자료 호스트 판별 범위가 협소하여 `microsoft.com`, `oracle.com`, `itu.int`, `iscpc.org` 등을 놓침.
- 목록을 보완한 뒤 동일 113편을 재검사함. P1 후보 77→73, P2 후보 36→40, 1차 도메인 미감지 32→23.
- **자료가 존재한다는 점과 자료가 해당 주장을 뒷받침한다는 점은 다르므로** 링크 존재만으로 사실 검증을 통과시키지 않음.

## 편집 검증 규칙

1. 각 글의 핵심 사실 주장 2–5개를 원문 저자/발표일/수치/회계 및 기술 범위까지 확인하고 검증 근거 링크를 남긴다.
2. 관점 칼럼/서평/음악 에세이는 연구와 동일한 '공식 출처 2개 필수'를 기계적으로 적용하지 않고, 직접 경험·독립적 해석·명확한 사례의 가치를 평가한다.
3. 금융·의료·보안 주장에는 실제 1차 출처와 기준일을 연결한다. 불확실한 부분은 미검증·가설로 표시한다.
4. 제목 유사 후보 `us-cpi-fed-nasdaq-guide` ↔ `us-jobs-report-fed-nasdaq-guide`는 CPI와 고용지표라는 서로 다른 검색 의도를 수동 대조한다. 자동 병합·삭제 금지.
5. 개선 후 각 원고의 담당자·재검토일·근거·변경 PR·운영 SHA·모바일/데스크톱 검사 증거를 기록한 경우에만 최종 VERIFIED로 표시한다.

## 조치 우선순위

- 1차: 위 표의 P1 우선 10개 글 원문별 사실·독자 가치 검증과 필요한 수정.
- 2차: 나머지 P1 후보 63개. 출처 부재, YMYL 단정, 실용성 미확인, 유사 검색 의도 순으로 편집.
- 3차: P2 후보 40개. 독창성·내부 링크·표·유용성 중심 재검토.
- 사이트 최종 AdSense 재심사는 **원고와 운영 페이지의 사람이 수행한 검증 증거가 수집된 뒤** 별도 승인 절차로 진행한다.

## 금지

자동 AdSense 재심사 신청, 일괄 `noindex`/삭제, 사실확인 없는 VERIFIED 처리, GitHub Release Gate 기준 완화 금지.

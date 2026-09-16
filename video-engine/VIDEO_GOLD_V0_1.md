# VIDEO GOLD V0.1

## Gate A — Source Integrity
- [ ] 원본 Article slug와 Source Pack manifest slug 일치
- [ ] `01_RESEARCH.md`가 원본 리서치 스냅샷임
- [ ] 외부 사실은 `02_EVIDENCE.md`에 출처가 있음
- [ ] 영상에서 사용하는 핵심 숫자는 `03_NUMBERS.json` 화이트리스트에 있음
- [ ] Source Pack에 없는 전망·목표가·확률·숫자를 추가하지 않음

## Gate B — Fact Lock
- [ ] 숫자 단위 일치
- [ ] 날짜/기간 일치
- [ ] 기업·기관·인물명 일치
- [ ] Fact와 JoyLab Interpretation을 구분
- [ ] 투자 아이디어를 매수·매도 지시로 바꾸지 않음

**Critical:** Gate A/B 한 항목이라도 FAIL이면 게시 금지.

## Gate C — Video Structure
- [ ] 첫 15초 안에 핵심 질문 또는 반전이 있음
- [ ] 1영상 1핵심 메시지
- [ ] Fact → Interpretation → Scenario/Risk → Action 순서가 유지됨
- [ ] 중간에 핵심 숫자/도표를 설명함
- [ ] 결론에서 다음 확인 조건을 남김

## Gate D — Brand
- [ ] JoyLab 표기
- [ ] `aijoylab.kr` Research CTA
- [ ] 과장형 수익 보장 표현 없음
- [ ] 썸네일은 Deep Navy / Electric Blue / White 체계와 충돌하지 않음
- [ ] AI 생성 영상이라도 JoyLab 리서치가 원본임을 설명

## Gate E — Publish Metadata
`published` 전환 시 필수:
- [ ] YouTube ID
- [ ] 제목
- [ ] 설명
- [ ] 썸네일 URL
- [ ] uploadDate
- [ ] ISO 8601 duration
- [ ] canonical Article URL + UTM
- [ ] 챕터/타임스탬프
- [ ] Article Video UI
- [ ] VideoObject JSON-LD

## Gate F — Activation
공식 YouTube 채널 링크는 아래를 모두 만족하기 전까지 OFF 유지:
- [ ] Long-form 3편 이상 PUBLISHED
- [ ] 3편 연속 VIDEO GOLD PASS
- [ ] 채널 프로필/배너/About 정리
- [ ] 사이트 유입 UTM 검증
- [ ] Production smoke PASS

## 판정
- `PASS`: 모든 Critical + Publish 대상 필수 항목 통과
- `HOLD`: Source Pack은 정상이나 게시 메타/영상 검수가 미완료
- `FAIL`: Fact Lock 위반 또는 출처 없는 숫자/주장 존재

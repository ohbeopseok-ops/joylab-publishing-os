# JoyLab Research → Social Engine V1.1

## 목적

한 편의 JoyLab Research를 X, Threads, LinkedIn, Naver로 배포할 때 문안과 UTM만 넘기지 않고 **누가 쓰는가(Person), 누가 발행하는가(Organization), 어디로 연결하는가(WebSite)** 를 함께 전달합니다.

기존 Distribution OS의 상태 머신과 수동 승인 원칙은 유지합니다.

`DRAFT → REVIEW → APPROVED → PUBLISHED → MEASURED`

자동 게시 API는 계속 OFF입니다.

## Entity contract

### Person

- `@id`: `https://aijoylab.kr/#founder`
- name: `오법석`
- X: `https://x.com/ohbeopseok`
- Threads: `https://www.threads.com/@ohbeopseok`
- LinkedIn: 오법석 공식 LinkedIn 프로필

### Organization

- `@id`: `https://aijoylab.kr/#organization`
- name: `JoyLab`
- canonical URL: `https://aijoylab.kr/`

### WebSite

- `@id`: `https://aijoylab.kr/#website`
- canonical URL: `https://aijoylab.kr/`

## Channel ownership

| Channel | account owner / author | publisher | destination |
| --- | --- | --- | --- |
| X | `#founder` | `#organization` | `#website` |
| Threads | `#founder` | `#organization` | `#website` |
| LinkedIn | `#founder` | `#organization` | `#website` |
| Naver Blog | `#organization` | `#organization` | `#website` |

실제 값은 `distribution/brand-identity.json`을 단일 소스로 사용합니다.

## CTA Router V1.1

- X: `숫자와 전체 근거 → JoyLab Research`
- Threads: `이 생각을 숫자까지 붙여 정리했습니다 ↓`
- LinkedIn: `전체 분석과 실행 프레임워크 → JoyLab Research`
- Naver: `관련 데이터와 후속 리서치 보기 → JoyLab Research`

모든 CTA의 실제 링크는 canonical Article URL에 기존 UTM 계약을 적용합니다.

- `utm_source`: `threads | x | linkedin | naver`
- `utm_medium`: `social | blog`
- `utm_campaign`: `research_<slug>`
- `utm_content`: variant ID

## Generated pack V1.1

`distribution/generated/<slug>/distribution-pack.json`에는 다음이 추가됩니다.

```json
{
  "version": "1.1",
  "identity": {
    "person": { "@id": "https://aijoylab.kr/#founder" },
    "organization": { "@id": "https://aijoylab.kr/#organization" },
    "website": { "@id": "https://aijoylab.kr/#website" }
  },
  "channels": {
    "x": {
      "identity": {
        "accountUrl": "https://x.com/ohbeopseok",
        "authorEntity": "https://aijoylab.kr/#founder",
        "publisherEntity": "https://aijoylab.kr/#organization",
        "destinationEntity": "https://aijoylab.kr/#website"
      }
    }
  }
}
```

## Publish handoff

APPROVED 이후 생성되는 handoff에는 문안 외에 채널 identity가 함께 포함됩니다.

```json
{
  "mode": "MANUAL_HANDOFF",
  "autoPublish": false,
  "channel": "x",
  "identity": {
    "accountUrl": "https://x.com/ohbeopseok",
    "authorEntity": "https://aijoylab.kr/#founder",
    "publisherEntity": "https://aijoylab.kr/#organization",
    "destinationEntity": "https://aijoylab.kr/#website"
  }
}
```

## GOLD Gate

`.github/workflows/distribution-social-engine-v1-1-gold.yml`이 다음을 검사합니다.

1. 생성 pack과 manifest가 `1.1`인지
2. Person / Organization / WebSite `@id`가 올바른지
3. X / Threads / LinkedIn의 author가 `#founder`인지
4. 모든 채널 destination이 `#website`인지
5. 채널별 CTA가 고정 계약과 일치하는지
6. CTA 링크가 `https://aijoylab.kr/articles/...` canonical Article로 향하는지
7. APPROVED 후 handoff에도 동일 Entity 정보가 전달되는지

## Backward compatibility

기존 GOLD fixture V1.0은 유지합니다. Schema는 `1.0`과 `1.1`을 모두 허용하고, V1.1 생성물에 대해서는 별도 GOLD Gate가 더 강한 Entity 계약을 검증합니다.

# JoyLab Contact V2 SPEC

Status: **IMPLEMENTATION READY / RECIPIENT PENDING**  
Created: **2026-09-12 KST**  
Target route: **/contact**

## 1. Goal

Turn the existing informational Contact page into a structured inquiry hub for JoyLab while preserving the current security-first operating model.

Contact V2 must support four business-facing inquiry intents:

1. 콘텐츠 협업
2. 리서치·기업 분석
3. 강의·교육
4. 제휴·기타 문의

The page must also preserve a separate public path for content corrections and technical error reports through GitHub Issues.

## 2. Product principles

- No server-side form database in V2.
- No third-party form backend in V2.
- Inquiry content is composed locally in the visitor browser.
- The primary delivery method is the visitor's mail app (`mailto:`) once the official JoyLab recipient address is configured.
- A copy-to-clipboard action is always available as fallback.
- Public GitHub Issues remain limited to corrections and technical reports; business inquiries must not be routed to public Issues.
- Do not invite individual stock buy/sell consultation or personalized investment advice.

## 3. Information architecture

### Hero

- Kicker: `CONTACT`
- Headline: `함께 만들 수 있는 일을 이야기해 주세요.`
- Lead: JoyLab's three pillars and collaboration purpose.

### Inquiry category selector

Four options:

- 콘텐츠 협업
- 리서치·기업 분석
- 강의·교육
- 제휴·기타

### Form fields

Required:

- 이름 / 담당자
- 답변받을 이메일
- 문의 내용
- 개인정보 안내 동의

Optional:

- 회사·기관·소속
- 희망 일정
- 관련 URL / 참고자료
- 예산 범위

### Actions

- Primary: `메일 앱에서 문의하기 →`
- Secondary: `문의 내용 복사`

Until the official recipient email is explicitly configured, the primary mail action remains visibly disabled and the page explains why. This prevents accidental publication of a personal or inferred email address.

## 4. Secondary correction channel

A dedicated section remains for:

- factual correction
- broken link report
- technical site error

The section links to:

- repository GitHub Issues
- repository Security policy

Security vulnerabilities, tokens, cookies, private screenshots, account information, or other sensitive material must never be requested in a public Issue.

## 5. Investment boundary

The page must explicitly state:

> JoyLab은 개별 종목 매수·매도 상담이나 개인 맞춤형 투자자문을 제공하지 않습니다.

Investment-related inbound should be framed as content proposals, research collaboration, source tips, or industry-analysis requests.

## 6. Privacy model

Contact V2 does not submit form data to JoyLab servers.

- Form values stay in the visitor browser until the visitor opens the mail app or copies the text.
- Mail delivery is handled by the visitor's configured mail client.
- GitHub Issues are public and must be clearly labeled as such.
- `/privacy` must explain the Contact V2 local-composition model.

## 7. Visual direction

Use the JoyLab design system:

- Deep Navy `#0B1F4D`
- Electric Blue `#1677FF`
- White `#FFFFFF`

Desktop layout:

- left: JoyLab contact context, inquiry boundaries, correction links
- right: large structured form card

Mobile layout:

- single column
- category selector remains accessible
- buttons stack cleanly
- no horizontal overflow

## 8. Accessibility

- Real `<form>` semantics.
- Explicit `<label>` for every field.
- Required state visible in text and native HTML validation.
- Keyboard-accessible category radio controls.
- Strong `:focus-visible` treatment inherited from global styles.
- Status updates use `aria-live`.

## 9. Navigation

Add `Contact` to the primary desktop/mobile navigation after `About` while retaining the existing homepage research CTA.

## 10. Release checks

PR Build must remain green under `GOLD_BASELINE_V1`.

Production smoke test must validate at least:

- `/contact` returns `200`
- `contact-form` marker exists
- four inquiry categories are present
- copy action marker exists
- correction GitHub link exists
- investment-advice boundary text exists

## 11. Definition of Done

Contact V2 is ready for production only when:

- SPEC merged implementation matches this document
- official recipient email is explicitly provided by the JoyLab operator
- no personal/inferred email is published without approval
- required `build` check is green
- protected-main merge succeeds
- post-merge Cloudflare deploy succeeds
- production Contact smoke checks succeed

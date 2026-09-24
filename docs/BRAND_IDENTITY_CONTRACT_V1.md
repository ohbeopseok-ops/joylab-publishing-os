# JoyLab Brand Identity Contract V1.0

Version: 1.0  
Effective date: 2026-09-24  
Scope: Website, Research, Books, YouTube, Instagram, Threads, Naver Blog, Blogger, GitHub and future official channels.

## 1. Master identity

- Brand: `JoyLab`
- Canonical domain: `https://aijoylab.kr`
- Public contact: `contact@aijoylab.kr`
- Official YouTube: `https://www.youtube.com/@JoyLabResearch`
- Primary message: **분석에서 실행까지**
- Extended positioning: **생각을 분석하고, 분석을 실행으로.**
- Pillars: **투자·경제 / AI·생산성 / 성장·리더십**
- Research flow: **Fact → Interpretation → Scenario → Action**

The public brand name is `JoyLab`. `aijoylab` may be used as a domain, handle, or technical identifier.

## 2. Public contact rule

All public-facing business/contact surfaces use:

`contact@aijoylab.kr`

This includes Footer, Contact page, Organization/ContactPoint schema, YouTube business inquiry, Instagram contact, Threads bio/link area, Naver Blog profile/notice, Blogger profile, GitHub profile README, publishing, education, advertising, research and partnership inquiries.

Personal login, recovery, 2FA, administrator and backup email addresses must not be published as JoyLab contact identity.

## 3. Social profile standard

Where the platform allows it:

- Display name: `JoyLab`
- Website: `https://aijoylab.kr`
- Public email: `contact@aijoylab.kr`
- Official YouTube: `https://www.youtube.com/@JoyLabResearch`
- Profile image: current official JoyLab 1:1 brand image
- Bio: one of the approved JoyLab bios
- Preferred handle for new accounts: `@aijoylab`

Established handles may remain when changing them would break accumulated identity or links. Display name, website, profile image, bio and contact email take precedence over handle uniformity.

## 4. Website is the master source

When channel information conflicts, the current production values on `aijoylab.kr` are the source of truth.

Update order:

1. Website master identity
2. Structured data / Schema
3. YouTube
4. Instagram
5. Threads
6. Naver Blog
7. Blogger
8. GitHub
9. Other official channels

## 5. Official Channel Contract

The canonical source for public channel URLs is:

`src/config/siteIdentity.ts`

Website components and structured data must consume channel URLs from this file instead of duplicating literal URLs.

Canonical official channels:

| Channel | Canonical URL |
| --- | --- |
| YouTube | https://www.youtube.com/@JoyLabResearch |
| Naver Blog | https://blog.naver.com/joy014 |
| Threads | https://www.threads.com/@ohbeopseok |
| Instagram | https://www.instagram.com/aijoylab/ |
| LinkedIn | https://www.linkedin.com/in/%EB%B2%95%EC%84%9D-%EC%98%A4-b3273633b/ |
| X | https://x.com/ohbeopseok |

CI runs `scripts/check-official-channel-contract.mjs` to block legacy YouTube handles and verify official-channel consumers. In addition, `scripts/check-brand-identity-single-source-v2.mjs` enforces the stronger Single Source Gate V2: canonical domain, public email, and all official SNS URLs may be defined only in `src/config/siteIdentity.ts` within production source (`src/components`, `src/layouts`, `src/pages`, `src/lib`). Direct hardcoding in those runtime surfaces fails CI.

### Brand Identity Single Source Gate V2

Protected identity values:

- Canonical domain
- Public contact email
- YouTube
- Naver Blog
- Threads
- Instagram
- LinkedIn
- X

Rule: production source consumes these values from `siteIdentity.ts`. Documentation, CI assertions, test fixtures, and generated output may reference canonical literals when they are explicitly verifying the contract.

## 6. Search entity consistency

Keep the following relationship stable:

`JoyLab → aijoylab.kr → contact@aijoylab.kr → official social channels`

Organization `sameAs` must contain only channels that are actively operated and intentionally presented as official.

The canonical YouTube entity is:

`https://www.youtube.com/@JoyLabResearch`

## 7. Public identity exclusions

Do not expose these as JoyLab brand identity:

- personal Gmail address
- login/recovery email
- 2FA or backup account
- private phone/address
- internal administrator identifiers

## 8. Brand Identity GOLD Gate

A new or refreshed channel is complete when these seven items are consistent:

1. Brand name: JoyLab
2. Profile image: official JoyLab image
3. Website: aijoylab.kr
4. Public email: contact@aijoylab.kr
5. Official YouTube: https://www.youtube.com/@JoyLabResearch
6. Bio: approved JoyLab positioning
7. Pillars: 투자·경제 / AI·생산성 / 성장·리더십

## 9. Legacy Public Email Gate

The legacy personal Gmail address must not appear in the generated public website.

CI runs `scripts/check-legacy-public-email.mjs` after the Astro build. The gate scans text-based generated files under `dist/` and text-based reader/book source files under `assets/books/`, including sources that are later compressed into public reader payloads. Matching is case-insensitive. If a legacy public email is found, the build and production deployment are blocked before release.

Historical Git commits and unrelated internal documents are not scanned by this gate.

## 10. Audit cadence

Run an identity audit when:

- a new SNS/channel is created
- domain/email/profile image changes
- site redesign or major navigation change is released
- brand positioning changes

Recommended periodic review: once per quarter.

## Identity master

| Field | Canonical value |
| --- | --- |
| Brand | JoyLab |
| Domain | https://aijoylab.kr |
| Public contact | contact@aijoylab.kr |
| Official YouTube | https://www.youtube.com/@JoyLabResearch |
| Primary message | 분석에서 실행까지 |
| Extended positioning | 생각을 분석하고, 분석을 실행으로. |
| Pillars | 투자·경제 / AI·생산성 / 성장·리더십 |

**One Brand. One Domain. One Public Contact. One Official YouTube.**

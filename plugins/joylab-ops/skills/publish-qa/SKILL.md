---
name: publish-qa
description: Validate a JoyLab article before merge or deployment. Use for frontmatter, image, links, sitemap, build, hero gate, and deployment-readiness checks.
---

# JoyLab Publish QA Skill

## Goal

새 Article 또는 수정 Article이 JoyLab Publishing OS의 발행 계약을 통과했는지 검증합니다.

## Input

- target article slug
- related image manifest entries
- related guide/hub links
- current Git branch or working tree

## Required checks

1. **Article contract**
   - frontmatter 필수값
   - `draft: false` 여부
   - canonical
   - publishedAt
   - category / tags / author

2. **Visual contract**
   - Hero 존재
   - alt 존재
   - supporting visual manifest 확인
   - 깨진 경로 없음

3. **Navigation contract**
   - 내부링크 대상 존재
   - 시리즈 이전/다음/Hub 경로 확인
   - sitemap 또는 정적 경로 생성 계약 확인

4. **Build contract**
   - `npm run check:heroes`
   - `npm run build`
   - 실패 시 원인을 수정하고 재검증

5. **Distribution smoke**
   - 공개 Article이면 Distribution pack 생성 가능 여부 확인
   - 자동 외부 게시를 실행하지 않음

## Stop Conditions

다음 중 하나라도 있으면 Merge-ready로 판정하지 않습니다.

- build 실패
- Hero gate 실패
- canonical 오류
- 존재하지 않는 내부링크
- 필수 frontmatter 누락
- 원본/생성 파일을 파괴하는 수정 필요
- 운영 배포에 필요한 권한이 없음

## Output

```text
PUBLISH QA

Article:
Status: PASS | FAIL

Checks:
- Article contract:
- Visual contract:
- Navigation contract:
- Hero gate:
- Build:
- Distribution smoke:

Changed files:
- ...

Remaining risks:
- ...

Human review:
- ...
```

## Rule

**FAIL 상태에서는 Merge 또는 Production 완료를 주장하지 않습니다.**

# Content Identity Contract V1

## Purpose

Published JoyLab content keeps a stable identity across title, canonical URL, and slug.

## Rules

- `title`: changing an already published title requires `identityChangeReason`.
- `canonical`: changing or adding/removing a canonical on already published content requires `identityChangeReason`.
- `slug`: the published slug is immutable in ordinary content PRs. File renames are blocked.
- A slug migration must be handled as a separate redirect migration so old URLs do not silently break.
- Draft content may change freely before first publication.

Example:

```yaml
title: "수정된 제목"
identityChangeReason: "검색 의도와 실제 본문 범위를 일치시키기 위한 제목 정정"
```

CI implementation:
- `scripts/check-content-identity-contract-v1.mjs`
- `.github/workflows/content-identity-contract-v1.yml`
- PR explanations are surfaced by `Content Contract PR Comment`.

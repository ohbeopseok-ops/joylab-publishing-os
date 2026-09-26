# JoyLab Publishing OS

JoyLab의 독립 콘텐츠·리서치·Books·배포 운영 플랫폼입니다.

## Core stack

- Astro static site
- GitHub-based content source
- Cloudflare Workers deployment
- SEO / AEO / structured data
- Research, Books, Guides, Distribution
- Production health / visual QA / GOLD release gates
- AdSense-ready monetization controls

## Operating principle

`생각 → 분석 → 실행 → 성장`

Publishing OS is managed through:
- project contracts in `docs/`
- executable checks in `scripts/`
- GitHub Actions gates in `.github/workflows/`
- task routing in `AGENTS.md`

Do not treat this README as the full operational rulebook.

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Production

Production deploys through GitHub Actions to Cloudflare Workers.

A successful build or upload alone is not a GOLD release.

For production/release work, read:
- `docs/GOLD_BASELINE_V1.md`
- `docs/RELEASE_GATE_V1.md`

## Contract routing

Use `AGENTS.md` to load only the contract relevant to the task.

Examples:
- content dates → `CONTENT_DATE_CONTRACT_V1`
- homepage slots → `HOME_CONTENT_SLOT_CONTRACT_V1.0`
- brand identity → `BRAND_IDENTITY_CONTRACT_V1`
- mobile UI → `MOBILE_UI_CONTRACT_V1`
- monetization → AdSense contracts/runbook
- release/deploy → Gold Baseline + Release Gate

## Current GOLD philosophy

Build GREEN is necessary but not sufficient.

Production-facing releases require the applicable production checks, including Production Smoke, before they may be described as GOLD.

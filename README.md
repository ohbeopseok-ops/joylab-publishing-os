# JoyLab Publishing OS

JoyLab 독립 콘텐츠 플랫폼 V0.1.

## 목표

- Astro 기반 정적 사이트
- Pages CMS 기반 무료 편집 환경
- GitHub에 Markdown 콘텐츠 저장
- Cloudflare 배포를 전제로 한 Free-First 구조
- SEO 친화적 정적 HTML

## V0.1 Gold Case

`Pages CMS에서 글 작성 → GitHub 저장 → 빌드 → 공개 URL 생성`

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm run preview
```

## 배포

GitHub Actions를 통해 Cloudflare Workers로 자동 배포합니다.

브랜드: **생각 → 분석 → 실행 → 성장**

## Visual QA Pass (2026-09-14)

- 총 17장 감사
- KEEP 14 / TUNE 3 / REGEN 0
- KEEP 14장은 1600×900 WebP(quality 65)로 최적화
- TUNE 3장: HD현대중공업 / 한화오션 / 삼성중공업

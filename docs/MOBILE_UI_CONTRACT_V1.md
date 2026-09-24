# JoyLab Mobile UI Contract V1.0

Status: GOLD candidate  
Reference viewport: 390 × 844 CSS px  
Primary objective: keep JoyLab's Deep Navy / Electric Blue identity while reducing mobile scroll cost and improving hierarchy.

## 1. Core tokens

| Token | Value | Rule |
| --- | ---: | --- |
| Mobile breakpoint | 640px | Dedicated mobile layout below this width |
| Shell horizontal padding | 20px | Keep all primary content aligned |
| Header height | 68px | Navigation must not dominate first viewport |
| Menu button | 44 × 44px | Touch target remains accessible |
| Section rhythm | 44px | Default vertical section spacing |
| Card radius | 14–18px | Preserve JoyLab rounded system |
| Body size | 16px | Avoid iOS zoom and over-dense copy |
| Body line-height | 1.65–1.75 | Korean readability |
| Footer social card | 52px min | Compact but tappable |
| Footer bottom spacing | 28px / 16px | Margin / divider padding |

## 2. Mobile hierarchy

1. Content first.
2. Brand identity second.
3. Navigation and channel discovery third.
4. Footer utility links remain available without consuming a full viewport.

Desktop components must not simply stack one-by-one on mobile. At 390px, dense utility groups may use two-column grids.

## 3. Header

- Sticky.
- 68px height.
- Logo: about 24px.
- Menu button: 44px.
- Full-screen menu starts below the 68px header.
- Active route uses Electric Blue and a subtle pale-blue background.

## 4. About / content pages

- Page top padding: 40px.
- H1: clamp(32–48px), line-height 1.08.
- Lead copy: 16px, line-height about 1.72.
- Long Korean copy uses keep-all where it improves readability.
- Avoid sections that consume a full viewport only through padding.

## 5. Official channels

Priority order:
1. YouTube
2. Naver Blog
3. Threads
4. Instagram
5. LinkedIn
6. X
7. RSS where applicable

Rationale: video and owned/searchable long-form channels should appear before short-form distribution channels.

## 6. Footer contract

At 390px:

- Brand block spans full width.
- OFFICIAL spans full width.
- Social links use a 2-column grid.
- BUSINESS and LEGAL/RESOURCES share a 2-column row.
- Email may wrap safely.
- 360px and below falls back to one column.
- Footer should not visually consume more space than the content immediately above it.

### Target wireframe

```text
┌──────────────────────────────────────┐
│ JoyLab                               │
│ 생각을 분석하고, 분석을 실행으로.      │
│ 짧은 브랜드 설명                      │
│ [투자·경제] [AI·생산성] [성장·리더십] │
│                                      │
│ OFFICIAL                             │
│ [▶ YouTube   ↗] [N Naver Blog ↗]    │
│ [@ Threads   ↗] [◎ Instagram  ↗]    │
│ [in LinkedIn ↗] [X X          ↗]    │
│                                      │
│ BUSINESS          LEGAL & RESOURCES  │
│ About JoyLab       JoyLab Books      │
│ 프로젝트 문의       Privacy           │
│ contact@...        RSS               │
│                    오류 제보          │
│ ──────────────────────────────────── │
│ © 2026 JoyLab · Independent Research │
│ 생각 → 분석 → 실행 → 성장             │
└──────────────────────────────────────┘
```

## 7. QA gates

- 390px: no horizontal scroll.
- 360px: no clipped labels.
- Social cards remain at least 48px high.
- Email does not overflow.
- Header does not obscure anchor targets.
- Footer labels remain readable at 200% browser text zoom.
- Light/dark brand contrast passes WCAG AA for normal text.
- YouTube is visible without scrolling through all utility links first.

## 8. Scope of this pass

Implemented by:
- `src/styles/mobile-footer-v2.css`
- `src/components/SiteFooter.astro`
- `src/components/AboutOfficialChannels.astro`

The existing `mobile-ui-v1.css` remains the base mobile system. This contract adds a focused density correction rather than replacing the entire mobile stack.

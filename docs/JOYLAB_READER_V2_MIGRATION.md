# JoyLab Reader V2 Migration Contract

Status: Planned / Guarded  
Target: zero external runtime dependencies

## Decision

Reader V2 will be fully self-contained. Tailwind CDN will not be retained as a permanent runtime dependency.

## Current baseline

- Tailwind: cdn.tailwindcss.com
- Pretendard: cdn.jsdelivr.net
- Serif font: Google Fonts
- Icons: unpkg Phosphor

## Migration order

1. Replace Phosphor web runtime with inline/local SVG icons.
2. Replace Google Serif + Pretendard web fonts with the existing system font stack; preserve optional serif reading mode using local/system serif fallback.
3. Compile the finite Tailwind utility surface into local static CSS or replace it with Reader-specific CSS.
4. Remove Tailwind config/runtime script.
5. Add CSP that no longer requires external style/script/font hosts.
6. Run existing Book Web Reader tests and Mobile GOLD QA.
7. Verify print/PDF mode, search, TOC, theme, font size, tools, and localStorage behavior.

## Exit criteria

- 0 external runtime CSS/JS/font requests
- no visual regression in Reader GOLD screens
- all existing reader functionality preserved
- production smoke passes
- canonical/noindex SEO contract preserved
- mobile touch targets >=44px
- print layout remains valid

## Rollback rule

Reader V1 remains the reference until all exit criteria pass in one dedicated PR. Do not partially remove dependencies directly on main.

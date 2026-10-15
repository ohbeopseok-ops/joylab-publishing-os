# Investing Foundations Release Flow V1

## Purpose
The live JoyLab research site is `aijoylab.kr`, deployed from `joylab-publishing-os` through GitHub Actions to Cloudflare Workers.

## Locked sequence

```
Foundations 30 articles + Research Graph
→ PR Build GREEN
→ Merge through protected main
→ Cloudflare Deploy GREEN
→ Custom Domain GREEN
→ Production Smoke GREEN
→ Release Gate V1 = GOLD
→ expansion unlock PR
→ Live Evidence Layer
→ Retirement 10-part series
```

## Hard rule
Do not start Live Evidence Layer or the dedicated Retirement 10-part series while
`config/investing-foundations-release-state-v1.json` has `expansionAllowed: false`.

After production GOLD is verified, change the release state in a separate reviewed PR.

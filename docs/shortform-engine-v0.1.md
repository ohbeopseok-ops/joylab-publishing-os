# JoyLab Shortform Integration V1

## Architecture

The video renderer is now maintained in the private standalone repository:

`ohbeopseok-ops/joylab-shortform-engine`

Publishing OS no longer contains or executes Remotion renderer code.

```text
JoyLab Article
  -> Publishing OS
  -> joylab.shortform.handoff JSON
  -> joylab-shortform-engine
  -> Shortform Contract V1
  -> Remotion
  -> Video QA
  -> Human Approval
```

## Ownership

### joylab-publishing-os
- article truth
- article metadata
- source excerpt
- 20s / 40s / 60s target request
- handoff generation

### joylab-shortform-engine
- handoff validation
- scene contracts
- motion templates
- Remotion rendering
- video output QA
- future TTS/caption/asset adapters

## Contract

The Publishing OS adapter remains:

`scripts/build-shortform-handoff.mjs`

Its output declares:

- `contractVersion: 1.0`
- `kind: joylab.shortform.handoff`
- source article metadata
- Hook / Explain / Insight targets
- JOYLAB brand identity
- mandatory human approval

The receiving schema lives in the Shortform Engine repository at:

`src/handoff.ts`

## GOLD

The standalone engine owns the AI Workforce 20-second GOLD case and its CI.

Publishing OS must not add renderer-specific fields to article frontmatter.

## MoneyPrinterTurbo

MoneyPrinterTurbo remains a reference/provider-adapter candidate for future material search, TTS and subtitle capabilities. It is not a runtime dependency of Publishing OS or the Shortform Engine core renderer.

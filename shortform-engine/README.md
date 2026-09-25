# JoyLab Shortform Engine V0.1

Article -> Shortform Contract -> Remotion -> MP4 -> QA -> Human Approval.

## GOLD Case

The first render target is **AIWorkforce20**: a deterministic 20-second, 1080x1920, 30fps JOYLAB brand short.

~~~bash
npm install
npm run typecheck
npm run render:gold
~~~

Output:

~~~text
output/ai-workforce-20s.mp4
~~~

## Design rules

- Deep Navy base
- Electric Blue accent
- deterministic scene timeline
- editorial decisions live in JSON contracts
- renderer does not call an LLM
- publishing is outside V0.1
- human approval remains a hard gate

## Boundary

MoneyPrinterTurbo is a reference/adapter candidate, not a runtime dependency of the core renderer.

## Repository extraction

This directory is self-contained so it can move to a standalone `joylab-shortform-engine` repository without changing the Publishing OS handoff contract.

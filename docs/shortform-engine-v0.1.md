# JoyLab Shortform Engine V0.1

## Goal

Turn one JoyLab article into three editorial variants without coupling Publishing OS to a specific renderer or AI provider.

~~~text
Article
  -> Publishing OS Handoff Contract
  -> Editorial Engine
  -> Shortform JSON Contract
  -> Remotion Renderer
  -> MP4
  -> QA
  -> Human Approval
  -> Publish
~~~

## V0.1 scope

1. Self-contained Remotion package under `shortform-engine/`.
2. First GOLD target: `AIWorkforce20`.
3. Publishing OS adapter that emits stable handoff JSON for an article.
4. GitHub Actions support for handoff artifacts and manual GOLD rendering.

## Separation rule

Publishing OS owns article truth.

Shortform Engine owns scene contracts and rendering.

Renderer-specific fields do not belong in article frontmatter.

## Contract boundary

Publishing OS produces source path, slug, title, description, dates, cleaned excerpt, desired 20/40/60-second variants, JOYLAB brand identity and a human-approval requirement.

Shortform Engine turns that handoff into final scene contracts.

## MoneyPrinterTurbo policy

MoneyPrinterTurbo can later be used behind adapters for material search, TTS or subtitles. Its MoviePy renderer, Streamlit UI and cross-posting flow are not core dependencies.

## GOLD definition

`AIWorkforce20` passes when:

- 1080x1920
- 30fps
- exactly 20 seconds
- deterministic scene timeline
- Korean text remains in the safe area
- JOYLAB brand ending is present
- render completes in GitHub Actions

Audio/TTS and automated publishing are follow-on gates.

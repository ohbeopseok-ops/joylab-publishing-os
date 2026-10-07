# Trust Wave 3 Evidence Policy V1

## Scope
Wave 3 covers the 55 published articles remaining after Wave 1 and Wave 2.

## Evidence modes

### 1. Official / Product / Research evidence
Technical, security, product and infrastructure articles use approved public source domains already present in the article body.

Examples:
- OpenAI / Anthropic / Microsoft / Oracle / NIST
- NVIDIA / Marvell / Broadcom
- Google / Meta
- ITU / IEA
- government policy sources
- ACL Anthology / Nature / Reuters where research or reporting is appropriate

### 2. Verified source override
When a current product/company article did not already expose suitable external URLs in its body, Wave 3 policy provides explicit verified source overrides.

This is used for selected Codex, Aside, API-key security, Anthropic IPO and related current-claim articles.

### 3. Safe editorial fallback
Leadership, behavior-change and internal operating-framework articles do not fabricate citations merely to look more authoritative.

They use a transparent editorial method:
- separate case / interpretation / action
- state application conditions
- state limits and counter-scenarios
- do not present personal experience as universal scientific fact

## Rendering precedence

`article frontmatter > verified Wave 3 source override > approved body evidence > category/editorial fallback`

## Source rule
Only approved external domains are automatically surfaced in the Trust panel.
JoyLab internal links are excluded from evidence counts.

## CI state
GitHub Actions quota is exhausted.

Therefore Wave 3 is:
**CONTENT READY / CI-DEFERRED**

Final automated Build / Mobile / AdSense / Visual evidence will be collected after Actions quota reset.

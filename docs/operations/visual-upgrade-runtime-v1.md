# Visual Upgrade Runtime v1.0

## Purpose

JoyLab published research의 시각자료를 AUTO-BASELINE → CURATED로 승격할 우선순위를 실데이터로 계산하고, 충분한 데이터가 쌓인 후보가 70점을 넘으면 GitHub Issue를 자동 생성한다.

## Score

- Traffic: 30
- 60-second qualified dwell: 25
- Google Search Console CTR: 20
- Internal-link click rate: 10
- Strategic priority: 15
- CURATE_NOW: 70+
- QUEUE: 50–69
- MONITOR: <50
- Data coverage <60%: PROVISIONAL, 자동 Issue 생성 금지

## Data sources

### Cloudflare Workers Analytics Engine
Dataset: `joylab_events_v1`

Events:
- `article_view`
- `article_dwell_60`
- `article_internal_link_click`

28일 기준으로 사이트 조회수, 60초 qualified rate, 내부링크 클릭률을 계산한다. `_sample_interval`을 반영해 집계한다.

Required GitHub Actions secrets:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ANALYTICS_READ_TOKEN`

Cloudflare token permission:
- Account → Account Analytics → Read

### Google Search Console
28일 final data를 page dimension으로 수집한다.

Metrics:
- clicks
- impressions
- CTR
- average position

Required GitHub Actions secret:
- `GSC_SERVICE_ACCOUNT_JSON`

The service account must have access to the Search Console property `sc-domain:aijoylab.kr`.

ChatGPT에서 즉시 검색 성과를 조회할 때는 GSC Wizard connector를 사용할 수 있지만, GitHub scheduled runtime은 위 service-account secret을 사용한다.

## Runtime

Workflow: `.github/workflows/visual-upgrade-runtime.yml`

Daily at 00:15 UTC / 09:15 KST:
1. Search Console sync
2. Cloudflare engagement sync
3. Visual Upgrade scoring
4. metric snapshot commit if changed
5. `CURATE_NOW` + confidence MEDIUM/HIGH candidates 확인
6. 동일한 open Issue가 없으면 `[CURATE_NOW] <article-id>` Issue 생성

## Privacy

JoyLab 자체 분석은 cookie/user ID를 사용하지 않는다. Global Privacy Control 또는 Do Not Track이 활성화된 경우 client analytics event를 전송하지 않는다.

## Gold rule

실데이터가 없으면 숫자를 추정하지 않는다. 데이터 커버리지가 60% 미만이면 점수는 PROVISIONAL이며 자동 편집 작업을 생성하지 않는다.

# JoyLab Click Analytics V1

Status: DORMANT — Cloudflare Analytics Engine account activation required

Dataset (planned): `joylab_events_v1`
Binding (planned): `JOYLAB_ANALYTICS`
Endpoint implementation: `POST /__analytics/event`

## Current gate

The first production deployment attempt on 2026-09-12 was rejected by Cloudflare with API code `10089` because Analytics Engine is not enabled for the account. The live production site stayed on the previous healthy deployment.

Until account activation is confirmed:

- the Wrangler Analytics Engine binding is intentionally absent;
- the browser analytics client is intentionally not rendered;
- no JoyLab click events are sent or written;
- event attributes, Worker endpoint code, contract tests, and this operating specification remain staged in the repository for a small activation PR later.

## Purpose

Measure the small set of conversion actions that connect JoyLab content to official channels and business inquiries without adding third-party browser analytics, cookies, user IDs, form contents, or advertising profiles.

## Event schema after activation

Workers Analytics Engine fields will be written in this fixed order:

- `blob1` = event
- `blob2` = target
- `blob3` = placement
- `blob4` = source path
- `double1` = count (`1`)
- `index1` = event sampling key

Allowed production events:

| event | target | placement | meaning |
| --- | --- | --- | --- |
| `contact_view` | `contact` | `page` | Contact page loaded |
| `social_click` | `naver`, `threads`, `instagram`, `linkedin` | `footer`, `contact` | Official channel clicked |
| `article_contact_click` | `investing`, `ai-productivity`, `growth-leadership`, `generic` | `article` | Article → Contact CTA clicked |
| `footer_contact_click` | `contact` | `footer` | Footer project inquiry clicked |
| `contact_mail_click` | `mail` | `contact` | Contact mail CTA clicked |
| `contact_copy_click` | `copy` | `contact` | Contact copy CTA clicked |
| `smoke_test` | `deploy` | `production_smoke` | Deployment verification only; exclude from business reporting |

The Worker rejects unknown event / target / placement combinations.

## Privacy contract after activation

The click analytics dataset will **not** write:

- name
- email address
- company / organization
- inquiry message
- IP address
- user agent
- cookie value
- user ID
- query string

Only the allowlisted event dimensions and URL pathname will be written. The browser client will not send JoyLab analytics events when Global Privacy Control or Do Not Track is enabled.

Cloudflare infrastructure may independently process normal request metadata under its service operation; that is separate from the JoyLab Analytics Engine event payload.

## 7-day conversion query

Use the Workers Analytics Engine SQL API with an API token that has `Account Analytics Read` permission.

```sql
SELECT
  blob1 AS event,
  blob2 AS target,
  blob3 AS placement,
  SUM(_sample_interval) AS events
FROM joylab_events_v1
WHERE timestamp > NOW() - INTERVAL '7' DAY
  AND blob1 != 'smoke_test'
GROUP BY event, target, placement
ORDER BY events DESC;
```

## Social channel query

```sql
SELECT
  blob2 AS channel,
  blob3 AS placement,
  SUM(_sample_interval) AS clicks
FROM joylab_events_v1
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'social_click'
GROUP BY channel, placement
ORDER BY clicks DESC;
```

## Article → Contact query

```sql
SELECT
  blob2 AS pillar,
  blob4 AS article_path,
  SUM(_sample_interval) AS clicks
FROM joylab_events_v1
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'article_contact_click'
GROUP BY pillar, article_path
ORDER BY clicks DESC;
```

## Contact funnel query

```sql
SELECT
  blob1 AS event,
  SUM(_sample_interval) AS events
FROM joylab_events_v1
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 IN ('contact_view', 'contact_mail_click', 'contact_copy_click')
GROUP BY event
ORDER BY events DESC;
```

This is an event funnel, not a unique-user funnel. V1 intentionally does not create persistent visitor identifiers.

## Query API example

Do not store the read token in the repository.

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer $CLOUDFLARE_ANALYTICS_READ_TOKEN" \
  --data "SELECT blob1 AS event, SUM(_sample_interval) AS events FROM joylab_events_v1 WHERE timestamp > NOW() - INTERVAL '7' DAY GROUP BY event ORDER BY events DESC"
```

## Activation gate

Click Analytics V1 becomes active only when:

1. Cloudflare Analytics Engine is enabled for the account.
2. The `JOYLAB_ANALYTICS` binding is restored.
3. The browser event client is rendered site-wide.
4. Privacy disclosure is switched from dormant to active wording.
5. Gold baseline / Build is green.
6. Protected-main merge succeeds.
7. Cloudflare deployment succeeds.
8. Production smoke receives HTTP `204` from the event endpoint using `smoke_test`.
9. Existing production smoke checks remain green.

Only after all nine checks pass should the status change from `DORMANT` to `GOLD`.

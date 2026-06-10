# GA4 measurement setup — Defence Legal network

## Per-site data streams

Create one GA4 property (or four properties) and set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in each Vercel project:

| Site | Vercel env var |
|------|----------------|
| policestationrepuk.org | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| psrtrain.com | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| custodynote.com | `NEXT_PUBLIC_GA_MEASUREMENT_ID` (or keep Vercel Analytics + GA4) |
| policestationagent.com | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |

## Required custom events

| Event | When fired |
|-------|------------|
| `outbound_partner_click` | Click to a sister site (`partner`, `placement` params) |
| `register_cta_click` | Rep registration CTA |
| `directory_search` | Directory search submitted |
| `legal_directory_submit` | Legal Services Directory form success |

## Buffer attribution

Social posts append `utm_source=buffer&utm_medium=social&utm_campaign={feedId}_{channel}`.
In GA4, build an exploration: **Traffic acquisition → Session campaign** filtered to `utm_source=buffer`.

## Partner outbound exploration (GA4 UI)

1. Explore → Free form
2. Dimensions: `Event name`, `partner`, `placement`, `Page path`
3. Metrics: Event count
4. Filter: `Event name` exactly matches `outbound_partner_click`
5. Save as **Partner outbound by campaign**

## 90-day baseline metrics

Record on implementation day in a spreadsheet:

- Organic sessions (GSC + GA4) per domain
- `outbound_partner_click` count by partner
- Buffer-referred sessions (`utm_source=buffer`) on sibling sites
- Rep registrations (`/register` completions)
- Custody Note trial starts from repuk UTMs

Review weekly via `/api/cron/traffic-digest` email.

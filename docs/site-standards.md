# Defence Legal Services — multi-site standards

Copy this file and `lib/utm.ts` into each workspace (policestationrepuk.org, psrtrain.com, custodynote.com, policestationagent.com).

## UTM convention

| Parameter | Values |
|-----------|--------|
| `utm_source` | `policestationrepuk`, `psrtrain`, `custodynote`, `policestationagent`, `buffer`, `newsletter` |
| `utm_medium` | `web`, `social`, `email`, `app` |
| `utm_campaign` | Placement id e.g. `directory_sidebar`, `blog_footer`, `homepage_training`, `buffer_twitter` |
| `utm_content` | Optional slug or post id |

Use `appendUtm()` from `lib/utm.ts` — never hand-build query strings in components.

## Cross-site link matrix

| From site | Must link to |
|-----------|--------------|
| policestationrepuk.org | custodynote.com (trial), psrtrain.com (training), policestationagent.com (Kent), `/links` hub |
| psrtrain.com | repuk `/HowToBecomePoliceStationRep`, `/directory`, custodynote trial |
| custodynote.com | repuk `/Resources`, psrtrain CIT prep, PSA (Kent footer) |
| policestationagent.com | repuk `/directory/kent`, custodynote, psrtrain |

## Analytics minimum

- GA4 measurement id per site (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) or Vercel Analytics
- Events: `outbound_partner_click`, `register_cta_click`, `directory_search`, `legal_directory_submit`
- Consent-gated load (cookie banner before gtag config)

## SEO minimum

- Single canonical host with 301 from www and legacy domains
- `sitemap.xml`, `robots.txt`, RSS `/feed`, IndexNow key file
- JSON-LD `Organization` with `sameAs` for all sister sites
- OG image JPEG 1200×630 for social + Google Business Profile

## Buffer social links

Scheduled posts append: `utm_source=buffer&utm_medium=social&utm_campaign={feedId}_{channel}`.

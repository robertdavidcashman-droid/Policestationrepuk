# Analytics setup

## Google Analytics 4

- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel production.
- Events implemented in `lib/analytics.ts` + `components/AnalyticsEventBinder.tsx` (`data-event` attributes).

| Event | Trigger |
|-------|---------|
| `call_click` | `data-event="call_click"` on tel: links |
| `whatsapp_click` | WhatsApp CTAs |
| `email_click` | mailto: links |
| `form_submit` | Form success handlers |
| `rep_registration` | Register CTAs / `registerCtaClick` |
| `blog_cta_click` | Blog and hub directory CTAs |
| `outbound_partner_click` | Partner outbound links |
| `training_interest` | PSR Train promos (explicit call) |
| `demo_request` | CustodyNote demo CTAs |
| `template_download` | Template download buttons |

## Google Search Console

Verify via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` meta tag (already supported in layout).

## Bing Webmaster Tools

Import from GSC or verify separately; submit sitemap.

## Microsoft Clarity

Optional — add script via `DeferredGlobalWidgets` or tag manager (not in repo by default).

## IndexNow

Automated postbuild + daily cron — see `lib/indexnow-pipeline.ts`.

## External sites

Mirror event names for consistent reporting across brands.

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

1. Verify at [Bing Webmaster Tools](https://www.bing.com/webmasters) (import from GSC or DNS/meta tag).
2. Set `NEXT_PUBLIC_BING_SITE_VERIFICATION` in Vercel production (same pattern as Google — renders `msvalidate.01` in `app/layout.tsx`).
3. Submit sitemap: `https://policestationrepuk.org/sitemap.xml`
4. After deploys, run `npm run indexnow` to ping Bing/Yandex via IndexNow (also runs on postbuild in production).

## Legal Services Directory (KV)

LAA crime provider stubs: `npm run laa:fetch` then `npm run laa:seed:apply` (requires Upstash KV in `.env.local` / Vercel). Listings are `noindex` until claimed.

## Microsoft Clarity

Optional — add script via `DeferredGlobalWidgets` or tag manager (not in repo by default).

## IndexNow

Automated postbuild + daily cron — see `lib/indexnow-pipeline.ts`.

## External sites

Mirror event names for consistent reporting across brands.

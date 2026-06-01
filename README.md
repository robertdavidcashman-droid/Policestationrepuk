# Police Station Rep UK

A modern, SEO-optimised directory platform for police station representatives in the United Kingdom. Built with Next.js, Tailwind CSS, and Supabase. Designed for fast Core Web Vitals (LCP < 1s) and gradual migration from the existing Wix site.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) — with static seed data fallback for Phase 1
- **Language:** TypeScript
- **Deployment:** Vercel or Cloudflare Pages

## Project Structure

```
app/
├── page.tsx                          # Homepage (H1, SEO content, county links, CTA)
├── layout.tsx                        # Root layout with header/footer
├── globals.css                       # Tailwind + CSS variables
├── sitemap.ts                        # Dynamic XML sitemap
├── robots.ts                         # robots.txt
├── directory/page.tsx                # Directory search with filters (dynamic)
├── register/page.tsx                 # Rep registration CTA
├── county/[county]/page.tsx         # County pages (SSG) — served at /police-station-representatives-{county}
├── rep/[slug]/page.tsx              # Representative profiles (SSG)
└── police-station/[station]/page.tsx   # Police station pages (SSG)

components/
├── Header.tsx
├── Footer.tsx
├── Breadcrumbs.tsx
├── RepCard.tsx
├── StationCard.tsx
├── DirectoryFilters.tsx              # Client-side directory filters
└── JsonLd.tsx

lib/
├── data.ts                           # Data access (seed + Supabase when configured)
├── types.ts                          # TypeScript types
├── seo.ts                            # Metadata, JSON-LD schemas
├── supabase.ts                       # Supabase client (optional)
├── counties-content.ts               # SEO copy for county pages (Kent, London, Essex + generic)
└── seed-data.ts                      # (optional) separate seed; current seed lives in data.ts

supabase/
└── schema.sql                        # Database schema for Phase 2+
```

## URL Structure

| Page           | URL                                                                 | Rendering |
|----------------|---------------------------------------------------------------------|-----------|
| Homepage       | `/`                                                                 | Static    |
| County         | `/police-station-representatives-{county}` (e.g. kent, london, essex) | SSG       |
| Rep profile    | `/rep/{slug}`                                                       | SSG       |
| Police station | `/police-station/{slug}`                                            | SSG       |
| Directory      | `/directory`                                                        | Dynamic   |
| Register       | `/register`                                                        | Static    |

County URLs are implemented via Next.js rewrites: `/police-station-representatives-:county` → `/county/:county`.

## SEO

- **JSON-LD:** Organization (homepage), LegalService (reps), GovernmentBuilding (stations), BreadcrumbList (all pages)
- **Canonical URLs** and **Open Graph** on all pages
- **sitemap.xml** and **robots.txt** generated at build
- **Heading hierarchy** and internal links throughout
- **700+ word** county content for Kent, London, Essex; generic template for other counties

## Performance

- Static generation for homepage, county, rep, and station pages
- Minimal client JS; directory filters are the only client component
- Target **LCP < 1s** with edge deployment (Vercel/Cloudflare)
- Cache headers set in `next.config.ts`

## Production deployment (Vercel)

Live traffic for **policestationrepuk.org** is served from **Vercel**. The blog and all app routes come from the **latest successful production deployment** of this GitHub repo — not from a separate CMS.

1. **Vercel → Project → Settings → Git**: confirm the connected repository is **`robertcashman-bit/Policestationrepuk`** and the **Production Branch** is **`master`** or **`main`** (this repo keeps both branches aligned).
2. **Deployments**: if a build fails, Vercel keeps serving the previous deployment — the public site can then look “stuck” on old HTML (e.g. an old blog index). Fix the build error and redeploy.
3. **GitHub Actions**: workflow **CI — Next.js build** runs `npm ci && npm run build` on every push to `master`/`main` so breakages are visible under the **Actions** tab.
4. **Optional deploy hook**: Vercel → **Settings → Git → Deploy Hooks** → create a hook for **Production**. Add the hook URL as repository secret **`VERCEL_DEPLOY_HOOK`**. Pushes will then POST that hook after CI (see `.github/workflows/vercel-deploy-hook.yml`).
5. **Connect Git from CLI** (same machine as `vercel login`): from the repo root run  
   `npx vercel git connect https://github.com/robertcashman-bit/Policestationrepuk.git`  
   so this project deploys on every push without relying on manual `vercel deploy`.

## Legacy URLs & GSC migration

After the Wix → Next.js migration, old paths are handled in two layers:

- **`middleware.ts`** — exact legacy paths via `lib/legacy-exact-redirects.ts` (e.g. `/home`, `/Home` → `/`; lowercase `/blog` → `/Blog`) and unknown `/Blog/{slug}` via `lib/blog/legacy-blog-slugs.ts` (301 to a canonical article or `/Blog` hub — no 404).
- **`next.config.ts`** — remaining one-off redirects (feeds, Base44 paths, etc.). Blog slug redirects are **not** duplicated here (case-insensitive matching caused loops on Vercel).

**GSC triage:** export “Not indexed” URLs from Search Console and run:

```bash
npx tsx scripts/analyze-gsc-legacy-urls.ts path/to/gsc-pages.csv
```

Without a CSV, the script classifies blog paths from `docs/live-site-map.json`. See `audit/GSC_LEGACY_URL_AUDIT.md`.

**Audit tests:** `npm test` covers redirect resolution; `npx playwright test tests/audit/legacy-redirects.spec.ts` smoke-checks live 301s.

## Trust & directory quality

- Rep profiles show **Admin-verified listing** when they pass the strict publication gate (`lib/rep-public-trust.ts` + `RepTrustBadges`).
- Public visibility requires verified status, admin approval, `isPublic`, and a current `lastVerifiedDate` (`lib/rep-status.ts`).
- **Report profile** uses Cloudflare Turnstile on the report flow; registration intentionally does not use Turnstile (see `RegisterForm.tsx`).

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (optional for Phase 1)

Create `.env.local` only when you connect Supabase (Phase 2+):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Phase 1:** The app runs without these. If they are missing or invalid (e.g. not a valid HTTP(S) URL), the app uses seed data from `lib/data.ts`.

### Production build

```bash
npm run build
npm start
```

## Database (Phase 2+)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of `supabase/schema.sql`.
3. Populate tables (e.g. from seed data or migration).
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your environment.
5. The data layer in `lib/data.ts` already checks `isSupabaseConfigured` and uses Supabase when available.

## Deployment

### Vercel

1. Push the repo to GitHub and import the project in [vercel.com](https://vercel.com).
2. Add env vars in the Vercel dashboard (optional for Phase 1).
3. Deploy; Vercel detects Next.js automatically.
4. Set the production domain (e.g. policestationrepuk.com) in Vercel.

### Cloudflare Pages

1. Connect the repo in Cloudflare Pages.
2. Build command: `npm run build`
3. Build output directory: `.next`
4. Use the Cloudflare Next.js adapter or run `npm run build` and `npm start` with a Node runtime; for full compatibility, consider the official Cloudflare + Next.js guide.
5. Add `NEXT_PUBLIC_SUPABASE_*` env vars if using Supabase.

### Note on `output: 'standalone'`

For Docker or a custom Node server, add to `next.config.ts`:

```ts
output: 'standalone',
```

Then build and run the standalone server as per Next.js docs.

## Migration strategy

- **Phase 1:** This app runs alongside Wix. Use it as static SEO pages that link to the existing Wix directory where appropriate.
- **Phase 2:** Migrate representative (and related) data into Supabase; keep using the same URLs.
- **Phase 3:** Switch the main domain to this app and retire the Wix directory.
- **Phase 4:** Add 301 redirects in `next.config.ts` (`redirects()`) for any legacy Wix URLs.

Existing redirects in `next.config.ts` map paths like `/find-a-rep`, `/representatives`, `/contact-us`, `/about-us` to the new structure.

## Licence

Private — all rights reserved.

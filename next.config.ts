import type { NextConfig } from "next";
import path from "path";
import bundleAnalyzer from "@next/bundle-analyzer";
import packageJson from "./package.json";
import { LEGACY_COUNTY_REDIRECTS } from "./lib/legacy-county-redirects";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const siteBuildDate = new Date().toISOString().slice(0, 10);

const nextConfig: NextConfig = {
  transpilePackages: ['@robertcashman/firm-outreach-core'],
  // `sharp` (used by @robertcashman/buffer-engine image correction) is a native
  // module that must not be bundled/traced into the server build, or `next build`
  // fails trying to load its linux-x64 binary while collecting page data.
  serverExternalPackages: ['sharp'],
  turbopack: {
    resolveAlias: {
      '@robertcashman/firm-outreach-core': './packages/firm-outreach-core',
    },
  },
  env: {
    NEXT_PUBLIC_SITE_VERSION: packageJson.version,
    NEXT_PUBLIC_SITE_BUILD_DATE: siteBuildDate,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "policestationrepuk.com" },
      { protocol: "https", hostname: "**.policestationrepuk.com" },
      { protocol: "https", hostname: "policestationrepuk.org" },
      { protocol: "https", hostname: "**.policestationrepuk.org" },
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config, { dir }) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    (config.resolve.alias as Record<string, string>)["@"] = path.join(dir, ".");
    return config;
  },

  async rewrites() {
    return [
      { source: "/Directory", destination: "/directory" },
      { source: "/FindYourRep", destination: "/directory" },
      { source: "/Register", destination: "/register" },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // NOTE: `https://challenges.cloudflare.com` MUST be present in
          // `script-src` and `frame-src` for the Cloudflare Turnstile widget
          // (used on the secure rep-verification page and the
          // "Report this profile" button) to load. /register no longer uses
          // Turnstile — the widget caused too many "I entered the code but
          // the form never opened" support tickets — but the other surfaces
          // still need it. See lib/turnstile.ts + components/TurnstileWidget.tsx.
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://esm.sh https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https: wss:; frame-src 'self' https://challenges.cloudflare.com https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" },
        ],
      },
      {
        // Keep API responses out of search indexes.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Admin surfaces must never be indexed or cached by shared caches.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },

  async redirects() {
    const blogLegacyHub = "https://policestationrepuk.org/Blog";
    return [
      // Apex domain — .com is deprecated; always send users to the canonical .org host.
      // Only fires once .com DNS points at Vercel (currently still on Wix); harmless until then.
      {
        source: "/:path*",
        has: [{ type: "host", value: "policestationrepuk.com" }],
        destination: "https://policestationrepuk.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.policestationrepuk.com" }],
        destination: "https://policestationrepuk.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.policestationrepuk.org" }],
        destination: "https://policestationrepuk.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "policestationrepukdirectory.com" }],
        destination: "https://policestationrepuk.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.policestationrepukdirectory.com" }],
        destination: "https://policestationrepuk.org/:path*",
        permanent: true,
      },
      ...LEGACY_COUNTY_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true as const,
      })),
      {
        source: "/police-station-representatives",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/find-a-rep",
        destination: "/directory",
        permanent: true,
      },
      { source: "/find", destination: "/directory", permanent: true },
      { source: "/stations", destination: "/StationsDirectory", permanent: true },
      {
        source: "/representatives",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/contact-us",
        destination: "/Contact",
        permanent: true,
      },
      {
        source: "/about-us",
        destination: "/About",
        permanent: true,
      },
      // Legacy Wix / RSS discovery paths → in-app equivalents
      {
        source: "/functions/sitemap",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/functions/rss",
        destination: "/rss.xml",
        permanent: true,
      },
      {
        source: "/feed.xml",
        destination: "/rss.xml",
        permanent: true,
      },
      {
        source: "/feed",
        destination: "/rss.xml",
        permanent: true,
      },
      // NOTE: /blog/:slug → /Blog/:slug case redirect moved to middleware.ts
      // next.config redirects match case-insensitively on Vercel, creating a loop for /Blog/* URLs.
      // Legacy blog slug redirects are handled in middleware via lib/blog/legacy-blog-slugs.ts
      {
        source: "/servicesvoluntaryinterviews",
        destination: "/InterviewUnderCaution",
        permanent: true,
      },
      // Base44 legacy redirects
      {
        source: "/police-station-rep-registration",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/reps",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/LegalLinks",
        destination: "/Resources",
        permanent: true,
      },
      // Legacy Wix blog paths that do NOT match current app/Blog routes
      { source: "/post/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/news/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/posts/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/article/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/blog-1/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/articles/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/new-blog/:path*", destination: blogLegacyHub, permanent: true },
      { source: "/blog-old/:path*", destination: blogLegacyHub, permanent: true },
      {
        source: "/BlogPostPage",
        destination: "/Blog",
        permanent: true,
      },
      // Google verification file now served from public/google03385fbe80cfcd6b.html
      // Lowercase / wrong-case → canonical routes: `middleware.ts` + `lib/legacy-exact-redirects.ts`
      // (next.config redirects use case-insensitive matching on Windows → 308 loops on /Blog, etc.)
      // Legacy content pages → best match
      { source: "/what-is-a-police-station-rep", destination: "/WhatDoesRepDo", permanent: true },
      { source: "/whatisapolicestationrep", destination: "/WhatDoesRepDo", permanent: true },
      { source: "/what-is-a-criminal-solicitor", destination: "/DutySolicitorVsRep", permanent: true },
      { source: "/your-rights-in-custody", destination: "/PACE", permanent: true },
      { source: "/police-custody-rights", destination: "/PACE", permanent: true },
      { source: "/police-interview-rights", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/voluntary-police-interview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/voluntary-interviews", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/voluntaryinterviews", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/arrested-at-police-station", destination: "/PACE", permanent: true },
      { source: "/services", destination: "/About", permanent: true },
      { source: "/services/police-station-representation", destination: "/WhatDoesRepDo", permanent: true },
      { source: "/testimonials", destination: "/About", permanent: true },
      { source: "/locations", destination: "/StationsDirectory", permanent: true },
      { source: "/police-stations", destination: "/StationsDirectory", permanent: true },
      { source: "/coverage", destination: "/Map", permanent: true },
      { source: "/fees", destination: "/PoliceStationRates", permanent: true },
      { source: "/servicerates", destination: "/PoliceStationRates", permanent: true },
      { source: "/for-solicitors", destination: "/PoliceStationCover", permanent: true },
      { source: "/forsolicitors", destination: "/PoliceStationCover", permanent: true },
      { source: "/for-clients", destination: "/FAQ", permanent: true },
      { source: "/freelegaladvice", destination: "/FAQ", permanent: true },
      { source: "/regulatory-information", destination: "/ICO", permanent: true },
      { source: "/spotlightprofile", destination: "/GoFeatured", permanent: true },
      { source: "/SpotlightProfile", destination: "/GoFeatured", permanent: true },
      // Kent station legacy pages
      { source: "/kent-police-stations", destination: "/KentCustodySuites", permanent: true },
      { source: "/kent-police-station-reps", destination: "/KentPoliceStationReps", permanent: true },
      // SEO landing slugs → canonical county directory URLs (thin-alias avoidance; content lives on /directory/{slug})
      {
        source: "/kent-police-station-representatives",
        destination: "/directory/kent",
        permanent: true,
      },
      {
        source: "/london-police-station-representatives",
        destination: "/directory/london",
        permanent: true,
      },
      {
        source: "/manchester-police-station-representatives",
        destination: "/directory/greater-manchester",
        permanent: true,
      },
      {
        source: "/birmingham-police-station-representatives",
        destination: "/directory/west-midlands",
        permanent: true,
      },
      {
        source: "/liverpool-police-station-representatives",
        destination: "/directory/merseyside",
        permanent: true,
      },
      {
        source: "/leeds-police-station-representatives",
        destination: "/directory/west-yorkshire",
        permanent: true,
      },
      { source: "/maidstone-police-station", destination: "/MaidstonePoliceStationReps", permanent: true },
      { source: "/gravesend-police-station", destination: "/GravesendPoliceStationReps", permanent: true },
      { source: "/medway-police-station", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/sevenoaks-police-station", destination: "/SevenoaksPoliceStationReps", permanent: true },
      { source: "/tonbridge-police-station", destination: "/TonbridgePoliceStationReps", permanent: true },
      { source: "/swanley-police-station", destination: "/SwanleyPoliceStationReps", permanent: true },
      { source: "/canterbury-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/folkestone-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/ashford-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/dover-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/margate-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/sittingbourne-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/tunbridge-wells-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/bluewater-police-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/coldharbour-police-station", destination: "/KentCustodySuites", permanent: true },
      // PSA station pages
      { source: "/maidstone-psa-station", destination: "/MaidstonePoliceStationReps", permanent: true },
      { source: "/sevenoaks-psa-station", destination: "/SevenoaksPoliceStationReps", permanent: true },
      { source: "/swanley-psa-station", destination: "/SwanleyPoliceStationReps", permanent: true },
      { source: "/canterbury-psa-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/folkestone-psa-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/ashford-psa-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/medway-psa-station", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/margate-psa-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/tonbridge-psa-station", destination: "/TonbridgePoliceStationReps", permanent: true },
      { source: "/tunbridge-wells-psa-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/bluewater-psa-station", destination: "/KentCustodySuites", permanent: true },
      { source: "/north-kent-gravesend-police-station", destination: "/GravesendPoliceStationReps", permanent: true },
      { source: "/north-kent-gravesend-psa-station", destination: "/GravesendPoliceStationReps", permanent: true },
      // Police station agent pages
      { source: "/police-station-agent-kent", destination: "/KentPoliceStationReps", permanent: true },
      { source: "/police-station-agent-maidstone", destination: "/MaidstonePoliceStationReps", permanent: true },
      { source: "/police-station-agent-medway", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/police-station-agent-gravesend", destination: "/GravesendPoliceStationReps", permanent: true },
      { source: "/police-station-agent-sevenoaks", destination: "/SevenoaksPoliceStationReps", permanent: true },
      { source: "/police-station-agent-tonbridge", destination: "/TonbridgePoliceStationReps", permanent: true },
      { source: "/police-station-agent-canterbury", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-agent-folkestone", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-agent-ashford", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-agent-dartford", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-agent-sittingbourne", destination: "/KentCustodySuites", permanent: true },
      // Police station rep pages
      { source: "/police-station-rep-maidstone", destination: "/MaidstonePoliceStationReps", permanent: true },
      { source: "/police-station-rep-medway", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/police-station-rep-gravesend", destination: "/GravesendPoliceStationReps", permanent: true },
      { source: "/police-station-rep-sevenoaks", destination: "/SevenoaksPoliceStationReps", permanent: true },
      { source: "/police-station-rep-tonbridge", destination: "/TonbridgePoliceStationReps", permanent: true },
      { source: "/police-station-rep-swanley", destination: "/SwanleyPoliceStationReps", permanent: true },
      { source: "/police-station-rep-canterbury", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-folkestone", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-ashford", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-dartford", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-dover", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-margate", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-sittingbourne", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-bluewater", destination: "/KentCustodySuites", permanent: true },
      { source: "/police-station-rep-tunbridge-wells", destination: "/KentCustodySuites", permanent: true },
      // Solicitor location pages
      { source: "/maidstone-solicitor", destination: "/MaidstonePoliceStationReps", permanent: true },
      { source: "/gravesend-solicitor", destination: "/GravesendPoliceStationReps", permanent: true },
      { source: "/medway-solicitor", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/sevenoaks-solicitor", destination: "/SevenoaksPoliceStationReps", permanent: true },
      { source: "/tonbridge-solicitor", destination: "/TonbridgePoliceStationReps", permanent: true },
      { source: "/swanley-solicitor", destination: "/SwanleyPoliceStationReps", permanent: true },
      { source: "/canterbury-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/folkestone-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/ashford-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/dartford-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/dover-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/chatham-solicitor", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/gillingham-solicitor", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/rochester-solicitor", destination: "/MedwayPoliceStationReps", permanent: true },
      { source: "/bromley-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/margate-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/herne-bay-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/ramsgate-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/deal-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/faversham-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/sandwich-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/whitstable-solicitor", destination: "/KentCustodySuites", permanent: true },
      { source: "/sittingbourne-solicitor", destination: "/KentCustodySuites", permanent: true },
      // Misc legacy pages
      { source: "/psastations", destination: "/KentCustodySuites", permanent: true },
      { source: "/areas", destination: "/PoliceStationRepsByCounty", permanent: true },
      { source: "/policestationreps", destination: "/directory", permanent: true },
      { source: "/accreditedpolicerep", destination: "/AccreditedRepresentativeGuide", permanent: true },
      { source: "/can-we-help", destination: "/Contact", permanent: true },
      { source: "/canwehelp", destination: "/Contact", permanent: true },
      { source: "/what-we-do", destination: "/About", permanent: true },
      { source: "/why-use-us", destination: "/About", permanent: true },
      { source: "/hours", destination: "/Contact", permanent: true },
      { source: "/out-of-area", destination: "/PoliceStationCover", permanent: true },
      { source: "/outofarea", destination: "/PoliceStationCover", permanent: true },
      { source: "/repcover", destination: "/PoliceStationCover", permanent: true },
      { source: "/court-representation", destination: "/CrownCourtFees", permanent: true },
      { source: "/courtrepresentation", destination: "/CrownCourtFees", permanent: true },
      { source: "/extendedhours", destination: "/Contact", permanent: true },
      { source: "/private-crime", destination: "/FAQ", permanent: true },
      { source: "/privatecrime", destination: "/FAQ", permanent: true },
      { source: "/privateclientfaq", destination: "/FAQ", permanent: true },
      { source: "/attendanceterms", destination: "/Terms", permanent: true },
      { source: "/pacerightsguide", destination: "/PACE", permanent: true },
      { source: "/CountyReps", destination: "/PoliceStationRepsByCounty", permanent: true },
      { source: "/FirmProfile", destination: "/legal-services-directory/category/solicitors", permanent: true },
      { source: "/Firms", destination: "/legal-services-directory/category/solicitors", permanent: true },
      { source: "/firms", destination: "/legal-services-directory/category/solicitors", permanent: true },
      { source: "/RepProfile", destination: "/directory", permanent: true },
      { source: "/WikiArticle", destination: "/Wiki", permanent: true },
      { source: "/LegalUpdateDetail", destination: "/LegalUpdates", permanent: true },
      { source: "/login", destination: "/Account", permanent: false },
      { source: "/sign-in", destination: "/Account", permanent: false },
      // Note: /admin is a private dashboard for ADMIN_EMAILS only.
      // Previously redirected to / but now served by app/admin/page.tsx with server-side auth.

      // Payment / checkout redirects (checkout handled via Lemon Squeezy)
      { source: "/FeaturedCheckout", destination: "/Account", permanent: false },
      { source: "/FeaturedSuccess", destination: "/Account?featured=success", permanent: false },
      { source: "/PaymentSuccess", destination: "/Account?featured=success", permanent: false },
      { source: "/PaymentCancel", destination: "/Account", permanent: false },

      // Dev/test/admin pages (internal only — not public)
      { source: "/HealthCheck", destination: "/", permanent: false },
      { source: "/DiagnosticReport", destination: "/", permanent: false },
      { source: "/FinalDiagnosticReport", destination: "/", permanent: false },
      { source: "/ComprehensiveTestSuite", destination: "/", permanent: false },
      { source: "/TestPaywallGuard", destination: "/", permanent: false },
      { source: "/TestStripeFlow", destination: "/", permanent: false },
      { source: "/StripePaymentSimulator", destination: "/", permanent: false },
      { source: "/SubscriptionTest", destination: "/", permanent: false },
      { source: "/EmailTest", destination: "/", permanent: false },
      { source: "/DataEnrichment", destination: "/", permanent: false },
      { source: "/SEOStrategy", destination: "/", permanent: false },
      { source: "/SendablePost", destination: "/Blog", permanent: false },
      { source: "/ForumPost", destination: "/Forum", permanent: false },

      // Additional legacy content paths
      { source: "/importance-of-early-legal-advice", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/no-comment-interview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/prepared-statements", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/preparing-for-police-interview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/what-happens-if-ignore-police-interview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/refusingpoliceinterview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/adverse-inference", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/after-a-police-interview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/afterapoliceinterview", destination: "/InterviewUnderCaution", permanent: true },
      { source: "/police-bail-explained", destination: "/PACE", permanent: true },
      { source: "/released-under-investigation", destination: "/PACE", permanent: true },
      { source: "/dna-fingerprints-police-station", destination: "/PACE", permanent: true },
      { source: "/custody-time-limits", destination: "/PACE", permanent: true },
      { source: "/vulnerable-adults-in-custody", destination: "/PACE", permanent: true },
      { source: "/youth-custody-rights", destination: "/PACE", permanent: true },
      { source: "/appropriate-adult", destination: "/PACE", permanent: true },
      { source: "/booking-in-procedure-in-kent", destination: "/PACE", permanent: true },
      { source: "/arrival-times-delays", destination: "/PACE", permanent: true },
      { source: "/pace-code-c", destination: "/PACE", permanent: true },
      { source: "/can-police-take-my-phone", destination: "/PACE", permanent: true },
      { source: "/case-status", destination: "/Contact", permanent: true },
      { source: "/police-caution", destination: "/Blog", permanent: true },
      {
        source: "/nofurtheractionafterpoliceinterview",
        destination: "/Blog/best-practice-handover-notes-after-police-station-attendance",
        permanent: true,
      },
      { source: "/directory/thames-valley-police", destination: "/StationsDirectory?q=Thames%20Valley%20Police", permanent: true },
      { source: "/directory/british-transport-police", destination: "/StationsDirectory?q=British%20Transport%20Police", permanent: true },
      { source: "/directory/suffolk-constabulary", destination: "/StationsDirectory?q=Suffolk%20Constabulary", permanent: true },
      { source: "/directory/metropolitan-police", destination: "/StationsDirectory?q=Metropolitan%20Police", permanent: true },
      { source: "/directory/south-wales-police", destination: "/StationsDirectory?q=South%20Wales%20Police", permanent: true },
      { source: "/directory/lancashire-constabulary", destination: "/StationsDirectory?q=Lancashire%20Constabulary", permanent: true },
      { source: "/Not%20available", destination: "/legal-services-directory/resources", permanent: true },
      { source: "/Not%20publicly%20available", destination: "/legal-services-directory/resources", permanent: true },
      { source: "/what-to-do-if-a-loved-one-is-arrested", destination: "/PACE", permanent: true },
      { source: "/arrestednow", destination: "/PACE", permanent: true },
      { source: "/arrested-what-to-do", destination: "/PACE", permanent: true },
      { source: "/emergency-police-station-representation", destination: "/PoliceStationCover", permanent: true },
      { source: "/offences-we-deal-with", destination: "/About", permanent: true },
      { source: "/what-is-a-duty-solicitor", destination: "/DutySolicitorVsRep", permanent: true },
      // google03385fbe80cfcd6b verification handled by public/ static file
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

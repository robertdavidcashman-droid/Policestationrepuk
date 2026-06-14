# Schema summary

## policestationrepuk.org (live in this repo)

| Page type | Schema | Location |
|-----------|--------|----------|
| Site-wide | Organization, WebSite | `app/layout.tsx` via `lib/seo-layer/schemas.ts` |
| Blog posts | BlogPosting | `app/Blog/[slug]/page.tsx` |
| County / directory SEO | ItemList, BreadcrumbList | `CountySeoTemplate`, directory pages |
| FAQ | FAQPage | FAQ/static pages where wired |
| Rep profiles | LegalService (where applicable) | Rep detail templates |

**Not used:** Review, AggregateRating (no genuine review feed).

## policestationagent.com (draft)

- LegalService, LocalBusiness, Person (Robert Cashman), Service, FAQPage, BreadcrumbList — include in landing page drafts under `seo-growth/local-seo/policestationagent/`.

## psrtrain.com (draft)

- Course, EducationalOrganization, Article, FAQPage, BreadcrumbList — on training landing drafts.

## custodynote.com (draft)

- SoftwareApplication, FAQPage, HowTo (instructional pages only), BreadcrumbList.

Validate with Google Rich Results Test after publishing each site.

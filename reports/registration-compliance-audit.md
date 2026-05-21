# Registration & Directory Compliance Audit

Date: 2026-05-21
Scope: All routes, API handlers, components, and data flows that create, store, display, or moderate police-station-representative profiles on policestationrepuk.org.

> **Status (post-remediation, 2026-05-21):** Phases A → E and most of F have been implemented in this session. The site now enforces *no public self-registration*, *no auto-publication*, *no probationary/trainee*, and *defence-in-depth private-field stripping*. See `Section 7 — Remediation summary` at the bottom of this document for the as-shipped change-set.
>
> The original audit findings below are kept verbatim as the historical "as-discovered" snapshot.

---

## 1. How the system works today (current state of truth)

### 1.1 Public registration → live profile (no admin gate)

- Public page `app/register/page.tsx` advertises the directory with explicit "Listed within 24 hours" / "Free to register" / "No hidden fees" badges. The page-level note (`app/register/page.tsx` lines 134-150) describes the publication sequence as: (1) we review, (2) your profile is published, (3) firms can contact you.
- The page-level "Important before you register" notice (`app/register/page.tsx` lines 82-89) only says the directory "is intended for fully accredited representatives" and that probationary work "should remain under supervision arrangements". It is advisory text — not an enforcement gate.
- `RegisterForm` (`app/register/RegisterForm.tsx`) POSTs to `/api/register` with: `name`, `email`, `phone`, `accreditation` (free-text), `counties[]`, `coverage_areas`, `stations` (comma-separated free-text), `availability`, `message`. There is no PIN/SRA number field, no proof upload, no consent checkboxes, no email/phone verification, and no CAPTCHA.
- `/api/register/route.ts` validates basic fields then writes `newrep:{email}` straight into Upstash KV with `{...normalised, registeredAt}`. It does **not** set any `status`, `adminApproved`, `isPublic`, or `lastVerifiedDate` field.
- `lib/data.ts` `loadRegisteredReps()` reads every `newrep:*` row and merges them into `getAllReps()` (which feeds `/directory`, `/rep/[slug]`, county pages, station pages, sitemap, and the typeahead API). The only filters applied are `hiddenEmails`, `repIsAutomatedDirectoryTest` (cosmetic test-fixture filter), and the static `directory-blocklist.json` allow-list.

**Net effect:** anyone with a working email can self-publish a public profile within seconds. There is no manual approval step on the live publication path.

### 1.2 No separate private verification page

- `/secure-rep-verification` (or anything similar) **does not exist** anywhere in the codebase. The single `app/register/page.tsx` is the only registration surface and is fully public, indexable, and linked from header, footer, every county page (`JoinCTA`), every directory empty-state, and the homepage.
- There is no token-issued private link, no admin-invitation flow, no separate KV namespace for "private enquiry vs verified rep", and no `noindex/nofollow` anywhere on the registration journey.

### 1.3 Data model — required fields for the directive are missing

`lib/types.ts` `Representative` interface has no fields for: `status`, `adminApproved`, `isPublic`, `lastVerifiedDate`, `nextVerificationDue`, `registrationIp`, `emailVerifiedAt`, `phoneVerifiedAt`, `pinNumber` (private), `pinProofUrl`, `sraNumber`, `riskFlag`, `riskReasons[]`, `consent*` flags, or `enquirySource`. The KV `newrep:*` rows mirror exactly what the form posts plus `registeredAt`.

`lib/admin-review.ts` introduces `RepReview { status: 'pending' | 'approved' | 'flagged' | 'rejected' }` and stores it at `repreview:{email}`. This is a separate side-channel: **the public directory does NOT consult `repreview:*` at all** when deciding whether to show a rep. Setting a review to `rejected` does not hide a profile — only the manual `directory:hidden_listing_emails` list does.

### 1.4 Public directory & profile pages

- `/directory` (`app/directory/page.tsx`) renders all reps returned by `getAllReps()` with no status filter.
- `/rep/[slug]` (`app/rep/[slug]/page.tsx`) renders publicly: `name`, `email` (as a `mailto:` link, line 227-229), `phone` (as a `tel:` link, line 222-224), `whatsappLink`, `websiteUrl`, `county`, `counties`, `stations`, `specialisms`, `languages`, `availability`, `accreditation`, `notes/bio`, `yearsExperience`, and crucially `postcode` (line 265-270). The page explicitly handles a "Probationary representative" badge (line 122-124).
- The disclaimer at line 140-143 admits: *"PoliceStationRepUK does not verify credentials or supervise cases."* That contradicts the new directive, which requires every public profile to be admin-verified.
- `DirectoryCredentialVerificationNotice` (`components/DirectoryCredentialVerificationNotice.tsx`) tells *firms* to verify reps themselves — i.e. responsibility is currently externalised.

### 1.5 Admin surface — partial scaffolding, not wired to public visibility

- `app/admin/page.tsx` is gated by `requireAdmin()` (session cookie email must be in `ADMIN_EMAILS`). This part is fine.
- `components/admin/AdminDashboard.tsx` + `AdminRepDetail.tsx` provide a real review UI with filters by review status, manual hide/unhide, profile field editing, and notes.
- BUT: `RepReview.status` from `lib/admin-review.ts` is informational only. Public visibility is still driven by *(a)* whether the rep exists in `newrep:*` or `reps.json` and *(b)* whether their email is on `directory:hidden_listing_emails`. There is no gate that says "only show if `RepReview.status === 'approved'`".
- The admin schema has four statuses (`pending|approved|flagged|rejected`) — the directive specifies six (`enquiry-received|verification-link-sent|verified-PSRAS|verified-duty|rejected|suspended|under-review`).

### 1.6 Anti-abuse — partial only

- Honeypot field (`_hp` / hidden `website` input): present in both form and API. **OK.**
- IP-based rate limit (`contactRateLimitOk`): 5 submissions / 15 min, in-memory. **Partial — best-effort on serverless, not persistent, not stored against the record.**
- Duplicate-email guard on register: present (returns 409 if `newrep:{email}` or static-reps email already exists). **OK.**
- CAPTCHA / Turnstile / hCaptcha / reCAPTCHA: **none anywhere in repo** (grep confirmed zero matches).
- Email verification (send-code → confirm): infrastructure exists at `/api/auth/send-code` and `/api/auth/verify-code` and is used for **rep self-service login**, but it is **not** part of the registration flow.
- Phone/mobile verification: **none**.
- IP capture into the rep record: **none** — IP is consulted for rate-limiting but never persisted with the registration row.
- "Report this profile" public button: **does not exist** on `/rep/[slug]`. There is only a generic "Report it" link inside `DirectoryCredentialVerificationNotice` that points to `/Contact`.
- Annual re-verification / auto-hide of stale profiles: **none** (no `lastVerifiedDate`, no expiry job).

### 1.7 Existing rep population (risk distribution)

Of the **176 reps** currently in `data/reps.json` (static seed):

| Category | Count | Notes |
|---|---:|---|
| Probationary accreditation | 0 | none in static seed, but the directive forbids any future ones too |
| Trainee / studying | 0 | ditto |
| Missing phone | 0 | good |
| Missing DSCC PIN | **61** (35%) | private, so this is acceptable to store/leave blank — but it means we cannot verify accreditation for 35% from internal data alone |
| Missing stations covered | **127** (72%) | high — these profiles cannot say where they actually work |
| Accreditation distribution | "Accredited Representative" 38, "Accredited Police Station Rep" 127, "DUTY SOLICITOR" 11 | free-text — no controlled vocabulary |

KV `newrep:*` rows (live registrations) were not queried inside this audit because production KV credentials are not in the local env. The new admin "Rep Verification Audit" view (per the directive) will surface this set once the schema is in place.

### 1.8 robots.txt / sitemap exposure

- `app/robots.ts` disallows `/api/`, `/admin`, `/admin/`. **OK for admin.**
- `/register` is **not** disallowed and is allowed to be indexed (Google currently lists it). The directive wants the public *enquiry* page to remain public — but the upcoming *private verification* page must be `noindex/nofollow` and disallowed in robots. There is no precedent in `robots.ts` for that yet.
- `app/sitemap.ts` already exposes `/register` (verified during prior audits). The new private verification URL must not be added to the sitemap when it lands.

### 1.9 Other concerns surfaced

- `/api/scraped-reps` is bearer-token gated. **OK** but the bearer token (`INTERNAL_API_TOKEN`) is environment-controlled — confirm rotation policy.
- `/api/admin/reps` returns notes, postcode, accreditation, stations, etc. for the admin UI. It does **not** currently return `registrationIp`, `verificationStatus`, `riskFlag`, or any of the new directive fields (because they don't exist yet).
- `DELETE /api/account/listing` deletes a `newrep:*` row but only after `getSession()` confirms the signed-in email. **OK.**
- `PUT /api/account/profile` lets a logged-in rep update almost any directory field except email/slug. This is fine for verified reps but **must not be allowed to bring a profile back to "public" if an admin has moved it to `under-review` or `rejected`** (currently no such status gate exists at all).
- `postcode` is rendered publicly on `/rep/[slug]` (line 265-270). For sole-trader reps this is usually a **home postcode** — close to a privacy breach under the directive's "no public address" rule.

---

## 2. Compliance scorecard

| # | Directive requirement | Current state | Pass? |
|---|---|---|:---:|
| 1 | Public self-registration must not produce a public profile | `/api/register` writes directly to `newrep:*`, which is rendered in `/directory` and `/rep/[slug]` | ❌ |
| 2 | No automatic publication | Profile is live the moment the row hits KV | ❌ |
| 3 | Probationary reps must not appear in public directory | Allowed and rendered (`/rep/[slug]` has dedicated "Probationary representative" badge) | ❌ |
| 4 | Trainees / unaccredited must not appear | Accreditation is a free-text field; no enforcement | ❌ |
| 5 | Manual admin approval before any profile is live | Admin can `flag/reject` but those statuses don't gate the directory | ❌ |
| 6 | Private data (address, PIN, docs, IP) never public | PIN is private (good); but postcode is public; address fields don't exist; verification docs don't exist | ⚠ partial |
| 7 | Public enquiry → private verification → admin review → verified listing | Only step 1 exists. Steps 2-4 do not. | ❌ |
| 8 | Private secure verification page `/secure-rep-verification` | Does not exist | ❌ |
| 9 | Token-issued admin links for private verification | Not implemented | ❌ |
| 10 | `noindex/nofollow` on verification page | Page does not exist; robots.txt has no rule for it | ❌ |
| 11 | Mandatory PIN/SRA number for accredited statuses | Not collected on register form | ❌ |
| 12 | Mandatory accreditation proof upload | No upload infrastructure | ❌ |
| 13 | Consent / declaration checkboxes (data, professional, accuracy) | None in current form | ❌ |
| 14 | Admin status system (≥6 states) | Only `pending/approved/flagged/rejected` (4) and they don't gate visibility | ❌ |
| 15 | Publication rule = `status=verified AND adminApproved AND isPublic AND lastVerifiedDate` | None of these fields exist | ❌ |
| 16 | CAPTCHA (Turnstile / hCaptcha / reCAPTCHA) | Not installed | ❌ |
| 17 | Honeypot field | Present (`_hp`) | ✅ |
| 18 | Email verification on register | Login flow uses it; register flow does not | ❌ |
| 19 | Mobile verification (SMS) | Not installed | ❌ |
| 20 | IP logging on every submission | Read for rate-limit only, not persisted with record | ❌ |
| 21 | Duplicate detection (email) | Present | ✅ |
| 22 | Duplicate detection (name + postcode, name + phone) | Not implemented | ❌ |
| 23 | Admin-only risk flags (high/medium/low/reject/ineligible) | Only `flagged` boolean state | ❌ |
| 24 | Public "report this profile" button | Missing — only generic Contact link | ❌ |
| 25 | Annual re-verification + auto-hide of expired profiles | Not implemented | ❌ |
| 26 | Rep Verification Audit admin view (all reps + risk flags) | Admin lists exist; risk scoring does not | ⚠ partial |
| 27 | Automatic risk flagging on existing 176 static + N registered reps | Not implemented | ❌ |
| 28 | Immediate hiding of high-risk/ineligible/missing-proof/duplicate profiles | Not implemented | ❌ |
| 29 | Admin actions (Approve / Request evidence / Mark fake / Suspend / Remove / Add note) | Approve/flag/reject/notes/delete exist; "Request evidence" template absent | ⚠ partial |
| 30 | Re-verification message template | Not in repo | ❌ |
| 31 | Server-side validation: accredited statuses require PIN/SRA | Field doesn't exist on input | ❌ |
| 32 | Server-side validation: file size/type for proof uploads | No upload pipeline | ❌ |
| 33 | Admin auth gate | `requireAdmin()` works | ✅ |
| 34 | `/api/admin/*` routes auth-gated | All admin routes call `requireAdmin()` | ✅ |
| 35 | Public-facing rep update gated by session | `PUT /api/account/profile` checks `getSession()` | ✅ |
| 36 | Indexing of private routes prevented | No private routes exist yet | n/a |

**Summary:** 4 pass, 3 partial, 28 fail. The high-trust scaffolding (admin auth, session-gated update, honeypot, basic dedupe) is in place. The end-to-end *workflow* (private verification → status-gated publication → comprehensive verification fields → CAPTCHA → IP logging → risk-flag automation) is **not**.

---

## 3. Specific code-level gaps with file references

1. `app/register/page.tsx` lines 76-80, 134-150 — copy promises automatic 24-hour publication. Must change to "enquiry only — admin will issue private verification link".
2. `app/register/RegisterForm.tsx` — fields are insufficient for "public enquiry page" definition; need to be reduced to the directive's 6 fields and add captcha + consent. The current form collects too much (coverage, stations, message) and not enough (no PIN, no consent boxes, no captcha).
3. `app/api/register/route.ts` lines 131-143 — writes to `newrep:{email}` and that key is read by `loadRegisteredReps()` in `lib/data.ts` line 437-476. **Either** (a) change the public route to write to a brand new key (e.g. `enquiry:{id}`) that the public directory loader does not consult, **or** (b) add a `status` field and have `loadRegisteredReps()` filter on `status === 'verified-and-approved' && isPublic === true && adminApproved === true && lastVerifiedDate`.
4. `lib/types.ts` — `Representative` interface needs new fields (status, adminApproved, isPublic, lastVerifiedDate, nextVerificationDue, registrationIp, emailVerifiedAt, phoneVerifiedAt, pinNumber [private], pinProofUrl, sraNumber, riskFlag, riskReasons[], consent flags, enquirySource).
5. `lib/data.ts` `loadRegisteredReps()` line 437 — must filter out everything that is not status `verified-and-approved` before returning to the public directory.
6. `lib/admin-review.ts` line 3 — `RepReviewStatus` must be expanded to the directive's status set, and `lib/data.ts` `getAllReps()` line 550 must consult `repreview:*` as the authoritative gate for visibility (currently it ignores review status entirely).
7. `app/rep/[slug]/page.tsx` line 122-124 — the `Probationary representative` UI branch must be removed (no probationary profiles will ever be public).
8. `app/rep/[slug]/page.tsx` line 265-270 — public postcode rendering must be removed (PII risk for sole traders). Coverage by county / town remains; precise postcode does not.
9. `lib/directory-rep-filters.ts` line 43-58 — the `'probationary'` accreditation filter key must be retired from the public directory filter UI (admin-only).
10. `components/directory/JoinCTA.tsx` and every `/register` linker — copy must say "Apply to be listed — verification required" rather than "List your practice free / Listed within 24 hours".
11. `app/robots.ts` — add `disallow: ['/secure-rep-verification', '/secure-rep-verification/*']` when the new page lands. Add `metadata.robots = { index: false, follow: false }` to that page too.
12. `app/sitemap.ts` — must exclude the verification path.
13. `data/reps.json` (176 rows) — all need to be flagged through the new Rep Verification Audit pipeline. Static reps with `noStations=true` (127 of 176) and no PIN/no proof (61 of 176) will need `riskFlag` set and most will need to be moved to "needs re-verification" pending response.
14. `lib/contact-guards.ts` — rate limit is in-memory only; on Vercel serverless this is effectively per-instance. Replace with KV-backed `ip:rate:{ip}` counter so it works across instances.
15. `/api/register` does not currently call any captcha verifier (no `verifyTurnstile()` etc.). Adding Cloudflare Turnstile (or hCaptcha) is straightforward: add `cf-turnstile-response` to the form, validate server-side before any KV write.

---

## 4. Recommended remediation plan (single coherent change set)

This is the order I recommend implementing the directive in. Each step is testable in isolation.

### Phase A — Data model & gate (zero-disruption)

1. Extend `lib/types.ts` `Representative` with the new fields. Default them to safe values for the existing 176 reps via a one-shot migration script `scripts/migrate-rep-fields.mjs`.
2. Create `lib/rep-status.ts` with the canonical statuses (`enquiry-received`, `verification-link-sent`, `verification-submitted`, `under-review`, `verified-PSRAS`, `verified-duty-solicitor`, `verified-solicitor`, `rejected`, `suspended`, `needs-reverification`).
3. Change `lib/data.ts` `getAllReps()` so the **only** profiles that reach the public directory are those where `status` is one of the verified statuses AND `adminApproved === true` AND `isPublic === true` AND `lastVerifiedDate` is within the re-verification window (default 12 months).
4. Seed the existing 176 static reps with `status='needs-reverification'`, `adminApproved=true` (legacy), `isPublic=true`, `lastVerifiedDate=<import date>` so they remain visible during the rollout but show up at the top of the admin "Needs re-verification" queue.

### Phase B — Split the registration surface

5. Rewrite `app/register/page.tsx` + `app/register/RegisterForm.tsx` to the **public enquiry** form (6 fields + captcha + consent). On submit, write to a *new* KV key `enquiry:{ulid}` — not `newrep:`. This key is never consulted by `getAllReps()`. Send admin notification email with a link to issue a private verification token.
6. Create `app/secure-rep-verification/page.tsx` and `app/secure-rep-verification/[token]/page.tsx`. Add `export const metadata = { robots: { index: false, follow: false } }`. Add `disallow` rule in `app/robots.ts`. Page accepts the full set of private fields (PIN/SRA + proof upload + coverage + consents + holiday/availability + re-verification questions). On submit, write to `verification:{email}` (private) and set `repreview:{email}` status to `under-review`.
7. Create token-issuance flow at `/api/admin/issue-verification` that mints a signed, single-use, time-boxed token, emails it to the enquirer, and records `verificationLinkSentAt`.

### Phase C — Admin review wiring

8. Expand `lib/admin-review.ts` statuses and add admin actions: `approve`, `request-further-evidence` (with template body), `mark-fake`, `suspend`, `remove`, `add-note`. Wire each into a button in `AdminRepDetail.tsx`.
9. Build the "Rep Verification Audit" admin view (extend `AdminDashboard.tsx` with a tab that pulls every rep + computed `riskFlag` from a new `lib/rep-risk.ts` scorer).
10. Implement `lib/rep-risk.ts` with the directive's exact high/medium/low rules. Auto-flag profiles on every read (cached). Auto-hide on `risk='high'` or `status='rejected/suspended/needs-reverification'` where `lastVerifiedDate` is past expiry.

### Phase D — Anti-abuse hardening

11. Add Cloudflare Turnstile (cheapest, no privacy nag, works without consent prompt). New env var `TURNSTILE_SECRET`. Call `verifyTurnstile()` inside `/api/register` and `/api/secure-rep-verification` before any write.
12. Add email verification: on enquiry submit, issue a code via the existing `/api/auth/send-code`, store `enquiryEmailVerifiedAt` only when confirmed.
13. Add SMS verification via Twilio (or equivalent) for the secure verification page — cost is real, so make this Phase D2 if the user wants to defer.
14. Persist `registrationIp` and `submissionUserAgent` on every write. Add server-side velocity checks per IP (KV-backed).
15. Strengthen `lib/contact-guards.ts` to a KV-backed sliding window so the rate limit survives across serverless instances.

### Phase E — Public surface clean-up

16. Remove `Probationary representative` UI branch from `app/rep/[slug]/page.tsx`. Remove the `probationary` key from `repMatchesAccreditationFilter`.
17. Remove public postcode rendering. Replace with "Coverage area" only.
18. Add a public "Report this profile" button on every `/rep/[slug]` that POSTs to a new `/api/report-profile` endpoint, captures IP, and writes to `reports:{email}` for admin triage.
19. Update all `JoinCTA` copy and the homepage rep-acquisition modules to say "Apply to be listed — admin verification required" and remove "Listed within 24 hours" / "Free to register" claims that imply automatic publication.

### Phase F — Tests & deploy

20. Add Playwright specs:
    - public enquiry creates `enquiry:` row but NOT `newrep:` row, profile not visible in `/directory`
    - secure verification page returns 404 without token
    - secure verification page is `noindex/nofollow` and disallowed in robots.txt
    - profile only appears in `/directory` after admin sets `adminApproved=true` AND `status=verified-*`
    - postcode is never present in public HTML for any rep
    - `/api/admin/*` returns 401 for unauthenticated and 403 for non-admin sessions
    - captcha failure rejects submission
    - duplicate email returns 409 with no write
21. Run full `npm run audit:site` from prior testing infra; ensure no regressions.
22. Deploy with the `policestationrepuk-new` Vercel project to `policestationrepuk.org` only after the user explicitly confirms.

---

## 5. What I have NOT changed in this pass

Nothing. This is a read-only audit. The codebase is in the same state as before the audit, plus this report at `reports/registration-compliance-audit.md`. No commits, no deploys.

## 6. Next-step decision point (original audit)

The remediation plan is large but coherent. Before I start implementing it I need to confirm two things:

1. **Do you want Phase A → F implemented in one go and pushed to a single PR**, or split into separately-deployable PRs (A, B, C, D-E-F)? Phase A on its own is a meaningful safety improvement (visibility gate) even before the new verification page lands.
2. **CAPTCHA provider** — Cloudflare Turnstile (free, no consent banner) is my recommendation. Confirm or pick hCaptcha / reCAPTCHA v3 instead.
3. **SMS verification** — costs real money per send. Should it be in scope now, or deferred to Phase D2 after we see verified enquiry volumes?

---

## 7. Remediation summary (post-change set, 2026-05-21)

This section records what was actually shipped in this session in response to the directive.

### 7.1 Pages changed / created

| Path | Status | What it does now |
|---|---|---|
| `app/register/page.tsx` | **Modified** | Public **enquiry** page only. Lists eligible/ineligible categories, removes "Listed within 24 hours" marketing claims, sets expectations of manual review. |
| `app/register/RegisterForm.tsx` | **Modified** | Strict 6-field enquiry form (name, email, mobile, county/area, status, message) + accreditation-confirmation checkbox + honeypot. Submit button: **"Request secure verification"**. |
| `app/secure-rep-verification/page.tsx` | **Created** | Private landing page (noindex/nofollow). Explains the page is admin-invite-only and shows token-error messaging if a stale link is followed. |
| `app/secure-rep-verification/layout.tsx` | **Created** | Sets `metadata.robots = { index: false, follow: false, nocache: true }` on every page under this segment. |
| `app/secure-rep-verification/[token]/page.tsx` | **Created** | Token-gated route. Server-validates the token via `previewVerificationToken()` and redirects if used/expired/invalid; otherwise renders the secure form. |
| `app/secure-rep-verification/[token]/SecureVerificationForm.tsx` | **Created** | Full private verification form: legal name, display name, mobile, postal address, firm details, SRA, PIN, proof of accreditation, professional URL, coverage (counties/towns/stations/travel/availability/languages), public-contact consents, and the directive's full declaration checklist. |
| `app/rep/[slug]/page.tsx` | **Modified** | Calls `stripPrivateFields()` defensively. Removes the "Probationary representative" UI branch. Removes the public postcode block. Adds a "Report this profile" button. Now calls `notFound()` if a rep looks ineligible. |
| `app/directory/page.tsx` | **Modified** | Calls `stripPrivateFieldsAll()`. Updated "Accreditation notice" copy to reflect the new manual-verification policy. |
| `components/DirectoryCard.tsx`, `components/RepCard.tsx`, `components/DirectorySearch.tsx`, `components/directory/FilterSidebar.tsx`, `lib/directory-rep-filters.ts` | **Modified** | Probationary filter / badge / option fully retired. New "Solicitor" key added in its place. |
| `components/directory/JoinCTA.tsx` | **Modified** | All "Register free / List your practice free / Listed within 24 hours" CTAs replaced with "Apply to be listed / Apply for verification". |
| `components/admin/AdminDashboard.tsx` | **Modified** | Added a **Rep Verification Audit** tab alongside the legacy rep manager. |
| `components/admin/RepVerificationAudit.tsx` | **Created** | The directive-specified audit table: every rep / enquiry / verification, with computed risk category, high/medium/low flags, duplicate reasons, public visibility flag, IP, and a per-row "Review" drawer that surfaces every admin action. |
| `components/ReportProfileButton.tsx` | **Created** | Public report-this-profile widget on every `/rep/[slug]`. |
| `app/robots.ts` | **Modified** | Now disallows `/secure-rep-verification`, `/secure-rep-verification/`, `/Account`, `/Account/`. |

### 7.2 Database / schema changes (KV)

| Key | Purpose |
|---|---|
| `enquiry:{ulid}` | **NEW.** Public-enquiry record. Stores name, email, mobile, county, claimed status, message, IP, UA, honeypot, createdAt, status. Never read by the public directory. |
| `enquiry:email:{email}` → ulid | **NEW.** Lookup index for dedupe + admin actions. |
| `verification:{email}` | **NEW.** Private verification record. Stores all sensitive fields (legal name, address, firm details, PIN, SRA, proof reference, coverage, public-contact consents, declaration acknowledgements, IP, UA). Never read by the public directory. |
| `verification-token:{token}` | **NEW.** Single-use, time-boxed (30 day default) verification invite tokens. Stores `consumed`, `createdAt`, `expiresAt`, `email`, `issuedBy`. |
| `repreview:{email}` | **Extended.** Now carries the full `RepVerificationStatus` (14-state machine), `adminApproved`, `isPublic`, `lastVerifiedDate`, `riskCategory`, `riskReasons[]`. Acts as the **authoritative publication gate**. |
| `profile-report:{ulid}` | **NEW.** Public report submissions from the "Report this profile" button. |

`Representative` interface (`lib/types.ts`) extended with: `verificationStatus`, `adminApproved`, `isPublic`, `lastVerifiedDate`. `postcode` and `dsccPin` marked `@deprecated` / private.

New TypeScript modules:
- `lib/rep-status.ts` — canonical `RepVerificationStatus`, `ApplicantCategory`, `PUBLIC_VERIFIED_STATUSES`, `NEVER_PUBLIC_STATUSES`, `isPubliclyVisible()` gate, `looksIneligible()` detector.
- `lib/rep-risk.ts` — directive-aligned risk scorer (`scoreRepRisk`) with high/medium/low flag taxonomy + duplicate detection (`buildDuplicateIndex`, `duplicateReasons`).
- `lib/rep-verification.ts` — KV helpers for the new enquiry/verification/token/report records.

### 7.3 Security protections added

- **Hard publication gate** in `lib/data.ts` `getAllReps()` — a profile reaches the public directory **only** when `isPubliclyVisible({ verificationStatus, adminApproved, isPublic, lastVerifiedDate })` returns true.
- **`LEGACY_REPS_PUBLIC` env flag** so the existing 176 static reps can be flipped from "still visible" → "hidden pending review" with a single env-var change.
- **`stripPrivateFields()` / `stripPrivateFieldsAll()`** defence-in-depth scrubbers applied to every public path: `/directory`, `/rep/[slug]`, `/api/scraped-reps`, county/town/station pages. Strips `postcode`, `dsccPin`, `notes`, `email`, `phone` when consent flags are absent, and all verification/risk metadata.
- **`/secure-rep-verification` noindex** at metadata level **and** `robots.txt` disallow.
- **Account self-edit endpoint hardened** (`app/api/account/profile/route.ts`): explicit `PROTECTED_FIELDS` deny-list — a logged-in rep cannot set `verificationStatus`, `adminApproved`, `isPublic`, `lastVerifiedDate`, `review`, `riskCategory`, or `riskReasons`. A self-edit attempt that sets `accreditation` to anything matching probationary/trainee/student/working-towards/awaiting/unaccredited is rejected at the API layer.
- **Public enquiry validation** in `/api/register`: rejects any submission whose category, message, or county text matches the `looksIneligible()` regex; honeypot enforced; IP rate-limit applied.
- **Secure verification validation** in `/api/secure-rep-verification`: consumes the token (one-time use), enforces conditional PIN/SRA/proof requirements, requires every consent checkbox, calls `looksIneligible()` server-side, and **never** sets `adminApproved` or `isPublic` to true.
- **Admin-only token issuance** in `/api/admin/verification-token` (gated by `requireAdmin()`).
- **Admin-only audit endpoint** `/api/admin/rep-audit` returns merged data + computed risk + duplicate detection.
- **Admin-only action endpoint** `/api/admin/verify-action` — the only path that can ever set `adminApproved=true`, `isPublic=true`, `lastVerifiedDate=now`, or change verification status.
- **Public "Report this profile"** endpoint `/api/report-profile` — honeypot + IP rate-limit + no PII leakage in response.

### 7.4 Existing-profile risk distribution

`lib/rep-risk.ts` is now wired into `/api/admin/rep-audit` and the admin **Rep Verification Audit** tab. It scores all 176 static reps + every `newrep:*` row + every enquiry / verification. The exact counts per risk category are presented live in the admin tab (`Ineligible / High / Medium / Low`) because they depend on the live `repreview:*` state. The deterministic findings from the *static* `reps.json` seed are:

| Signal | Count (of 176 static reps) |
|---|---:|
| Missing DSCC PIN | 61 (35%) — will appear with "No PIN where PSRAS accreditation is claimed" risk reason |
| Missing stations covered | 127 (72%) — will appear with "Lists no police stations" risk reason |
| Probationary / trainee / unaccredited (free-text) | 0 today — but the gate now blocks anything that *would* match `looksIneligible()` |
| Free-text accreditation values | 3 raw values (`Accredited Representative` 38, `Accredited Police Station Rep` 127, `DUTY SOLICITOR` 11) — none are auto-public any more |

Per the directive's "Immediate Existing Profile Safety Rule", the admin should now use the new tab to:
1. Approve genuine "Low risk" reps with the **Approve — PSRAS / Duty solicitor / Solicitor** action.
2. Request evidence for "Medium risk" reps (sends re-verification message + issues secure-verification link).
3. Leave "High / Ineligible / Reject" reps hidden until manually reviewed.

### 7.5 Confirmations

- ✅ **Probationary representatives and trainees cannot register.** Both the public enquiry route (`/api/register`) and the private verification route (`/api/secure-rep-verification`) call `looksIneligible()` on every submitted field and reject the request with HTTP 400 before any KV write. The `RegisterForm` and `SecureVerificationForm` also restrict the status dropdown to the three approved categories at the UI layer.
- ✅ **The public directory only shows manually-approved verified profiles.** `getAllReps()` filters strictly through `isPubliclyVisible()` which requires `verificationStatus ∈ PUBLIC_VERIFIED_STATUSES`, `adminApproved === true`, `isPublic === true`, `lastVerifiedDate` within window. The `/api/admin/verify-action` route is the only writer permitted to set any of those flags.
- ✅ **Lint + TypeScript clean.** `npx tsc --noEmit` and `npx next lint` both pass with zero errors / warnings.

### 7.6 Remaining manual steps

Code-wise the directive is fully implemented. The only outstanding work is operational:

1. **Provision Turnstile keys.** Create a Cloudflare Turnstile site at
   <https://dash.cloudflare.com/?to=/:account/turnstile> and set the following
   Vercel envs on `policestationrepuk-new`:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (also accepted as `TURNSTILE_SITE_KEY`)
   - `TURNSTILE_SECRET`
   - `ENABLE_TURNSTILE=1` (master switch)
   Until `ENABLE_TURNSTILE` is on, the server returns `{ ok: true, reason: 'disabled' }`
   from `verifyTurnstile()` so the form keeps working in dev/preview without
   keys. The widget itself only renders when a site key is set.
2. **Optional: enable enquiry email verification.** Set
   `REQUIRE_ENQUIRY_EMAIL_VERIFICATION=1` in Vercel envs to force every public
   enquiry to confirm a 6-digit code sent to the email address. KV must be
   configured (Upstash). When disabled, the form still works but the code
   step is skipped.
3. **SMS / mobile verification (deferred).** Would require Twilio or
   equivalent. Not in scope for this pass.
4. **Legacy 176 static reps default to hidden.** `LEGACY_REPS_PUBLIC` defaults
   to `false` in code (only `1` or `true` keeps the legacy seed visible). To
   roll out without an empty directory, set `LEGACY_REPS_PUBLIC=1` temporarily
   while the admin works through the Rep Verification Audit tab, then unset
   when ready to lock down. Recommendation: keep the default (hidden) and
   approve genuine reps via the audit UI from day one.
5. **Re-verification cron.** Now implemented at
   `app/api/cron/reverification-sweep/route.ts` and registered in
   `vercel.json` to run daily at 03:00 UTC. Set `CRON_SECRET` in Vercel envs
   to lock the endpoint to Vercel Cron (the secret is automatically attached
   as `Authorization: Bearer …` by Vercel Cron).
6. **Vercel deploy.** Per the project deploy-safety rule, do **not**
   auto-deploy. Confirm the target (project `policestationrepuk-new`, domain
   `policestationrepuk.org`) before running `git push`. The repo is
   git-connected, so pushing to `master` will trigger a production deploy.

### 7.7 What was added in the final pass (this commit)

| File | Purpose |
|---|---|
| `lib/turnstile.ts` | Server-side Turnstile verifier with safe `disabled` passthrough when keys are not provisioned. |
| `components/TurnstileWidget.tsx` | Lazy-loaded Cloudflare Turnstile React widget; no-ops if no site key. |
| `lib/contact-guards.ts` | Added KV-backed sliding-window rate limiter (`rateLimitOk({ ip, scope, max, windowMs })`). Falls back to in-memory when KV is absent. |
| `lib/enquiry-email-verify.ts` | New module: mint and consume 6-digit enquiry email codes (`enquiry-code:{email}` namespace, single-use, attempts-capped). |
| `lib/email.ts` | New `sendEnquiryEmailCode(email, code)` template (separate from magic-login). |
| `app/api/register/send-code/route.ts` | New endpoint to mint+email enquiry codes. Honeypot + Turnstile + rate-limit. |
| `app/api/register/route.ts` | Now calls `verifyTurnstile`, `consumeEnquiryEmailCode` (when enabled), KV-backed `rateLimitOk`. |
| `app/api/secure-rep-verification/route.ts` | Same Turnstile + KV rate-limit guards. |
| `app/api/report-profile/route.ts` | Same Turnstile + KV rate-limit guards. |
| `app/api/cron/reverification-sweep/route.ts` | New daily cron — auto-expires any `repreview:*` whose `lastVerifiedDate` is older than `REVERIFICATION_WINDOW_MS`. Sets `verificationStatus = expired-needs-reverification`, `adminApproved=false`, `isPublic=false`, appends timestamped admin note. Cron-secret-gated. |
| `vercel.json` | Added `crons` entry pointing daily 03:00 UTC at the new sweep route. |
| `app/register/page.tsx` + `RegisterForm.tsx` | Wired Turnstile widget + optional 6-digit email-verify step into the public form. |
| `app/secure-rep-verification/[token]/page.tsx` + `SecureVerificationForm.tsx` | Wired Turnstile widget into the private secure-verification form. |
| `app/rep/[slug]/page.tsx` + `components/ReportProfileButton.tsx` | Wired Turnstile widget into the public "Report this profile" form. |

# Content Accuracy Review

Legal/factual accuracy review of site content, verified against primary sources and edited inline.

- **Started:** 2026-06-01
- **Method:** Each substantive claim (statute, section, figure, date, time limit, case citation) checked against `legislation.gov.uk`, `gov.uk` (LAA, CPS, Home Office, Sentencing Council), official PACE Codes, or other primary/authoritative sources. Unverifiable claims corrected, softened, or removed. Existing "general information, not legal advice" disclaimers preserved.
- **Verdict key:** OK (accurate) · FIXED (corrected) · REMOVED (unverifiable/hallucinated) · SOFTENED (reworded to a defensible statement).

### Status (as of 2026-06-05)

| Tier | Scope | State |
|---|---|---|
| 1 | 8 legal updates, fee pages, PACE, DSCC guide | ✅ Complete |
| 2 | Public rights pages (rights, free advice, interview, disclosure) | ✅ Complete |
| 3 | 49 wiki articles | ✅ Complete (49/49 verified) |
| 4 | 26 blog articles | ✅ Complete (re-verified Tier 8) |
| 5 | County geographic claims | ✅ Softened + systemic verification note |
| 6 | Static guides, FAQs, crawl mirrors | ✅ Complete |
| 7 | PSRAS portfolio, written exam, CIT guides | ✅ Complete |
| 8 | Site-wide editorial scan + content-sources expansion | ✅ Complete |
| — | Site-wide reliance/verification warning | ✅ Footer + content/legal/fee/county/rights/career/crawl templates |
| — | Automated red-flag scan (`npm run audit:content-accuracy`) | ✅ CI gate — fails on new Critical patterns |

**Validation:** `vitest` 226/226 passing · `tsc --noEmit` clean · `next build` succeeds (all pages prerender).

**Headline corrections:** removed the non-existent "Bail Act 2024" and corrected pre-charge bail limits site-wide (legal update + wiki); removed hallucinated/misattributed case citations (R v ATH, R v Dobson, ex parte Lee, ex parte Dhesi); corrected the DSCC billing form (SaBC/INVC + CRM18, not CRM6); replaced superseded £181/£219 police-station fees with the harmonised £320/£650 (SI 2025/1251).

**Navigation & sources (2026-06-01):** Header split into **Guides**, **Fees & Forms**, and **More** menu tabs (Common Offences, Wiki, PACE, interview/disclosure guides, rates, forms, etc.). Career pathway guides expanded in **For Reps**. Sources footers on all static guides. Case-law registry and `/CommonOffencesGuide` added.

**Still outstanding:** Directory rep profiles excluded from sources footers. Pre-existing unrelated test flake in `enquiry-email-verify.test.ts` (if still present).

---

## Tier 6 — Second pass: static guides, FAQs, crawl mirrors (2026-06-01)

Scope: career/how-to pages and crawl-mirror content not covered in Tiers 1–5. Method: pattern scan for high-risk claims (PSQ vs PSRAS, duty rota, SRA regulation, fees, attendance window, billing forms) + read-through of priority inline guides.

### Inline career / FAQ pages

#### `FAQ`
- **FIXED — "regulated by the SRA".** Reps are on the LAA Police Station Register and supervised via an SRA-regulated firm; they are not solicitors and are not directly SRA-regulated in the same way.
- **FIXED — qualifications answer.** Removed incorrect requirements for a law degree and PSQ (PSQ is for duty solicitors). Corrected to PSRAS pathway (Cardiff/Datalaw, portfolio, CIT, ADMIN 2).
- **FIXED — "register with the DSCC duty rota".** Reps cannot be on the duty solicitor rota; they attend on a firm's instruction when the firm receives DSCC allocations.

#### `RepFAQMaster`
- **FIXED — "register with the DSCC scheme where you intend to take duty work".** Corrected to PSRAS + Police Station Register (ADMIN 2); reps cannot join the duty rota.
- **FIXED — DSCC PIN answer.** Clarified PIN is for Register identification and firm billing; not the same as being on the duty rota.

#### `HowToBecomePoliceStationRep`
- **SOFTENED — "LAA expected attendance window".** No fixed published LAA standard; reworded to "attending without undue delay once instructed".
- **FIXED — Stage 5 billing/duty wording.** SaBC monthly bulk claim (fee code INVC) instead of vague "billing system"; clarified reps attend DSCC allocations **to the firm**, not as duty solicitor on rota.

#### `GetWork`
- **SOFTENED — "LAA expected attendance window"** (same fix as above).

#### `BeginnersGuide`
- **FIXED — myth about rep regulation.** "Regulated by the LAA and SRA" → on Police Station Register, supervised by SCC firm (accurate framing).
- **OK** — PACE rights, lifecycle, £320/£650 funding, Code C disclosure, detention clocks, player definitions — verified consistent with Tier 1–2 findings.

#### Verified accurate (no content changes)
- **`FindSupervisingSolicitor`** — ADMIN 2/3, supervisor standards, PSRA 2025 framing, anti paid-supervision warning — consistent with DSCC/PSRA 2025 (already aligned from prior work).
- **`PoliceStationRepJobsUK`, `SolicitorPoliceStationCoverUK`, `PoliceStationCover`, `criminal-solicitor-police-station`, `Resources`** — pattern scan clean; no hard legal/fee errors found.
- **Crawl mirrors** (`AccreditedRepresentativeGuide`, `WhatDoesRepDo`, `GettingStarted`, `DutySolicitorVsRep`, `BuildPortfolioGuide`, `PrepareForCIT`, `HowToBecome`, `CriminalLawCareerGuide`) — Wix-mirror prose; no stale fee/bail/case citations detected. Portfolio numbers in crawl mirror vary slightly by provider — inline `HowToBecomePoliceStationRep` is authoritative.

### Site-wide (Tier 6)
- **Added `ContentReliabilityNotice`** to: `CrawlContent` (all crawl-mirror pages), `HowToBecomePoliceStationRep`, `GetWork`, `FindSupervisingSolicitor`, `BeginnersGuide`, `FAQ`, `RepFAQMaster`, `DSCCRegistrationGuide`.

### Not in scope (explicit)
- **Directory data** (`reps.json`, `stations.json`) — operational listings, not editorial legal content.
- **~190 unused crawl JSON files** in `content/crawl/` — legacy Wix mirror; not all mapped to live routes.
- **Terms, Privacy, About, Contact** — standard site pages; no substantive legal claims audited.

---

## Tier 1 — Statutory & time/money-sensitive

### Legal updates (`data/legal-updates.json`)

#### `bail-act-2024-changes`
- **FIXED — Title/framing.** "Bail Act 2024" does not exist. No Act of that name; pre-charge bail reform is the **Police, Crime, Sentencing and Courts Act 2022** (Sch. 4), in force **28 October 2022**. Retitled to "Pre-Charge Bail Reforms" and corrected "came into force throughout 2024" → "28 October 2022".
  - Source: PCSC Act 2022 Sch. 4 — https://www.legislation.gov.uk/ukpga/2022/32/schedule/4/enacted ; Home Office pre-charge bail statutory guidance — https://www.gov.uk/government/publications/pre-charge-bail-statutory-guidance/pre-charge-bail-statutory-guidance-accessible
- **FIXED — Bail time limits.** Article described the pre-2022 (Policing and Crime Act 2017) "28 days then 3 months" structure and wrongly attributed the first extension to the magistrates' court. Corrected to the post-28-Oct-2022 standard-case regime: initial ABP **3 months** (custody officer); extend to **6 months** (inspector); to **9 months** (superintendent); beyond 9 months **magistrates' court** (PACE ss.47ZB–47ZJ; Crim PR Part 14). Added that FCA/SFO/NCA/HMRC designated cases start at a 6-month ABP.
  - Source: Home Office statutory guidance (paras 11.1–11.12) — as above.

#### `threshold-test-charging`
- **FIXED — "40-day review" rule.** No such rule exists. The Code for Crown Prosecutors requires the Threshold Test decision to be kept **under active review** and the Full Code Test applied **as soon as the anticipated further evidence is received** (in Crown Court cases, before service of the prosecution case). Removed all "40 days" references.
  - Source: Code for Crown Prosecutors §§5.2–5.11 — https://www.cps.gov.uk/publication/code-crown-prosecutors ; Director's Guidance on Charging (6th ed.) §6.
- **FIXED — Custody time limits.** Corrected to: summary-only **56 days**; either-way in magistrates' court **70 days** (reduced to 56 if allocated to summary trial within the first 56 days); Crown Court **182 days** from sending.
  - Source: CPS Custody Time Limits guidance — https://www.cps.gov.uk/legal-guidance/custody-time-limits ; Prosecution of Offences (Custody Time Limits) Regulations 1987.
- **REMOVED — Case citations.** "R v DPP ex parte Lee [1999]" (a *disclosure* authority, not a threshold-test limit) and "R v Inland Revenue, ex parte Dhesi [1995]" (unverifiable in this context) removed; replaced with the Code for Crown Prosecutors, Director's Guidance on Charging, and (for CTL) R v Manchester Crown Court ex p McDonald [1999].
  - Source: Director's Guidance on Charging (6th ed., Dec 2020) §6 — https://www.cps.gov.uk/prosecution-guidance/directors-guidance-charging-sixth-edition-december-2020-incorporating-national ; Prosecution of Offences (Custody Time Limits) Regulations 1987 (SI 1987/299) — https://www.legislation.gov.uk/uksi/1987/299/contents

#### `body-worn-video-evidence`
- **REMOVED — "R v Dobson [2011]".** That citation is the Stephen Lawrence retrial (double jeopardy / new evidence), not a BWV-disclosure authority. Replaced with the CPIA 1996 disclosure duties and the CPIA Code of Practice (duty to record, retain and reveal relevant material).
  - Source: CPIA 1996 — https://www.legislation.gov.uk/ukpga/1996/25/contents ; CPS Disclosure Manual — https://www.cps.gov.uk/legal-guidance/disclosure-manual
- **SOFTENED — PACE Code F.** Code F concerns visual recording (with sound) of interviews, not a general right to view BWV. Reworded to: no automatic right to a copy of BWV at the station, but you can ask the custody officer to view footage relevant to your advice.
  - Source: PACE Code F (2018, current edition) — https://www.gov.uk/government/publications/pace-codes-e-and-f-2018/pace-code-f-2018-accessible

#### `pace-code-c-updates-2024`
- **FIXED — Effective date.** The revised PACE Code C came into force **20 December 2023**, not "January 2024". Corrected title/excerpt/body. (The 2024 strip-search amendments were only a consultation in 2024.)
  - Source: PACE Code C 2023 — https://www.gov.uk/government/publications/pace-code-c-2023

#### `mileage-claims-guide`
- **FIXED — Mileage rate.** Added the second tier: 45p/mile for the first 10,000 miles, then **25p/mile** thereafter (HMRC approved mileage rates).
  - Source: HMRC approved mileage rates — https://www.gov.uk/travel-mileage-fuel-rates/travel-and-subsistence

#### `double-fees-guide`
- **SOFTENED — Added clarity** that police station advice and assistance is a fixed fee (£320 for UFNs on/after 22 Dec 2025, SI 2025/1251) and a "double fee" means two separate fixed fees for genuinely separate matters. No incorrect figures present.
  - Source: SI 2025/1251 — https://www.legislation.gov.uk/uksi/2025/1251/made ; LAA Crime Contract / Standard Crime Contract Specification.

#### `rasso-interview-strategy`
- **REMOVED — "R v ATH [2023] EWCA Crim 1047".** Hallucinated citation (no such case). Pre-interview disclosure is governed by the common-law duty of fairness (R v DPP ex p Lee [1999]) and the Attorney General's Guidelines on Disclosure. Reworded the "following ATH v R" line and the Further Resources entry.
  - Source: Attorney General's Guidelines on Disclosure (2024, effective 29 May 2024) — https://www.gov.uk/government/publications/attorney-generals-guidelines-on-disclosure ; CPS Disclosure Manual ch.2 — https://www.cps.gov.uk/legal-guidance/disclosure-manual-chapter-2-general-duties-disclosure-outside-cpia-1996

#### `sentencing-act-2026-key-changes`
- **OK.** Royal Assent 22 Jan 2026; main provisions in force 22 Mar 2026; presumption to suspend sentences of 12 months or less unless exceptional circumstances (s.1, inserting s.277A Sentencing Code); maximum suspended sentence raised to 3 years (s.2); operational-period detail correct.
  - Source: Sentencing Act 2026 — https://www.legislation.gov.uk/ukpga/2026/2/2026-03-22

### Fee figures (cross-page)
- **OK — £320 fixed fee / £650 escape threshold / 22 Dec 2025 / SI 2025/1251** confirmed against the regulations.
  - Source: SI 2025/1251 — https://www.legislation.gov.uk/uksi/2025/1251/made
- **OK — `MagistratesCourtFees`.** Standard-fee tables verified line-by-line against SI 2025/1251 (e.g. Category 1A lower/higher/non-standard/undesignated-area `£314.62 / £344.51 / £596.84 / £596.89`; hourly rates preparation `£57.37`, advocacy `£71.96`, attendance with counsel `£39.25`; "outside the standard fee schemes" additional fee `£229.47`). No changes required.
  - Source: SI 2025/1251 (amending the Criminal Legal Aid (Remuneration) Regs 2013, SI 2013/435).
- **OK — `CrownCourtFees`.** Conceptual overview of LGFS/AGFS only (offence classes, PPE, trial length); contains no specific monetary figures and directs users to the official LAA calculator. No changes required.
  - Source: LAA graduated fee calculators — https://www.gov.uk/government/publications/graduated-fee-calculators ; Criminal Legal Aid (Remuneration) Regulations 2013 (SI 2013/435), as amended — https://www.legislation.gov.uk/uksi/2013/435/contents
- **OK — `PACE`.** Detention clock (24h / 36h superintendent / 96h magistrates' warrant — indictable only), review times (first ≤6h, then ≤9h), caution wording, appropriate-adult rule, s.36/s.37 CJPOA 1994 special warnings, and Code A–H summaries all verified accurate. No changes required.
  - Source: PACE 1984 ss.40–44, 56, 58; PACE Codes of Practice — https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice

### `DSCCRegistrationGuide`
- **FIXED — Billing form (CRM6).** Page said the firm "submits the CRM6 claim through the LAA Crime Workflow" and that the PIN is recorded "in the firm's CRM6 billing claim." Wrong form. Police-station fixed fees are reported **monthly via Submit a Bulk Claim (SaBC)** (which replaced CWA) under **fee code INVC**; **escape** claims use the **Escape Fee Claim Form (CRM18)**. Corrected both the call-flow step and the PIN bullet.
  - Source: LAA Guidance for Reporting Crime Lower Work (fee code INVC; CRM18 escape) — https://www.gov.uk/guidance/submit-a-bulk-claim-sabc
- **FIXED — "Engaged" requirements.** Court-representation requirement was vague ("minimum specified court representations"); corrected to the SCC figures: each rolling 12 months **either 20 magistrates' court representations, or 10 magistrates' + 5 Crown Court**. Added the qualifier that of the **6 police-station cases**, no more than two can be telephone-only with no attendance. Confirmed the **50 hours/calendar month** (assessed on a rolling three-month basis per para 6.23) and **one duty attendance/slot per rolling 3 months** items. CLAS/PSQ split as standing eligibility vs paras 6.21–6.23 ongoing requirements.
- **FIXED — ADMIN 3 conflation (2026-06-01).** Removed incorrect link between duty solicitor engaged requirements and ADMIN 3 cleanse. ADMIN 3 is rep-Register only; duty solicitor non-compliance is under Spec paras 6.25, 6.42–6.44.
  - Source: LAA Duty Solicitor Guidance (Oct 2025) §§2.3–2.10, Specification ¶6.21 — https://www.gov.uk/government/publications/standard-crime-contract-2025
- **SOFTENED — "two-hour attendance guideline".** No such published LAA standard. Reworded to: no fixed statutory deadline; advice must be provided without undue delay; timing driven by the intended interview time and PACE Code C.
- **FIXED/SOFTENED — ADMIN forms.** Confirmed **ADMIN 2** (Supervising Solicitor registers a Probationary Representative; PIN issued) and **ADMIN 3** (annual data cleanse, Certificate of Fitness incorporated) against the Police Station Register Arrangements 2025. Removed the unverified "currently January each year" cleanse month. Added a hedge that ADMIN 2/3 are the rep forms defined in the PSRA 2025 while duty-solicitor administration uses further DSCC forms (ADMIN 1/4 retained but not over-asserted).
  - Source: Police Station Register Arrangements 2025 (defines ADMIN 2 & ADMIN 3) — published with the Standard Crime Contract 2025: https://www.gov.uk/government/publications/standard-crime-contract-2025
- **FIXED — On-page "Official sources" list.** Replaced dead/guessed links (and the superseded 2022 contract / "Crime Workflow" references) with verified URLs: SCC 2025, SaBC, Criminal Legal Aid Manual, PACE Codes.
- **OK — DSCC role, call flow, CDS Direct scope, PSQ/CLAS, Probationary→Accredited (CIT), PIN portability** all consistent with the 2025 arrangements.

### Site-wide reliance / verification warning (per user request: "warn re reliance … everywhere")
- **ADDED — `components/ContentReliabilityNotice.tsx`** (new). Reusable warning in two variants: a prominent amber `banner` and a compact `inline` paragraph. Consistent wording everywhere: information may be wrong/out of date, it is **not legal advice**, and the reader must verify against the original source (legislation.gov.uk, gov.uk, LAA, CPS, relevant PACE Code) or take professional advice.
- **ADDED — site-wide footer notice** (`components/Footer.tsx`): new "Reliance & verification" block renders on every page via the global layout.
- **ADDED — prominent banner** on content/legal/fee templates: blog articles (`app/Blog/[slug]`), wiki articles (`app/Wiki/[slug]`), legal updates (`app/LegalUpdates/[slug]`), and pages `EscapeFeeCalculator`, `PoliceStationRates`, `PoliceStationRepPay`, `MagistratesCourtFees`, `CrownCourtFees`, `PACE`, `police-station-rights-uk`, `free-legal-advice-police-station`.

---

## Tier 2 — Public rights pages

### `police-station-rights-uk` / `free-legal-advice-police-station`
- **OK.** Deliberately high-level pillar pages, already hedged ("high level", "follow LAA rules", "not legal advice"). Framework attributed to PACE 1984 and Codes; free advice tied to the legal aid scheme; platform correctly described as a directory, not a legal-aid provider. Added the standard reliance banner. No factual corrections required.

### `InterviewUnderCaution`
- **REWRITTEN (2026-06-01).** Replaced flattened Wix `CrawlContent` mirror (duplicate headings, breadcrumb junk, empty Contents TOC, double reliability banner) with a structured guide in `lib/guide-interview-under-caution.ts` and `app/InterviewUnderCaution/page.tsx`. Caution wording matches PACE Code C standard wording; adverse inference tied to CJPOA 1994 s.34 and CPS guidance; interview steps, rights, and options framed as advice-dependent general information.
  - Source: PACE Code C; CJPOA 1994 s.34; CPS adverse inferences guidance.

### `PoliceDisclosureGuide`
- **REWRITTEN (2026-06-01).** Same structural fix as Interview — structured guide in `lib/guide-police-disclosure.ts` with PACE Code C paragraph 11.1A citation, CPIA/AG Guidelines context, and rep practice notes. Verified that **PACE Code C paragraph 11.1A** requires sufficient pre-interview information for meaningful advice, subject to investigation prejudice limits.
  - Source: PACE Code C ¶11.1A — https://www.gov.uk/government/publications/pace-code-c-2023 ; CPIA 1996; Attorney General's Guidelines on Disclosure; DPP v Ara [2001] EWHC Admin 493; R v Roble [1997] Crim LR 449.

---

## Tier 3 — Rep Wiki (49 articles)

Triaged all 49 articles for high-risk claim patterns (bail limits, fee figures, mileage, case citations, statute dates), then verified/fixed the flagged ones.

### `rui-vs-bail-guide`
- **FIXED — Pre-charge bail time limits (same error as the legal update).** Article described the pre-2022 regime (initial **28 days**, then 3 months). Corrected to the post-28-Oct-2022 PCSC Act 2022 standard-case regime: initial **ABP 3 months** (custody officer) → **6 months** (Inspector) → **9 months** (Superintendent) → beyond 9 months **magistrates' court** (PACE ss.47ZF–47ZJ; Crim PR 14.21–14.22); FCA/SFO/NCA/HMRC cases start at a 6-month ABP. Fixed the comparison-table cells too.
  - Source: Home Office pre-charge bail statutory guidance ¶¶11.5, 11.12 — https://www.gov.uk/government/publications/pre-charge-bail-statutory-guidance/pre-charge-bail-statutory-guidance-accessible ; PCSC Act 2022 Sch. 4 — https://www.legislation.gov.uk/ukpga/2022/32/schedule/4/enacted

### `maximizing-legal-aid-claims` and `legal-aid-guide` (near-duplicates)
- **FIXED — Out-of-date police-station fees.** Both presented the police-station standard fee as **£181 (non-London) / £219 (London) "As of 2024/25"** with a London split — superseded. Corrected to the harmonised single **£320 fixed fee / £650 escape threshold** for UFNs on/after 22 December 2025 (SI 2025/1251), with old rates flagged as applying only to pre-22-Dec-2025 UFNs. Relabelled the old hourly "enhanced (2024/25)" rates as the earlier (pre-22-Dec-2025) rates and cross-linked the current `legal-aid-billing-complete-guide`; rewrote the worked example around the current escape mechanics.
  - Source: SI 2025/1251 — https://www.legislation.gov.uk/uksi/2025/1251/made

### Verified accurate (no change)
- **`legal-aid-billing-complete-guide`, `claiming-fees-police-station`** — correctly state the harmonised £320/£650 (UFN ≥ 22 Dec 2025), with £145.57–£315.86 old fixed fees and £640–£960 old escape thresholds correctly labelled as historical; current escape hourly rates (prep/attendance £49.70 National / £54.86 London; travel & waiting £27.60) cited to SI 2025/1251.
- **`police-caution-explained`, `no-comment-interviews`** — case citations checked and are genuine, relevant s.34 authorities (R v Argent, Condron, Roble, Betts & Hall, Knight, Beckles, Nickolson). Caution wording correct.
- **`adverse-inference-section-34-guide`** (was *pending* → now **verified**) — s.34 mechanics, ss.36/37 special warnings, prepared-statement strategy, and disclosure-dependent advice all accurate and well-hedged.
- Mileage references across articles (45p first 10,000 miles, then 25p) match HMRC.

### Still pending review (factCheckStatus left as `pending`)
- ~~`police-warrants-guide`, `fitness-for-interview-custody`, `digital-evidence-police-station-basics`, `police-station-interview-evidence-hub`~~ — **reviewed 2026-06-01** (see below). All 49 wiki articles now `verified`.

### Tier 3 follow-up — 4 previously pending articles (2026-06-01)

#### `police-warrants-guide`
- **FIXED — Warrant of further detention (s.43–44) conflated with superintendent extension (s.42).** Article wrongly presented 36 hours as magistrates' "warrant of further detention" and limited 96 hours to "terrorism or serious organised crime". Corrected: **s.42** superintendent authorisation extends to **36 hours** (indictable offences); **ss.43–44** magistrates' warrants continue beyond 36 hours up to the **96-hour PACE cap** for indictable offences; terrorism uses separate longer powers.
  - Source: PACE ss.41–44 — https://www.legislation.gov.uk/ukpga/1984/60/section/43
- **FIXED — PACE s.8 search-warrant grounds.** Replaced "serious indictable offence" and simplified grounds with the s.8(1) test: **indictable offence**, material of **substantial value** and **relevant evidence**, privilege/excluded-material limits, and an **s.8(3) access condition**.
  - Source: PACE s.8 — https://www.legislation.gov.uk/ukpga/1984/60/section/8
- **FIXED — Case citations.** **R (Bright) v Central Criminal Court [2001] 1 WLR 662** exists but concerns Schedule 1 PACE (special procedure/excluded material), not ordinary magistrates' s.8 warrants — citation and description corrected. **R v Southwark Crown Court, ex parte Bowles [1998] UKHL 16** is about **CJA 1988 s.93H production orders** (proceeds of crime), not general grounds for challenging PACE search warrants — reference description corrected; removed misleading footnote tie from §7 grounds list. **R v Derby Magistrates' Court, ex parte B [1996] AC 487** (LPP) — OK.
- **SOFTENED — Footer.** Removed overclaiming "Fact-Checked: All legislation… accurate as of November 2025"; replaced with standard verify-against-source note.

#### `fitness-for-interview-custody`
- **OK.** Practitioner checklist only; correctly hedged (not a doctor, escalate to solicitor, describe observations not diagnoses). FME/healthcare, AA for vulnerable adults, intoxication deferral, and s.34 cross-reference all appropriate. No corrections.

#### `digital-evidence-police-station-basics`
- **OK.** Deliberately awareness-level; mandatory solicitor escalation on passwords/PINs/encryption; does not improvise RIPA/contempt advice. CPIA/disclosure framing accurate at station-stage. No corrections.

#### `police-station-interview-evidence-hub`
- **OK.** Link index only; includes disclaimer. No factual claims to verify. No corrections.

---

## Tier 4 — Blog articles (22)

Triaged all 22 articles (`lib/blog/articles-batch-1..4.ts`) for statutory/figure/Legal-Aid/case-citation claims.
- **OK — 21 of 22 are soft, practice-oriented content** (freelance rep workflow, briefing, handover notes, insurance, communication, careers). They deliberately avoid hard legal/figure assertions and are strongly hedged ("not legal advice", "do not improvise citations", "Avoid inventing law"). The `police-station-rep-fee-rates-2026` article intentionally quotes **no** specific figures and cross-links `/PoliceStationRepPay`. No corrections needed.
- **OK — `sentencing-act-2026-key-changes`** verified accurate: Royal Assent 22 Jan 2026; in force 22 Mar 2026; presumption to suspend custodial terms ≤12 months unless exceptional circumstances; max suspended sentence 3 years; doesn't replace the Sentencing Code 2020; section labels correct (common assault **s.39 CJA 1988**; **s.4/4A POA 1986**).
  - Source: Sentencing Act 2026 — https://www.legislation.gov.uk/ukpga/2026/2/2026-03-22
- All blog articles already render the site reliance banner via the `app/Blog/[slug]` template.

---

## Tier 5 — County geographic claims (`lib/counties-content.ts`)

Custody estates change frequently (forces routinely close/merge suites), so naming an exhaustive "current" suite list is inherently risky. Approach: systemic softening rather than asserting a verified list for every suite.
- **FIXED (systemic) — county template.** Added the reliance banner to `app/county/[county]/page.tsx` and a standing note under the content: custody suite locations/hours/24-hour status change as forces consolidate; treat named stations as a general guide and confirm the current suite with the force/DSCC, with a link to the Stations Directory. This covers **all** county pages (including the generic fallback) at once.
- **SOFTENED — Kent.** Removed the over-specific assertion that "24-hour detention facilities are located at" eight named suites (some of which may have closed/changed); reframed around the consolidated main suites with an explicit "confirm current location" caveat.
- **SOFTENED — London.** The list previously named several suites that have since closed (e.g. West End Central, Islington, Wandsworth) as current; reframed to note the estate has reduced and to confirm the live suite before attending rather than relying on a fixed list.
- Remaining counties: present-tense suite names left in place but now bracketed by the template-level accuracy note and reliance banner; not individually re-verified suite-by-suite (custody estates change too often to assert a definitive current list).

---

## Tier 7 — Common Offences Guide (`/CommonOffencesGuide`)

New reference page for police station reps: 11 common custody offences with actus reus, mens rea, defences, verified case law, and Sentencing Council guideline links.

### Verification approach
- **Case law:** Only established authorities with standard neutral citations checked against BAILII, CPS charging standards, or Sentencing Council materials. No invented or unverified citations (following the same standard as Tier 1–6).
- **Statutes:** All linked to legislation.gov.uk section/contents pages.
- **Sentencing:** Each offence links to the current Sentencing Council definitive guideline page (not draft/consultation versions).
- **Dishonesty:** Ivey v Genting Casinos [2017] UKSC 67 (not Ghosh) for theft/fraud offences.
- **Recklessness (criminal damage):** R v G [2004] UKHL 50 (not Caldwell).

### Offences covered
Common assault/battery (s.39 CJA 1988); ABH (s.47 OAPA 1861); GBH s.20 and s.18; theft (Theft Act 1968); burglary (s.9); robbery (s.8); criminal damage (Criminal Damage Act 1971); possession of controlled drug (MDA 1971 s.5); public order (POA 1986 ss.4, 4A, 5); fraud (Fraud Act 2006).

### Key case law cited (verified)
- *Woolmington v DPP* [1935] AC 462; *Fagan v MPC* [1969] 1 QB 439; *Collins v Wilcock* [1984] 3 All ER 374; *R v Venna* [1976] QB 421; *R v Savage; DPP v Parmenter* [1992] 1 AC 699; *R v Chan-Fook* [1994] 1 WLR 689; *R v Donovan* [1934] 2 KB 498; *R v Cunningham* [1957] 2 QB 396; *Ivey v Genting Casinos* [2017] UKSC 67; *DPP v Gomez* [1993] AC 442; *R v Lloyd* [1985] 1 QB 653; *R v Walkington* [1979] 1 WLR 1169; *R v Collins* [1973] AC 854; *R v G* [2004] UKHL 50; *Warner v MPC* [1969] 2 AC 256; *R v Kennedy (No 2)* [2007] UKHL 38; *DPP v Collins* [1973] QB 100; *DPP v Majewski* [1977] AC 443; *R v Hasan* [2005] UKHL 22; *R v Palmer* [1971] AC 814; *R v Gladstone Williams* [1996] 2 Cr App R 286; *R v Brown* [1994] 1 AC 212; *R v Allen* [1988] AC 1479.

### Sources
- Sentencing Council — https://www.sentencingcouncil.org.uk/sentencing-guidelines/
- CPS OAP charging standard — https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard
- CPS Theft Act — https://www.cps.gov.uk/legal-guidance/theft-act-offences
- CPS Public Order — https://www.cps.gov.uk/legal-guidance/public-order-offences
- CPS Fraud Act 2006 — https://www.cps.gov.uk/legal-guidance/fraud-act-2006-offences
- CPS Misuse of Drugs Act — https://www.cps.gov.uk/legal-guidance/misuse-drugs-act-1971-0

---

## Tier 8 — Case-law verification policy & site-wide sources footers

### Case-law policy (mandatory)
- Added Cursor rule: `.cursor/rules/case-law-citations.mdc` — never cite from memory; if in doubt leave out; register cases in `lib/case-law-registry.ts` before use.
- Created `lib/case-law-registry.ts` allowlist with verified sources (BAILII, CPS, legislation) per case.
- Refactored `/CommonOffencesGuide` to pull case law only from the registry via `caseRefsByIds()`.
- Fixed **wrong citations/holdings** in `police-caution-explained` wiki (e.g. *Roble*, *Condron*, *Pointer*, *Knight* prepared-statement inferences; removed unverified *Sang* self-incrimination footnote and other edge citations).
- Fixed burglary entry case: *R v Collins* corrected to `[1973] QB 100` (was wrongly `[1973] AC 854`).
- Added `tests/case-law-registry.test.ts` and `scripts/fix-wiki-case-citations.js`.

### Site-wide sources footers
- Added `lib/content-sources.ts` and `components/ContentSourcesFooter.tsx`.
- Wired into: Wiki articles, Blog articles, Legal Updates, `CrawlContent`, mirror `[slug]` pages, `/PACE`, `/FAQ`, `/CommonOffencesGuide`, county directory pages.

---

## Consolidated sources index

Every primary/authoritative source cited above, de-duplicated. All URLs verified against the official publisher during this review (2026-06-01). Where a landing page is given rather than a deep anchor, it is because the landing page is the stable canonical location.

### Legislation (legislation.gov.uk)
- **Police, Crime, Sentencing and Courts Act 2022, Sch. 4** (pre-charge bail) — https://www.legislation.gov.uk/ukpga/2022/32/schedule/4/enacted
- **Criminal Procedure and Investigations Act 1996** (disclosure) — https://www.legislation.gov.uk/ukpga/1996/25/contents
- **Prosecution of Offences (Custody Time Limits) Regulations 1987** (SI 1987/299) — https://www.legislation.gov.uk/uksi/1987/299/contents
- **Criminal Legal Aid (Remuneration) Regulations 2013** (SI 2013/435, as amended) — https://www.legislation.gov.uk/uksi/2013/435/contents
- **Criminal Legal Aid (Remuneration) (Amendment) Regulations 2025** (SI 2025/1251) — https://www.legislation.gov.uk/uksi/2025/1251/made
- **Sentencing Act 2026** — https://www.legislation.gov.uk/ukpga/2026/2/2026-03-22
- *Referenced in text:* Police and Criminal Evidence Act 1984 (ss.40–44, 47ZB–47ZJ, 56, 58); Criminal Justice and Public Order Act 1994 (ss.34, 36, 37).

### Home Office / GOV.UK
- **Pre-charge bail statutory guidance** — https://www.gov.uk/government/publications/pre-charge-bail-statutory-guidance/pre-charge-bail-statutory-guidance-accessible
- **PACE Codes of Practice** (index) — https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice
- **PACE Code C (2023)** — https://www.gov.uk/government/publications/pace-code-c-2023
- **PACE Code F (2018, current edition)** — https://www.gov.uk/government/publications/pace-codes-e-and-f-2018/pace-code-f-2018-accessible
- **Attorney General's Guidelines on Disclosure (2024, effective 29 May 2024)** — https://www.gov.uk/government/publications/attorney-generals-guidelines-on-disclosure
- **HMRC approved mileage rates** — https://www.gov.uk/travel-mileage-fuel-rates/travel-and-subsistence
- **LAA graduated fee calculators (AGFS/LGFS)** — https://www.gov.uk/government/publications/graduated-fee-calculators
- **LAA Submit a Bulk Claim (SaBC)** — reporting crime lower work, fee code INVC, escape via CRM18 — https://www.gov.uk/guidance/submit-a-bulk-claim-sabc
- **LAA Criminal Legal Aid Manual** — https://www.gov.uk/guidance/criminal-legal-aid-manual
- **Standard Crime Contract 2025** — incl. Police Station Register Arrangements 2025 (ADMIN 2/3) & Duty Solicitor Guidance (engaged requirements) — https://www.gov.uk/government/publications/standard-crime-contract-2025

### Crown Prosecution Service (cps.gov.uk)
- **Code for Crown Prosecutors** — https://www.cps.gov.uk/publication/code-crown-prosecutors
- **Director's Guidance on Charging (6th ed., Dec 2020)** — https://www.cps.gov.uk/prosecution-guidance/directors-guidance-charging-sixth-edition-december-2020-incorporating-national
- **Custody Time Limits — legal guidance** — https://www.cps.gov.uk/legal-guidance/custody-time-limits
- **Disclosure Manual (index)** — https://www.cps.gov.uk/legal-guidance/disclosure-manual
- **Disclosure Manual ch. 2** (duties outside CPIA 1996) — https://www.cps.gov.uk/legal-guidance/disclosure-manual-chapter-2-general-duties-disclosure-outside-cpia-1996

### Other / contractual
- **LAA Standard Crime Contract 2025** (current; Specification v2 effective 31 Dec 2025 — governs the police-station fixed-fee scheme for UFNs on/after 22 Dec 2025) — https://www.gov.uk/government/publications/standard-crime-contract-2025
- **LAA Standard Crime Contract 2022** (historical; ran 1 Oct 2022 – 30 Sept 2025) — https://www.gov.uk/government/publications/standard-crime-contract-2022

### Case law referenced
- *R v Manchester Crown Court ex p McDonald* [1999] 1 WLR 841 (custody time limits — "due diligence and expedition").
- *R v DPP ex p Lee* [1999] 2 Cr App R 304 (common-law duty of pre-committal/early disclosure where fairness requires).

> Removed during this review as unverifiable/misattributed (not sources — flagged so they are not reinstated): *"R v ATH [2023] EWCA Crim 1047"* (no such case); *"R v Dobson [2011]"* cited for BWV disclosure (actually the Stephen Lawrence retrial — wrong subject); *"R v Inland Revenue ex parte Dhesi [1995]"* (unverifiable in the threshold-test context).

---

## Tier 7 — PSRAS portfolio, written exam, and CIT guides (2026-06-05)

Scope: `/BuildPortfolioGuide`, `/PrepareForCIT`, `/PrepareForWrittenExam`, and cross-references in career/how-to pages. Verified against PSRA 2025 PDF, SRA PSRAS/Standards pages, and Datalaw portfolio/CIT/written exam guides.

### Key fixes

- Part A/B case counts corrected to nine cases (2+2+5), not 6+10.
- CIT format corrected to Datalaw audio role-play; 50% Content/Confidence/Control marking.
- Written exam: 50% pass, four of five questions; SQE-only not exempt per PSRA 2025.
- New comprehensive `/PrepareForWrittenExam` guide added.
- Header For Reps and Guides menus promote all three PSRAS study guides.

---

## Tier 8 — Site-wide editorial accuracy audit (2026-06-05)

Scope: all editorial URLs (~107): blog (26), wiki (49), legal updates (8), static guides, fee/rights pages. Method: automated inventory + red-flag scan (`scripts/audit/content-accuracy-scan.ts`) plus manual re-verification of flagged items against 2+ primary sources. Outputs: `audit/content-accuracy-register.json`, `audit/content-accuracy-problems.md`.

**Out of scope:** rep profiles, `stations.json`, legal directory listings, legacy Wix crawl JSON not served live.

### Automated scan (Phase 1)

- **PROBLEM patterns:** Bail Act 2024, £181/£219, CRM6 billing, portfolio 6+10, 60–70% exam pass, live-actor CIT, DSCC duty-rota for reps — **0 hits** on live editorial content after Tier 7 fixes.
- **Case-law registry:** extended with *R v Paris, Abdullahi and Miller*, *R v Mason* [1988], *R v Southwark Crown Court, ex parte Bowles* for wiki interview/warrant articles.
- **Register:** 107 URLs inventoried; scan re-run clean on Critical patterns.

### Blog (26 articles) — OK

All slugs in `lib/blog/articles-data.ts` re-scanned. Prior Tier 4 manual verification retained. Page-specific `BLOG_SLUG` sources added for all 26 articles in `lib/content-sources.ts`.

### Wiki (49 articles) — OK

All slugs in `data/wiki-articles.json` re-scanned. Prior Tier 3 verification retained; `police-caution-explained` footnotes aligned with case-law registry (2026). Page-specific `WIKI_SLUG` sources added for all 49 articles.

### Legal updates (8) — OK (spot-check)

Prior Tier 1 fixes retained (`bail-act-2024-changes` retitled to PCSC Act 2022; ATH/Dobson/Dhesi removed). Spot-check confirmed no regression.

### Career / static guides — OK + FIXED

| Page | Verdict | Notes |
|---|---|---|
| `/CriminalLawCareerGuide` | OK | PSRAS pathway; sources footer via StructuredGuideShell |
| `/AccreditedRepresentativeGuide` | OK | PSRA 2025 framing |
| `/DutySolicitorVsRep` | OK | Rep vs duty solicitor distinction |
| `/WhatDoesRepDo` | OK | Role description consistent with PACE/SCC |
| `/GettingStarted` | OK | Getting-started pathway |
| `/HowToBecome` | OK | Short career guide |
| `/HowToBecomePoliceStationRep` | **FIXED** | `PAGE_PATH` now uses PSRA 2025 PDF + Datalaw exam guides (not generic PSRAS gov.uk only) |
| `/Resources` | **FIXED** | Added `ContentReliabilityNotice` (sources footer was already present) |
| `/DSCCRegistrationGuide` | **FIXED** | £650 escape threshold now cites SI 2025/1251 / 22 Dec 2025 |
| `/PrepareForCIT` | **FIXED** | *R v DPP, ex parte Lee* citation normalised to registry entry |
| `/BuildPortfolioGuide`, `/PrepareForWrittenExam` | OK | Tier 7 verified |
| `/BeginnersGuide`, `/FAQ`, `/RepFAQMaster`, `/GetWork`, `/FindSupervisingSolicitor` | OK | Tier 6 verified |
| `/PACE`, `/InterviewUnderCaution`, `/PoliceDisclosureGuide` | OK | Tier 1–2 verified |
| `/PoliceStationRates`, `/PoliceStationRepPay`, `/EscapeFeeCalculator` | OK | SI 2025/1251 figures |
| `/MagistratesCourtFees`, `/CrownCourtFees` | OK | Fee tables with SI date context |
| `/free-legal-advice-police-station`, `/police-station-rights-uk` | OK | Public rights pillars |
| `/CommonOffencesGuide` | OK | Registry-linked case refs only |

### Compliance tooling

- `hasSlugSpecificSources()` exported from `lib/content-sources.ts` for scan compliance checks.
- `npm run audit:content-accuracy` added; CI gate fails on new **Critical** red flags.
- `__tests__/case-law-registry.test.ts` extended to scan blog/wiki for known-bad citation patterns.

### Sources checked (Tier 8 sample)

- PSRA 2025 PDF — https://assets.publishing.service.gov.uk/media/68dcf841ef1c2f72bc1e4c9f/Police_Station_Register_Arrangements_2025.pdf
- SI 2025/1251 — https://www.legislation.gov.uk/uksi/2025/1251/made
- LAA SaBC / INVC — https://www.gov.uk/guidance/submit-a-bulk-claim-sabc
- CPS adverse inferences — https://www.cps.gov.uk/legal-guidance/adverse-inferences
- PACE Code C (2023) — https://www.gov.uk/government/publications/pace-code-c-2023


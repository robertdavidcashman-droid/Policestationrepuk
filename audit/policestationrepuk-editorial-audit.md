# Website Editorial Accuracy Audit

**Site:** [policestationrepuk.com](https://www.policestationrepuk.com)  
**Scope:** 107 editorial URLs (26 blog, 49 wiki, 8 legal updates, ~28 guides/fee/rights pages)  
**Method:** Tier 8 automated factual scan (clean) + manual editorial-risk pass (client wording, SEO tone, outdated sources)  
**Date:** 5 June 2026  
**Report-only:** no content was changed during this audit.

**Fixes applied:** 5 June 2026 — all priority items below implemented (wiki bail limits, police-caution wording, BeginnersGuide/FAQ/GetWork/PACE/free-legal-advice/Resources/HowToBecome sources, voluntary interview excerpt, RASSO intro, legacy-bail scan rule, wiki intro tone). Re-scan: 0 Critical, 0 Review, 0 gaps.

---

### Summary

| Metric | Count |
|---|---|
| **Total pages scanned** | 107 |
| **Pages with at least one flagged issue** | 12 |
| **High-risk issues** | 1 |
| **Medium-risk issues** | 8 |
| **Low-risk issues** | 6 |
| **Systemic / site-wide patterns** | 2 (wiki SEO boilerplate; SCC 2022 source links on several guides) |

**Baseline (automated):** `npm run audit:content-accuracy` — 0 Critical, 0 Review, 0 compliance gaps. Known-bad patterns (Bail Act 2024, CRM6, £181/£219, portfolio 6+10, etc.) are absent from live editorial content.

**Important limit:** This pass found **one substantive legal inaccuracy** (wiki bail time limits) that the automated scan did not catch. Manual review remains necessary for time-sensitive statute.

**Out of scope (not scanned):** rep directory profiles, station pages, county pages, About/Terms marketing, policestationagent.com.

---

### Issues Found

#### Released Under Investigation vs Police Bail

**URL:** `/Wiki/rui-vs-bail-guide`  
**Risk level:** **High**  
**Issue type:** Legal accuracy · Outdated information  

**Problem text:**
> **Strict time limits:**  
> 1. **0-28 days:** Initial bail period (custody sergeant)  
> 2. **28 days-3 months:** First extension (Inspector)  
> 3. **3-6 months:** Superintendent authorization required  
> 4. **Beyond 6 months:** Magistrates' court must authorize each further 3-6 month period  
>  
> **Breach:** If time limits breached, bail automatically ends—suspect can no longer be required to answer bail.

**Why this is a concern:** This describes the **pre–28 October 2022** pre-charge bail structure. Since the PCSC Act 2022 Sch. 4 reforms, standard cases use applicable bail periods of up to **3 months** (custody officer), extendable to **6 months** (inspector), **9 months** (superintendent), then **magistrates' court** beyond 9 months. The legal update `/LegalUpdates/bail-act-2024-changes` was corrected in Tier 1; this wiki article was not aligned. Misstated time limits can mislead reps and any public readers.

**Suggested replacement text:**
> **Pre-charge bail time limits (standard cases, from 28 October 2022):**  
> - Initial applicable bail period (ABP): up to **3 months** (custody officer).  
> - Extension to **6 months**: inspector (where statutory conditions met).  
> - Extension to **9 months**: superintendent.  
> - Beyond **9 months**: police must apply to the **magistrates' court** (PACE ss.47ZB–47ZJ; Crim PR Part 14).  
> *(FCA/SFO/NCA/HMRC designated cases may start with a 6-month ABP.)*  
>  
> Do not rely on a simple “bail automatically ends if a deadline is missed” rule — take advice on the current PACE provisions and Home Office statutory guidance.

**Sources to verify:** PCSC Act 2022 Sch. 4; Home Office pre-charge bail statutory guidance; `/LegalUpdates/bail-act-2024-changes` (already corrected on site).

---

#### The Police Caution Explained

**URL:** `/Wiki/police-caution-explained`  
**Risk level:** **Medium**  
**Issue type:** Legal accuracy · Client-risk  

**Problem text:**
> Every suspect—whether arrested or attending voluntarily—has an **absolute right to free legal advice** at the police station.  
> …  
> Legal advice is **completely free** under the Duty Solicitor Scheme or through your own chosen solicitor. There is **no means test** …

**Why this is a concern:** Police-station legal aid advice is generally non-means-tested, but the word **“absolute”** overstates the position (delays under PACE s.58, scope of legal aid, and voluntary interviews outside custody need careful framing). Client-facing wiki text should mirror Code C / LAA language and signpost that **this site does not provide advice**.

**Suggested replacement text:**
> If you are **detained at a police station** (or otherwise entitled to legal aid advice in that context), you can usually request **free legal advice** funded through criminal legal aid — typically without a means test for police-station work. For **voluntary interviews**, you should still take legal advice before attending, but the exact funding and attendance arrangements depend on how the interview is arranged — confirm with a solicitor. This article is general information, not advice on your case.

---

#### The Police Caution Explained (caution disposal)

**URL:** `/Wiki/police-caution-explained`  
**Risk level:** **Medium**  
**Issue type:** Client-risk  

**Problem text:**
> ✓ **Never accept a caution without legal advice** – it is an admission of guilt

**Why this is a concern:** Substantively sound for clients, but **“Never”** reads as definitive site advice. Safer to frame as strong guidance with solicitor referral.

**Suggested replacement text:**
> **Do not accept a police caution without legal advice.** A caution is a formal admission with long-term consequences (including disclosure). Speak to a criminal defence solicitor before deciding.

---

#### The Police Caution Explained (interview decision)

**URL:** `/Wiki/police-caution-explained`  
**Risk level:** **Low**  
**Issue type:** Client-risk · Editorial  

**Problem text:**
> … should be interviewed without legal advice unless you're **100% certain** you understand your rights and the implications.

**Why this is a concern:** No suspect should be encouraged to attend without advice on a “100% certainty” test; undermines the site’s own reliability messaging.

**Suggested replacement text:**
> … should **take legal advice before interview**. Even if you believe you understand the caution, the tactical and legal consequences of answering questions are case-specific.

---

#### Beginner's Guide to Police Station Representation

**URL:** `/BeginnersGuide`  
**Risk level:** **Medium**  
**Issue type:** Client-risk  

**Problem text (FAQ):**
> Never accept a voluntary interview without legal advice first — the consequences of a caution-warned admission are the same whether you were arrested or not.

**Why this is a concern:** Correct in spirit for a beginners’ explainer, but **“Never accept”** is directive language on a page that may be read by members of the public (via SEO). Better to recommend advice without sounding like the site is giving instructions to a specific client.

**Suggested replacement text:**
> You should **take legal advice before any interview under caution**, including a voluntary interview. Admissions made in a voluntary interview can have the same evidential weight as in custody.

---

#### Beginner's Guide — myth about naming a solicitor

**URL:** `/BeginnersGuide`  
**Risk level:** **Medium**  
**Issue type:** Client-risk · Editorial  

**Problem text:**
> Suspects who name a specific solicitor often receive worse service — because they may be at a firm with no out-of-hours cover.

**Why this is a concern:** Overbroad and potentially misleading. Many firms provide excellent named-solicitor cover; the issue is **firm capacity**, not naming per se. Could deter suspects from exercising choice.

**Suggested replacement text:**
> If you **name a solicitor**, the police will try to contact that firm. If they cannot reach them promptly, the DSCC may allocate **another firm** from the duty scheme. Naming a firm you trust is fine — what matters is that the firm can attend without undue delay.

---

#### Beginner's Guide — sources footer

**URL:** `/BeginnersGuide`  
**Risk level:** **Medium**  
**Issue type:** Outdated information  

**Problem text:** Sources footer links **Standard Crime Contract 2022** as primary contract reference without SCC 2025 / SI 2025/1251 for current police-station fee context.

**Why this is a concern:** Fee and contract references on the same page as funding explanation may send readers to superseded material (SCC 2022 ended 30 September 2025 for the main contract cycle; police-station harmonised fees from 22 December 2025).

**Suggested replacement text:** Add **Standard Crime Contract 2025** and **SI 2025/1251** as primary links; retain SCC 2022 only as historical note if needed.

---

#### FAQ — Police Station Representation

**URL:** `/FAQ`  
**Risk level:** **Medium**  
**Issue type:** Legal accuracy · Editorial  

**Problem text (WhatsApp answer):**
> … proof of accreditation (**LCCSA or CLSA membership, or Law Society accreditation**).

**Why this is a concern:** Current rep accreditation is **PSRAS** / Police Station Register (ADMIN 2), not LCCSA/CLSA membership alone. Outdated criteria may exclude valid reps or admit wrong proof.

**Suggested replacement text:**
> … proof of **PSRAS accreditation** (Police Station Register / probationary or accredited status via an SCC firm) or other verification we specify on the Join page.

---

#### Get Work as a Freelance Rep

**URL:** `/GetWork`  
**Risk level:** **Medium**  
**Issue type:** Outdated information  

**Problem text:** Official sources list links to **Standard Crime Contract 2022 (Police Station fees)** without SCC 2025 / SI 2025/1251.

**Why this is a concern:** Freelance pricing advice on the same page references LAA fixed fees; readers need the **current** harmonised fee scheme.

**Suggested replacement text:** Replace primary link with SCC 2025 and SI 2025/1251; note SCC 2022 as historical.

---

#### Get Work — unverified timeline claim

**URL:** `/GetWork`  
**Risk level:** **Low**  
**Issue type:** SEO · Editorial  

**Problem text (FAQ):**
> … typically lands their **first paid attendance within 4–8 weeks** … **6–12 months** … full-time income …

**Why this is a concern:** Presented as typical without source; may create unrealistic expectations. Not a legal error but a marketing-risk claim.

**Suggested replacement text:**
> Timelines vary widely by area, references, and outreach. Treat any figures as **illustrative only** — build income gradually and confirm rates with each instructing firm.

---

#### Voluntary Police Interview Guide (wiki)

**URL:** `/Wiki/voluntary-police-interview-guide`  
**Risk level:** **Medium**  
**Issue type:** SEO · Client-risk  

**Problem text (excerpt / summary field):**
> … **why you should never attend alone**.

**Why this is a concern:** Appears in wiki listing/SEO excerpt. Strong directive phrasing; better aligned with professional tone used elsewhere on the site.

**Suggested replacement text:**
> … **why legal advice before attendance is strongly recommended** (voluntary interviews are conducted under caution and carry the same legal risks as custody interviews).

---

#### Free legal advice at the police station (pillar page)

**URL:** `/free-legal-advice-police-station`  
**Risk level:** **Low**  
**Issue type:** SEO · Client-risk  

**Problem text:** Page title/H1 and URL use **“Free legal advice”** while the body correctly explains legal aid and disclaims that PoliceStationRepUK is a directory.

**Why this is a concern:** Search-intent SEO is understandable, but headlines can be read without the body disclaimer. Meta/H1 should echo the quickAnswer nuance (“usually entitled to legal aid-funded advice” / “this site does not provide advice”).

**Suggested replacement text (title/H1 option):**
> **Legal advice at the police station (England & Wales)** — with subheading: *How legal aid-funded advice works; PoliceStationRepUK is a directory, not a provider.*

---

#### PACE Codes overview

**URL:** `/PACE`  
**Risk level:** **Low**  
**Issue type:** Client-risk · Editorial  

**Problem text (CTA block):**
> Find an accredited police station representative via our **free directory**.

**Why this is a concern:** Proximity to PACE rights content (including “free and independent” legal advice) may blur **free legal advice** (legal aid) with **free directory search** (website service).

**Suggested replacement text:**
> **Search our free directory** to find an accredited representative (directory search is free; legal advice is provided by solicitor firms under legal aid rules, not by this website).

---

#### Wiki articles — repetitive SEO openings (systemic)

**URL:** Multiple `/Wiki/*` (approx. 35 articles)  
**Risk level:** **Low**  
**Issue type:** SEO · Editorial  

**Problem text:** Repeated pattern: *“This comprehensive guide explains…”* / very long generic introductions before substantive content.

**Why this is a concern:** Reads as template/AI filler; dilutes Robert Cashman’s direct professional tone; may hurt quality signals. Not legally wrong.

**Suggested replacement text:** Shorten intros to 2–3 sentences: who it’s for, what decision it helps with, link to official sources. Example: *“Quick reference for reps on pre-charge bail vs RUI after interview — check PCSC Act 2022 guidance before relying on time limits.”*

---

#### Resources hub — contract link

**URL:** `/Resources`  
**Risk level:** **Low**  
**Issue type:** Outdated information  

**Problem text:** LEGISLATION / legal aid section still lists **Standard Crime Contract 2022** without prominent SCC 2025 link.

**Suggested replacement text:** Lead with SCC 2025 and LAA SaBC guidance; demote 2022 contract to “historical”.

---

#### Blog articles (firm-facing) — overall

**URL:** `/Blog/*` (26 articles)  
**Risk level:** **Low** (no individual High/Medium legal errors found)  
**Issue type:** Editorial  

**Problem text:** N/A — batch reviewed for duty-rota, “free advice”, outcome promises, and DSCC imprecision.

**Why this is a concern:** Blog is **B2B** (firms instructing reps). Wording is generally careful (“always agree in writing”, “not a guarantee of every tactical decision”). No changes required urgently; maintain tone.

**Suggested replacement text:** None required; continue linking to verified guides for fee/regulatory detail.

---

#### Legal updates (8) — spot-check

**URL:** `/LegalUpdates/*`  
**Risk level:** **Low** (post–Tier 1 fixes)  
**Issue type:** Legal accuracy  

**Problem text:** N/A — bail, threshold test, BWV, PACE Code C date, mileage, sentencing Act 2026 previously corrected.

**Why this is a concern:** `/LegalUpdates/rasso-interview-strategy` contains sensitive example phrases (marked as pitfalls for reps). Appropriate in context but should stay clearly **professional-education** not client-facing.

**Suggested replacement text:** Add intro line: *“For criminal defence practitioners — not a substitute for firm policy or CPS guidance on live RASSO files.”*

---

### Priority Fix List

| # | Fix | URL | Risk |
|---|---|---|---|
| 1 | **Correct pre-charge bail time limits** to PCSC Act 2022 ABP regime (3/6/9 months + court) | `/Wiki/rui-vs-bail-guide` | **High** |
| 2 | **Soften “absolute” / “completely free”** legal-advice claims; distinguish custody vs voluntary | `/Wiki/police-caution-explained` | Medium |
| 3 | **Replace “Never accept voluntary interview”** with advice-to-seek-counsel framing | `/BeginnersGuide` FAQ | Medium |
| 4 | **Revise “naming a solicitor = worse service” myth** | `/BeginnersGuide` | Medium |
| 5 | **Update WhatsApp accreditation proof** to PSRAS / Register | `/FAQ` | Medium |
| 6 | **Update source footers** from SCC 2022 to **SCC 2025 + SI 2025/1251** | `/GetWork`, `/BeginnersGuide`, `/Resources`, `/HowToBecomePoliceStationRep` | Medium |
| 7 | **Revise wiki excerpt** “never attend alone” | `/Wiki/voluntary-police-interview-guide` | Medium |
| 8 | **Add scan rule** for legacy bail limits (`0-28 days`, `28 days-3 months`) to `content-accuracy-scan.ts` | Tooling | Medium (prevent regression) |
| 9 | **Align pillar SEO titles** with legal-aid nuance + directory disclaimer | `/free-legal-advice-police-station` | Low |
| 10 | **Clarify “free directory” vs free legal advice** in PACE CTA | `/PACE` | Low |

---

### Suggested Safer Standard Disclaimer

Use site-wide (banner or footer). Aligns with existing [`ContentReliabilityNotice`](components/ContentReliabilityNotice.tsx) but shorter for client-facing pages:

> **General information only — not legal advice.**  
> This website explains how criminal procedure and legal aid work in **England and Wales**. Law, fees, and official guidance change often and errors can occur. **Do not rely on this content for your case.** Check the current position on [legislation.gov.uk](https://www.legislation.gov.uk), [gov.uk](https://www.gov.uk), or the relevant PACE Code, or **contact a criminal defence solicitor** for advice about your situation.  
> **PoliceStationRepUK** is a directory and information site operated by Defence Legal Services Ltd. We do **not** provide legal representation, legal aid, or regulated legal services. Listing on the directory does not guarantee availability, outcome, or quality of any representative.

**Optional one-line variant (inline under H1 on rights/wiki pages):**

> *General information for England & Wales only. Not legal advice — speak to a solicitor about your case.*

---

### Appendix — automated baseline (5 June 2026)

```
Content accuracy scan: 107 editorial URLs
  Critical (PROBLEM): 0
  Review: 0
  Compliance gaps: 0
Case-law registry tests: 4/4 passed
```

**Gap identified by this manual pass:** legacy bail limit wording in `/Wiki/rui-vs-bail-guide` evaded automated patterns — recommend extending [`scripts/audit/content-accuracy-scan.ts`](scripts/audit/content-accuracy-scan.ts) in a future fix batch (item 8 above).

---

*End of report. Implement fixes only after solicitor review and explicit approval.*

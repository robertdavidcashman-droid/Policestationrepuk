# Content Accuracy Review

Legal/factual accuracy review of site content, verified against primary sources and edited inline.

- **Started:** 2026-06-01
- **Method:** Each substantive claim (statute, section, figure, date, time limit, case citation) checked against `legislation.gov.uk`, `gov.uk` (LAA, CPS, Home Office, Sentencing Council), official PACE Codes, or other primary/authoritative sources. Unverifiable claims corrected, softened, or removed. Existing "general information, not legal advice" disclaimers preserved.
- **Verdict key:** OK (accurate) · FIXED (corrected) · REMOVED (unverifiable/hallucinated) · SOFTENED (reworded to a defensible statement).

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
- **FIXED — "Engaged" requirements.** Court-representation requirement was vague ("minimum specified court representations"); corrected to the SCC figures: each rolling 12 months **either 20 magistrates' court representations, or 10 magistrates' + 5 Crown Court**. Added the qualifier that of the **6 police-station cases**, no more than two can be telephone-only with no attendance. Confirmed the **50 hours/calendar month** and **one duty attendance/slot per rolling 3 months** items. CLAS wording generalised ("earlier Contract").
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
- **OK.** Caution wording verbatim-correct; three-part explanation (right to silence, adverse inference, evidence) accurate; answer/no-comment/prepared-statement options correctly framed as advice-dependent. Added the reliance banner.
  - Source: PACE Code C; CJPOA 1994 s.34 (adverse inferences).

### `PoliceDisclosureGuide`
- **OK — incl. the para 11.1A citation.** Verified that **PACE Code C paragraph 11.1A** does contain the pre-interview duty to give the suspect/solicitor "sufficient information to enable them to understand the nature of any such offence, and why they are suspected... for the effective exercise of the rights of the defence", subject to the investigating officer's discretion to withhold detail that might prejudice the investigation. Page's account of basic vs fuller disclosure, the right to challenge inadequate disclosure, and the link between poor disclosure and a defensible "no comment" is accurate. Added the reliance banner.
  - Source: PACE Code C ¶11.1A & Note 11ZA — https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice ; DPP v Ara [2001] EWHC Admin 493; R v Roble [1997] Crim LR 449.

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

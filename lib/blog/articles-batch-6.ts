import type { BlogArticle } from './types';

const IMG = (slug: string, alt: string) => ({
  src: `/images/blog/raster/${slug}.webp`,
  alt,
  width: 1200,
  height: 675,
});

export const ARTICLES_BATCH_6: BlogArticle[] = [
  {
    slug: 'how-to-become-police-station-representative-2026',
    title: 'How to Become a Police Station Representative (2026)',
    metaTitle: 'How to Become a Police Station Representative (2026)',
    metaDescription:
      'The 2026 route to becoming an accredited police station representative: PSRAS, supervised attendances, the portfolio, and getting your first instructions.',
    primaryKeyword: 'how to become police station representative',
    categories: ['freelance-reps'],
    published: '2026-06-26T09:00:00.000Z',
    modified: '2026-06-26T09:00:00.000Z',
    excerpt:
      'Accreditation through the PSRAS, supervised attendances, and a portfolio signed off by a solicitor — then a clear directory profile so firms can find you.',
    summary:
      'A practical 2026 guide to becoming an accredited police station representative in England and Wales: the PSRAS route, supervised attendances, portfolio sign-off, and finding your first instructions.',
    image: IMG(
      'how-to-become-police-station-representative-2026',
      'Trainee police station representative reviewing PACE materials before accreditation',
    ),
    relatedSlugs: [
      'freelance-police-station-representative-vs-duty-solicitor',
      'professional-indemnity-insurance-reps',
      'freelance-police-station-rep-career',
    ],
    faqs: [
      {
        q: 'Do I need a law degree to become a police station representative?',
        a: 'No. The PSRAS is a competence-based scheme open to non-solicitors. You work under a firm’s supervision while you build knowledge, sit the assessments, and complete a supervised portfolio.',
      },
      {
        q: 'How long does accreditation take?',
        a: 'It varies by candidate and firm. The pace depends on study time, how quickly you secure supervised attendances, and assessment scheduling. Confirm current timescales with your assessment organisation.',
      },
      {
        q: 'What pass mark do I need for the PSRAS assessments?',
        a: 'Standards are set by the SRA and the assessment organisation and can change, so check your current handbook rather than relying on figures from forums or older guides.',
      },
    ],
    bodyMarkdown: `
This guide explains **how to become a police station representative** in 2026 — the PSRAS accreditation route, the supervised attendances and portfolio you need, and how to pick up your first instructions once you qualify.

## Key takeaways

- Becoming a police station representative means accreditation through the **PSRAS** — an assessed knowledge element, the **Critical Incidents Test**, and a **supervised portfolio**.
- You work under a **firm’s supervision** while training; accreditation is portable once achieved.
- Once accredited, a clear [directory profile](/directory) helps firms instruct you with confidence.

## What a police station representative does

A police station representative advises and represents suspects in custody and in voluntary interviews under PACE. The role sits alongside — but is distinct from — a duty solicitor. If you are weighing the two paths, read our comparison of the [freelance rep versus duty solicitor route](/Blog/freelance-police-station-representative-vs-duty-solicitor).

Representatives attend at all hours, review disclosure, advise on whether to answer questions, and protect the client’s position from the first hour of detention. It is responsible work, which is exactly why accreditation matters.

## The PSRAS route, step by step

To advise clients at the police station you must be accredited through the **Police Station Representatives Accreditation Scheme (PSRAS)**. The route generally involves:

1. **Get linked to a firm** that can supervise you and provide attendances.
2. **Build underpinning knowledge** of PACE and the Codes of Practice — especially Code C (detention and questioning) and Code D (identification).
3. **Sit the assessments** — the knowledge element and the Critical Incidents Test.
4. **Complete supervised attendances** and obtain portfolio sign-off from a supervising solicitor.

Because the scheme is updated from time to time, **confirm the current components and the pass standard with the SRA and your assessment organisation** rather than relying on second-hand figures.

## The assessed knowledge element

The knowledge assessment tests core law and procedure: PACE and the Codes, the caution and the right to silence, detention and the custody clock, vulnerable suspects and appropriate adults, and professional conduct.

Most candidates prepare with timed multiple-choice practice so they can answer **accurately under time pressure**, not just recognise the law when they see it. Reviewing every practice answer against the underlying Code provision builds durable knowledge.

## The Critical Incidents Test (CIT)

The CIT is a practical assessment of how you handle a realistic police-station scenario: identifying the issues, prioritising client consultation, and reaching a defensible decision on advice. It rewards **structured thinking**, not memorised quotes. Practising scenarios out loud — issue-spotting, then a clear decision trail — is the most effective preparation.

## The portfolio

Alongside the assessments you build a portfolio evidencing **real, supervised attendances**. This is firm-led: your supervising solicitor signs off competence against the standards. Start collecting structured attendance evidence early — good contemporaneous notes make portfolio sign-off far easier.

## Practical considerations before you start

- **Supervision:** you cannot complete the portfolio without a firm willing to supervise and provide attendances.
- **Insurance:** understand your indemnity position before you take instructions — see our note on [professional indemnity insurance for reps](/Blog/professional-indemnity-insurance-reps).
- **Availability:** out-of-hours work is the norm; be honest with yourself about the hours.
- **Geography:** decide which custody suites you can realistically reach.

## Getting your first instructions

Once accredited, freelance reps find work through firm relationships and directories. A clear profile — **areas covered, availability, and accreditation status** — helps firms instruct you with confidence.

- [Register as a police station rep](/Register) and complete your profile.
- List your counties and stations in the [directory](/directory) so firms searching under pressure can find you.
- Read our overview of building a [freelance police station rep career](/Blog/freelance-police-station-rep-career) for the longer view.

Listing in a reputable directory makes you discoverable to firms needing cover, especially out of hours when panels fail.

## Cross-site training resources

For exam-focused preparation, see the partner guide on the [PSRAS exam format and how to prepare](https://psrtrain.com/blog/psras-exam-format-pass-mark-2026?utm_source=policestationrepuk&utm_medium=blog&utm_campaign=partner_tools). For structured attendance notes that support your portfolio, see [CustodyNote](https://custodynote.com?utm_source=policestationrepuk&utm_medium=blog&utm_campaign=partner_tools).

---

*General professional information for England and Wales — not legal advice. Always follow your firm’s procedures, the SRA Standards and Regulations, and current assessment organisation requirements.*
`.trim(),
  },
  {
    slug: 'freelance-rep-day-rate-2026',
    title: 'Setting Your Freelance Rep Day-Rate in 2026',
    metaTitle: 'Setting Your Freelance Rep Day-Rate (2026)',
    metaDescription:
      'How freelance police station representatives set rates in 2026: per-attendance vs day-rate, what drives price, and how to quote firms with confidence.',
    primaryKeyword: 'police station rep day rate',
    categories: ['freelance-reps'],
    published: '2026-06-27T09:00:00.000Z',
    modified: '2026-06-27T09:00:00.000Z',
    excerpt:
      'Most freelance reps are paid per attendance, not a flat day-rate. Your price should reflect travel, unsocial hours, complexity, and reliability — agreed in writing.',
    summary:
      'Explains how freelance police station representatives set rates in 2026: why per-attendance is common under fixed LAA fees, what drives price, and how to quote firms clearly.',
    image: IMG(
      'freelance-rep-day-rate-2026',
      'Freelance police station representative reviewing fee schedule and invoicing on a laptop',
    ),
    relatedSlugs: [
      'police-station-rep-fee-rates-2026',
      'freelance-police-station-rep-career',
      'how-freelance-police-station-reps-win-repeat-instructions',
    ],
    faqs: [
      {
        q: 'Should I charge a day-rate or per attendance?',
        a: 'Most freelance reps charge per attendance because firms claim police station work under fixed Legal Aid Agency fees. A day-rate is unusual; agree the basis of charge with each firm in writing first.',
      },
      {
        q: 'Can I charge more for nights and weekends?',
        a: 'Many reps apply an out-of-hours or unsocial-hours uplift. What firms accept varies, so set a clear, transparent schedule and confirm it before you accept cover.',
      },
      {
        q: 'How do I raise my rate without losing firms?',
        a: 'Reliability and clean attendance notes justify the upper end of the range. Give notice, explain the value, and let your track record of prompt attendance support the conversation.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- Most freelance police station reps are paid **per attendance**, not a flat day-rate, because firms claim under **fixed Legal Aid Agency fees**.
- Your rate should reflect **travel, time of day, complexity, and reliability**.
- Agree the basis of charge **in writing** with each firm before you accept cover, and keep your [directory listing](/directory) current.

## Day-rate vs per attendance

A true “day-rate” is uncommon in police station agency work. Because firms claim most police station attendances under **fixed fees** set by the Legal Aid Agency, the prevailing model is a **per-attendance fee** rather than a daily figure. That keeps your charging aligned with how the firm itself is paid.

Some reps quote a day-rate for blocks of private work or planned voluntary interviews, but the per-attendance approach is the norm. Whatever model you use, **be transparent and agree it before you turn up**.

## What drives your rate

Several factors legitimately move your price up or down:

- **Geography and travel time** — distance to the custody suite and dead time between jobs.
- **Out-of-hours and weekend premiums** — nights, weekends, and bank holidays.
- **Complexity** — serious or multi-suspect matters, vulnerable clients, or long interviews.
- **Volume and reliability** — the consistency you offer a firm over time.
- **Accreditation and experience** — firms value reps who turn up promptly and produce clean notes.

Reliability and good notes let you command the upper end of the range and [win repeat instructions](/Blog/how-freelance-police-station-reps-win-repeat-instructions). For a wider view of the market, see our guide to [police station rep fee rates in 2026](/Blog/police-station-rep-fee-rates-2026).

## Building a simple fee schedule

Firms want to say yes quickly. A clear schedule removes friction:

1. **Per-attendance fee** for a standard custody attendance.
2. **Travel** — mileage or a banded travel charge for distant suites.
3. **Unsocial-hours uplift** — a defined premium for nights and weekends.
4. **Attendance-note turnaround** — when the firm receives your note.

Keep it short. A one-page schedule a fee-earner can read in thirty seconds is worth more than a complicated tariff.

## Quoting firms with confidence

When you quote, lead with the **value**, not just the number: a trained representative who reviews disclosure, advises on whether to answer questions, and protects the client’s position. Then state your per-attendance fee, any travel or unsocial-hours uplift, and your note turnaround.

- Put the **basis of charge in writing** before the first instruction.
- Confirm **VAT status** if you are registered.
- Be clear about **cancellation** and aborted attendances.

A professional profile in the [directory](/directory) makes it easier for firms to find and trust your rate. List your counties, stations, and availability so the firm searching at 2am sees that you cover the suite and can quote on the spot.

## Reliability is part of the price

The reps who hold the strongest rates are not necessarily the cheapest — they are the ones firms can depend on. Prompt attendance, contemporaneous notes, and quick report-back justify a higher fee far more than negotiation does. Pair this with a longer-term plan for your [freelance rep career](/Blog/freelance-police-station-rep-career).

## Cross-site tooling

Clean, structured attendance notes win repeat work and make your rate easier to justify. See [CustodyNote](https://custodynote.com?utm_source=policestationrepuk&utm_medium=blog&utm_campaign=partner_tools) for offline-first attendance notes built for police station work.

---

*General professional information for England and Wales — not legal advice. Always follow your firm’s procedures, the SRA Standards and Regulations, and current Legal Aid Agency contract requirements.*
`.trim(),
  },
  {
    slug: 'building-firm-panel-freelance-reps',
    title: 'Building a Firm Panel of Freelance Reps',
    metaTitle: 'Building a Firm Panel of Freelance Reps (Guide)',
    metaDescription:
      'For criminal defence firms: how to build a reliable panel of freelance police station representatives for cover, including vetting and conflict checks.',
    primaryKeyword: 'freelance rep panel',
    categories: ['law-firms'],
    published: '2026-06-28T09:00:00.000Z',
    modified: '2026-06-28T09:00:00.000Z',
    excerpt:
      'A reliable panel gives a firm resilient out-of-hours and overflow cover without permanent headcount — built on verified accreditation, clear geography, and consistent notes.',
    summary:
      'A guide for criminal defence firms on building a dependable panel of freelance police station reps: vetting, onboarding, geography mapping, conflict checks, and note standards.',
    image: IMG(
      'building-firm-panel-freelance-reps',
      'Criminal defence firm coordinator mapping freelance rep cover across custody suites',
    ),
    relatedSlugs: [
      'out-of-hours-police-station-cover-for-law-firms',
      'how-firms-can-instruct-freelance-police-station-reps',
      'how-firms-source-emergency-rep-cover',
    ],
    faqs: [
      {
        q: 'How many reps should a firm have on its panel?',
        a: 'Enough to cover your custody suites and peak demand without relying on any single person. Map your geography first, then recruit to fill the gaps, including out-of-hours and overflow.',
      },
      {
        q: 'What should we verify before adding a rep to the panel?',
        a: 'Confirm PSRAS accreditation, indemnity position, the basis of charge, and your attendance-note standard. A short onboarding pack saves repeated explanation.',
      },
      {
        q: 'How do conflict checks work with freelance reps?',
        a: 'Require a conflict check before each instruction, not just at onboarding. Reps may act for other firms, so a check at the point of allocation protects every file.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- A reliable panel of accredited freelance reps gives a firm **resilient out-of-hours and overflow cover** without permanent headcount.
- Build it on three foundations: **verified accreditation**, **clear geography and availability**, and **consistent note quality**.
- Source verified profiles by area through the [directory](/directory), then set expectations once, in writing.

## Why a panel beats ad-hoc calls

When cover fails at 2am, firms that rely on a scramble of phone calls lose attendance windows and risk files. A standing **panel** of vetted freelance reps turns that scramble into an allocation decision. It gives you:

- **Out-of-hours resilience** when your own duty cover is stretched — see [out-of-hours cover for law firms](/Blog/out-of-hours-police-station-cover-for-law-firms).
- **Overflow capacity** during busy periods without new permanent hires.
- **Geographic reach** into custody suites your in-house team cannot always cover.

For the mechanics of instructing reps once your panel exists, read [how firms can instruct freelance reps](/Blog/how-firms-can-instruct-freelance-police-station-reps).

## Map your geography first

Before recruiting, map the **custody suites** you actually use and where demand peaks. A rep who covers a county on paper may be at the wrong end of it. Match reps to suites, not just to counties, and record who covers what so allocation is fast at 2am.

Use the [directory](/directory) to search by area and shortlist reps who genuinely list the stations you need. Confirm realistic attendance times before you add anyone to the panel.

## Vetting and onboarding

A short, consistent onboarding process protects quality and saves repeated explanation:

1. **Confirm PSRAS accreditation** for the scheme you rely on.
2. **Check the indemnity position** — who insures the attendance.
3. **Agree the basis of charge** in writing, including travel and unsocial-hours uplifts.
4. **Set your attendance-note standard** and the turnaround you expect.
5. **Issue a one-page onboarding pack** covering contacts, references, and escalation.

This is the same discipline reps apply from their side; aligning expectations once means the panel runs itself.

## Conflict checks and quality control

Two controls keep a panel safe and audit-ready:

- **Conflict checks before every instruction** — not just at onboarding. Freelance reps may act for other firms, so the meaningful check is at the point of allocation.
- **A defined note standard for every attendance** — so files stay audit-ready regardless of who attended.

Standardising the attendance note across the panel is the single highest-leverage quality step. It keeps your Legal Aid Agency claims defensible and makes handovers consistent.

## Keeping the panel healthy

A panel is not “set and forget”:

- **Review availability** periodically — reps change hours, areas, and accreditation.
- **Track reliability** — promptness, note quality, and report-back speed.
- **Keep contact details current** and confirm cover before peak periods.
- **Have a fallback** for sudden gaps — see [sourcing emergency rep cover](/Blog/how-firms-source-emergency-rep-cover).

Sourcing reps through a reputable [directory](/directory) speeds up panel-building and gives you verified profiles to start from, so you are not rebuilding the list every time someone moves on.

## Cross-site tooling

To standardise attendance notes across everyone on your panel, see [CustodyNote](https://custodynote.com?utm_source=policestationrepuk&utm_medium=blog&utm_campaign=partner_tools) — structured, offline-first notes that keep files consistent whoever attended.

---

*General professional information for England and Wales — not legal advice. Always follow your firm’s procedures, the SRA Standards and Regulations, and current Legal Aid Agency contract requirements.*
`.trim(),
  },
];

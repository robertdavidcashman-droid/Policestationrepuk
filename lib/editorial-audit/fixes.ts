/** Actionable fix guidance keyed by red-flag code. */
export const PROPOSED_FIXES: Record<string, string> = {
  'legacy-bail-28-days':
    'Replace 0–28 day / 28-day–3-month bail tables with the PCSC Act 2022 authorised bail period limits (initial 3 months, extensions to 6/9 months, magistrates’ court thereafter).',
  'bail-act-2024':
    'Remove references to "Bail Act 2024" and cite Police, Crime, Sentencing and Courts Act 2022 Schedule 4 (pre-charge bail).',
  'fee-181':
    'Replace £181 with the harmonised police-station fixed fee from SI 2025/1251 (in force 22 Dec 2025) and cite the SI.',
  'fee-219':
    'Replace £219 with the harmonised police-station fixed fee from SI 2025/1251 (in force 22 Dec 2025) and cite the SI.',
  'crm6-billing':
    'Replace CRM6 with SaBC/INVC for police-station claims; mention CRM18 only for escape-fee applications.',
  'portfolio-min-6':
    'Correct portfolio requirements to PSRA 2025: 2 supervised + 2 unsupervised + 5 case studies (nine cases total).',
  'portfolio-min-10':
    'Verify portfolio minimum against PSRA 2025 — nine cases total (2+2+5), not ten.',
  'exam-pass-60-70':
    'Replace unverified pass-rate band with PSRA 2025 rule: 50% on four of five written questions.',
  'live-actor-cit':
    'Describe CIT as audio role-play per Datalaw/PSRAS — not live actors.',
  'dscc-duty-rota-rep':
    'Clarify reps cannot join the duty solicitor rota; accreditation is via PSRAS and firm instruction only.',
  'sqe-written-exempt':
    'Verify SQE exemption wording against PSRA 2025 — there is no SQE-only written-exam exemption.',
  'fee-320-no-date':
    'Add "from 22 December 2025" and cite SI 2025/1251 alongside the £320 harmonised fixed fee.',
  'fee-650-escape-no-date':
    'Add SI 2025/1251 / 22 Dec 2025 context when citing the £650 escape threshold.',
  'si-2025-no-date':
    'State that SI 2025/1251 is in force from 22 December 2025 when citing the regulations.',
  'citation-ath': 'Remove ATH v R — unverifiable citation.',
  'citation-dobson-bwv': 'Remove or correct the R v Dobson BWV attribution.',
  'citation-dhesi': 'Remove the Dhesi citation or replace with a verifiable authority.',
  'citation-ghosh': 'Replace R v Ghosh with Ivey v Genting Casinos [2017] UKSC 67 for dishonesty.',
  'unregistered-case':
    'Add the case to lib/case-law-registry.ts after verifying the citation, or remove/replace with a registered authority.',
};

export function proposedFixForCode(code: string): string {
  return PROPOSED_FIXES[code] ?? 'Review the flagged excerpt against current legislation and PSRA 2025 / SI 2025/1251 sources.';
}

import { VERIFIED_CASES } from '@/lib/case-law-registry';
import type { RedFlag } from './types';

export const RED_FLAG_RULES: Array<{
  code: string;
  severity: 'PROBLEM' | 'REVIEW';
  re: RegExp;
  message: string;
  skip?: RegExp;
}> = [
  {
    code: 'legacy-bail-28-days',
    severity: 'PROBLEM',
    re: /0-28 days.*(?:Initial bail|bail period)|28 days-3 months.*(?:First extension|Inspector)/i,
    message:
      'Legacy pre-2022 pre-charge bail limits — use PCSC Act 2022 ABP regime (3/6/9 months + magistrates’ court)',
  },
  {
    code: 'bail-act-2024',
    severity: 'PROBLEM',
    re: /Bail Act 2024/i,
    message: 'Non-existent "Bail Act 2024" — use PCSC Act 2022 Sch. 4',
  },
  {
    code: 'fee-181',
    severity: 'PROBLEM',
    re: /£181\b/,
    message: 'Superseded £181 police-station fee — use SI 2025/1251 harmonised rates',
  },
  {
    code: 'fee-219',
    severity: 'PROBLEM',
    re: /£219\b/,
    message: 'Superseded £219 police-station fee — use SI 2025/1251 harmonised rates',
  },
  {
    code: 'crm6-billing',
    severity: 'PROBLEM',
    re: /\bCRM6\b/,
    message: 'CRM6 is not the police-station billing form — use SaBC/INVC (+ CRM18 escape)',
  },
  {
    code: 'portfolio-min-6',
    severity: 'PROBLEM',
    re: /minimum\s+6\s+(cases|attendances|portfolio|case studies)|6\s*\+\s*10\s+(cases|attendances)|six\s+cases.*ten\s+cases/i,
    skip: /not in PSRA|those numbers are not|Treating portfolio|is nine case|2\+2\+5/i,
    message: 'Incorrect PSRAS portfolio counts — PSRA 2025 requires 2+2+5 (nine cases)',
  },
  {
    code: 'portfolio-min-10',
    severity: 'PROBLEM',
    re: /minimum\s+10\s+(cases|attendances|portfolio|case studies)/i,
    message: 'Incorrect PSRAS portfolio minimum — verify against PSRA 2025 (nine cases total)',
  },
  {
    code: 'exam-pass-60-70',
    severity: 'PROBLEM',
    re: /60[–-]70\s*%\s*(pass|written)|written exam.*60[–-]70/i,
    message: 'Unverified written-exam pass-rate claim — PSRA 2025 requires 50% on four of five questions',
  },
  {
    code: 'live-actor-cit',
    severity: 'PROBLEM',
    re: /\blive actors?\b/i,
    skip: /\blive actors?\s+or\s+audio\b/i,
    message: 'CIT uses audio role-play (Datalaw), not live actors',
  },
  {
    code: 'dscc-duty-rota-rep',
    severity: 'PROBLEM',
    re: /register with the DSCC duty rota|register with the DSCC scheme where you intend to take duty work/i,
    message: 'Reps cannot join the duty solicitor rota — PSRAS + firm instruction only',
  },
  {
    code: 'sqe-written-exempt',
    severity: 'REVIEW',
    re: /SQE.{0,80}exempt.{0,40}written|written exam.{0,40}SQE.{0,40}exempt/i,
    message: 'SQE-only exemption claim — verify against PSRA 2025 (no SQE-only exemption)',
  },
  {
    code: 'fee-320-no-date',
    severity: 'REVIEW',
    re: /£320/,
    skip: /22\s+Dec(?:ember)?\s+2025|SI 2025\/1251|from 22|December 2025|Dec 2025 onwards|harmonised fixed fee/i,
    message: '£320 fee figure without SI 2025/1251 / 22 Dec 2025 effective-date context',
  },
  {
    code: 'fee-650-escape-no-date',
    severity: 'REVIEW',
    re: /£650/,
    skip:
      /22\s+Dec(?:ember)?\s+2025|SI 2025\/1251|from 22|December 2025|indicative £450|provider timetable|CIT resit|assessment fee|PSRAS/i,
    message: '£650 escape-threshold figure without SI 2025/1251 / 22 Dec 2025 context',
  },
  {
    code: 'si-2025-no-date',
    severity: 'REVIEW',
    re: /SI 2025\/1251/,
    skip: /22\s+Dec(?:ember)?\s+2025|in force from 22/i,
    message: 'SI 2025/1251 cited without in-force date context',
  },
];

export const KNOWN_BAD_CITATIONS: Array<{ code: string; re: RegExp; message: string }> = [
  { code: 'citation-ath', re: /\bATH v R\b/i, message: 'Removed hallucinated ATH v R citation' },
  {
    code: 'citation-dobson-bwv',
    re: /R v Dobson.*BWV|BWV.*R v Dobson/i,
    message: 'Misattributed R v Dobson BWV citation',
  },
  { code: 'citation-dhesi', re: /ex parte Dhesi|Inland Revenue.*Dhesi/i, message: 'Removed unverifiable Dhesi citation' },
  { code: 'citation-ghosh', re: /\bR v Ghosh\b/i, message: 'Ghosh dishonesty test superseded by Ivey v Genting Casinos' },
];

const REGISTERED_NAMES = new Set(VERIFIED_CASES.map((c) => c.name.toLowerCase()));
const REGISTERED_CITATIONS = new Set(VERIFIED_CASES.map((c) => c.citation.replace(/\s+/g, ' ')));

export function excerpt(text: string, index: number, len = 80): string {
  const start = Math.max(0, index - 30);
  return text.slice(start, start + len).replace(/\s+/g, ' ').trim();
}

function normalizeCaseName(name: string): string {
  return name
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bex p\b/gi, 'ex parte')
    .trim()
    .toLowerCase();
}

function isRegisteredCase(rawName: string, citation?: string): boolean {
  const key = normalizeCaseName(rawName);
  if (REGISTERED_NAMES.has(key)) return true;
  const normCitation = citation?.replace(/\s+/g, ' ').replace(/\*/g, '');
  if (normCitation && REGISTERED_CITATIONS.has(normCitation)) return true;
  return VERIFIED_CASES.some((c) => {
    const reg = c.name.toLowerCase();
    return reg === key || reg.startsWith(key) || key.startsWith(reg);
  });
}

function findUnregisteredCaseCitations(text: string): RedFlag[] {
  const flags: RedFlag[] = [];
  const re =
    /\*?(R v [A-Z][a-zA-Z'.\-]+(?:\s+(?:and\s+)?[A-Za-z'.\-]+)*|R \(Bright\) v Central Criminal Court|R \(Bright\) v [A-Z][a-zA-Z'.\-]+(?:\s+[A-Za-z'.\-]+)*|DPP v [A-Z][a-zA-Z'.\-]+(?:\s+[A-Za-z'.\-]+)*|R v Manchester Crown Court, ex parte McDonald|R v DPP, ex parte Lee|R v Derby Magistrates' Court, ex parte B)\*?\s*(\[[^\]]+\])?/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(text)) !== null) {
    const rawName = m[1].replace(/\*/g, '').trim();
    const key = normalizeCaseName(rawName);
    if (seen.has(key)) continue;
    seen.add(key);
    if (isRegisteredCase(rawName, m[2])) continue;
    if (/R v Smith|R v Jones|R v Example/i.test(rawName)) continue;
    flags.push({
      severity: 'REVIEW',
      code: 'unregistered-case',
      message: `Case citation not in case-law registry: ${rawName}${m[2] ?? ''}`,
      excerpt: excerpt(text, m.index),
    });
  }
  return flags;
}

export function scanText(text: string): RedFlag[] {
  const flags: RedFlag[] = [];
  for (const rule of RED_FLAG_RULES) {
    const m = rule.re.exec(text);
    if (!m) continue;
    if (rule.skip?.test(text)) continue;
    flags.push({
      severity: rule.severity,
      code: rule.code,
      message: rule.message,
      excerpt: excerpt(text, m.index),
    });
  }
  for (const bad of KNOWN_BAD_CITATIONS) {
    const m = bad.re.exec(text);
    if (m) {
      flags.push({
        severity: 'PROBLEM',
        code: bad.code,
        message: bad.message,
        excerpt: excerpt(text, m.index),
      });
    }
  }
  flags.push(...findUnregisteredCaseCitations(text));
  return flags;
}

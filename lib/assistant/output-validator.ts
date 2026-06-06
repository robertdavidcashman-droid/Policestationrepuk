import type { AssistantMatch } from '@/lib/assistant/types';

export type OutputValidationResult =
  | { valid: true }
  | { valid: false; reason: string; code: string };

/** Advice the assistant must never give, even paraphrased. */
const FORBIDDEN_OUTPUT_PATTERNS: { code: string; pattern: RegExp; reason: string }[] = [
  {
    code: 'INTERVIEW_ADVICE',
    pattern: /\b(you|they|he|she) should (no comment|answer every question| plead guilty| plead not guilty)\b/i,
    reason: 'Output contains interview or plea advice',
  },
  {
    code: 'CUSTODY_ADVICE',
    pattern: /\bwhat (you|they) should say (to|in) (the )?(police|interview)\b/i,
    reason: 'Output contains custody interview guidance',
  },
  {
    code: 'GUILT_PREDICTION',
    pattern: /\b(will go to prison|are guilty|will be convicted|will be acquitted)\b/i,
    reason: 'Output predicts legal outcomes',
  },
  {
    code: 'SOLICITOR_REPLACEMENT',
    pattern: /\b(instruct me instead|you do not need a solicitor|skip the solicitor)\b/i,
    reason: 'Output discourages instructing a solicitor',
  },
];

const UK_PHONE_PATTERN =
  /(?:\+44\s?\(?0\)?|0)\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g;

const MONEY_PATTERN = /£\s?\d[\d,]*(?:\.\d{2})?/g;

const CASE_COUNT_PATTERN = /\b(\d+|nine|ten|eleven|twelve)\s+cases?\b/gi;

function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function contextBlob(context: AssistantMatch[]): string {
  return context
    .map((m) => `${m.entry.question} ${m.entry.answer} ${m.entry.href ?? ''}`)
    .join(' ');
}

function valueInContext(value: string, blob: string): boolean {
  const normalizedValue = normalizeForCompare(value);
  const normalizedBlob = normalizeForCompare(blob);
  if (normalizedBlob.includes(normalizedValue)) return true;

  // Compare digit-only forms (e.g. phone formatting differences).
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 6 && normalizedBlob.replace(/\D/g, '').includes(digits)) {
    return true;
  }

  return false;
}

export function validateAssistantLlmOutput(
  answer: string,
  context: AssistantMatch[]
): OutputValidationResult {
  const trimmed = answer.trim();
  if (!trimmed) {
    return { valid: false, code: 'EMPTY', reason: 'LLM returned an empty answer' };
  }

  for (const rule of FORBIDDEN_OUTPUT_PATTERNS) {
    if (rule.pattern.test(trimmed)) {
      return { valid: false, code: rule.code, reason: rule.reason };
    }
  }

  const blob = contextBlob(context);

  for (const phone of trimmed.match(UK_PHONE_PATTERN) ?? []) {
    if (!valueInContext(phone, blob)) {
      return {
        valid: false,
        code: 'UNGROUNDED_PHONE',
        reason: 'Output contains a phone number not present in retrieved context',
      };
    }
  }

  for (const amount of trimmed.match(MONEY_PATTERN) ?? []) {
    if (!valueInContext(amount, blob)) {
      return {
        valid: false,
        code: 'UNGROUNDED_FEE',
        reason: 'Output contains a fee or amount not present in retrieved context',
      };
    }
  }

  for (const match of trimmed.matchAll(CASE_COUNT_PATTERN)) {
    const phrase = match[0];
    if (!valueInContext(phrase, blob)) {
      return {
        valid: false,
        code: 'UNGROUNDED_CASE_COUNT',
        reason: 'Output contains a portfolio case count not present in retrieved context',
      };
    }
  }

  return { valid: true };
}

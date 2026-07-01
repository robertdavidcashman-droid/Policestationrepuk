/**
 * Sanitisation for Legal Services Directory user input.
 * Never render raw HTML from submissions — plain text only.
 */

import { countLinkLikeSegments } from '@/lib/contact-guards';
import { normalizeUserUrl } from '@/lib/normalize-url';
import { DESCRIPTION_MAX, MAX_LINKS_IN_DESCRIPTION } from './constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SCRIPT_PATTERNS = [
  /<script\b/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe\b/i,
  /data:text\/html/i,
  /&#x?[0-9a-f]+;/i,
];

const SQL_INJECTION_PATTERNS = [
  /(\b)(union\s+select|drop\s+table|insert\s+into|delete\s+from|;\s*--)/i,
  /'\s*or\s+'1'\s*=\s*'1/i,
];

export function sanitizeText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  let s = v
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
  s = s.replace(/\s+/g, ' ');
  return s.slice(0, max);
}

export function sanitizeMultiline(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  let s = v
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  return s.slice(0, max);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 320);
}

export function sanitizeUrl(v: unknown, max = 500): string {
  const raw = sanitizeText(v, max);
  return normalizeUserUrl(raw, max);
}

export function containsScriptOrInjection(text: string): boolean {
  for (const p of SCRIPT_PATTERNS) {
    if (p.test(text)) return true;
  }
  for (const p of SQL_INJECTION_PATTERNS) {
    if (p.test(text)) return true;
  }
  return false;
}

export function descriptionLinkCount(text: string): number {
  return countLinkLikeSegments(text);
}

export function descriptionWithinLinkLimit(text: string): boolean {
  return descriptionLinkCount(text) <= MAX_LINKS_IN_DESCRIPTION;
}

/**
 * Validates the (already-sanitised) description. Note: HTML tags are stripped
 * before this runs, so raw <script> markup never reaches storage. Script /
 * injection ATTEMPTS are detected on the raw input separately (see the submit
 * route) and routed to flagged_for_review rather than hard-rejected, so the
 * site owner can investigate. Here we only enforce length + link limits.
 */
export function validateDescription(description: string): string | null {
  if (description.length < 80) {
    return 'Please provide a description of at least 80 characters.';
  }
  if (description.length > DESCRIPTION_MAX) {
    return `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
  }
  if (!descriptionWithinLinkLimit(description)) {
    return `Please limit links in your description to ${MAX_LINKS_IN_DESCRIPTION} or fewer.`;
  }
  return null;
}

export function parseBooleanField(v: unknown): boolean {
  return v === true || v === 'true' || v === 'yes' || v === 'on';
}

export type LegalAidStatusInput = 'yes' | 'no' | 'not_applicable';

export function parseLegalAidStatus(v: unknown): LegalAidStatusInput {
  if (v === 'yes' || v === 'no' || v === 'not_applicable') return v;
  return 'not_applicable';
}

export function splitTags(v: unknown, maxItems = 20, maxLen = 80): string[] {
  const raw = sanitizeText(v, 2000);
  if (!raw) return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

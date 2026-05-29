/**
 * Risk scoring for Legal Services Directory submissions.
 * riskScore 0–20: normal pending review
 * 21–50: pending with caution
 * 51–100: flagged_for_review
 */

import { containsScriptOrInjection, descriptionLinkCount } from './sanitize';
import type { LegalDirectoryListingStatus } from './types';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'sharklasers.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'getairmail.com',
  'maildrop.cc',
]);

const SPAM_KEYWORDS = [
  'casino',
  'crypto',
  'bitcoin',
  'viagra',
  'essay writing',
  'fake passport',
  'buy followers',
  'gambling',
  'porn',
  'escort',
  'loan shark',
  'mlm',
];

const UNRELATED_KEYWORDS = [
  'plumber',
  'roofing',
  'seo agency',
  'web design package',
  'instagram growth',
];

const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
];

export interface LegalDirectoryRiskInput {
  businessName: string;
  email: string;
  description: string;
  websiteUrl: string;
  regulatoryNumber: string;
  regulatoryBody: string;
  category: string;
  honeypotFilled?: boolean;
  ownerEmailMismatch?: boolean;
  /** Set when raw (pre-sanitisation) input contained script/injection markup. */
  scriptAttempt?: boolean;
}

export interface LegalDirectoryRiskResult {
  riskScore: number;
  reviewFlags: string[];
  suggestedStatus: LegalDirectoryListingStatus;
}

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase().trim();
}

function hostOf(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function scoreLegalDirectorySubmission(
  input: LegalDirectoryRiskInput,
): LegalDirectoryRiskResult {
  let score = 0;
  const flags: string[] = [];

  if (input.honeypotFilled) {
    score = 100;
    flags.push('honeypot_completed');
    return { riskScore: score, reviewFlags: flags, suggestedStatus: 'rejected_spam' };
  }

  if (input.scriptAttempt || containsScriptOrInjection(input.description)) {
    score += 60;
    flags.push('script_or_injection_attempt');
  }

  const links = descriptionLinkCount(input.description);
  if (links > 3) {
    score += 25;
    flags.push('excessive_links_in_description');
  }

  const combined = `${input.businessName} ${input.description} ${input.websiteUrl}`.toLowerCase();

  for (const kw of SPAM_KEYWORDS) {
    if (combined.includes(kw)) {
      score += 20;
      flags.push(`spam_keyword:${kw}`);
      break;
    }
  }

  for (const kw of UNRELATED_KEYWORDS) {
    if (combined.includes(kw)) {
      score += 15;
      flags.push(`unrelated_service:${kw}`);
    }
  }

  const emailDomain = domainOf(input.email);
  if (DISPOSABLE_DOMAINS.has(emailDomain)) {
    score += 35;
    flags.push('disposable_email_domain');
  }

  const webHost = hostOf(input.websiteUrl);
  if (webHost && URL_SHORTENERS.some((s) => webHost.includes(s))) {
    score += 30;
    flags.push('url_shortener');
  }

  if (input.regulatoryNumber && /^(test|000+|xxx|n\/a)/i.test(input.regulatoryNumber.trim())) {
    score += 15;
    flags.push('suspicious_regulatory_number');
  }

  if (input.ownerEmailMismatch) {
    score += 40;
    flags.push('email_not_associated_with_listing');
  }

  if (input.businessName.length < 3) {
    score += 10;
    flags.push('very_short_business_name');
  }

  const uniqueChars = new Set(input.description.toLowerCase().replace(/\s/g, ''));
  if (input.description.length > 200 && uniqueChars.size < 15) {
    score += 20;
    flags.push('keyword_stuffing_pattern');
  }

  score = Math.min(100, Math.max(0, score));

  let suggestedStatus: LegalDirectoryListingStatus = 'pending_review';
  if (score >= 51 || flags.includes('script_or_injection_attempt')) {
    suggestedStatus = 'flagged_for_review';
  } else if (score >= 21) {
    suggestedStatus = 'pending_review';
  }

  return { riskScore: score, reviewFlags: flags, suggestedStatus };
}

export function statusFromRisk(
  risk: LegalDirectoryRiskResult,
  honeypot: boolean,
): LegalDirectoryListingStatus {
  if (honeypot) return 'rejected_spam';
  // Listings publish immediately; risk score is informational for admin emails only.
  void risk;
  return 'approved';
}

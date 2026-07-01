/**
 * Shared URL normalization for user-pasted links (registration, legal directory, etc.).
 * Prepends https:// when missing, strips common paste artefacts, rejects non-http(s).
 */

const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i;

export const INVALID_PROOF_URL_MESSAGE =
  'Paste a full web address — for example https://www.linkedin.com/in/your-name or your SRA register page. Links without https:// are added automatically when possible.';

function stripUrlPasteArtifacts(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('<') && s.endsWith('>')) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith('(') && s.endsWith(')')) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/[.,;)]+$/g, '');
  return s;
}

/** Normalize a user-pasted URL; returns '' when the value cannot be made safe. */
export function normalizeUserUrl(v: unknown, max = 500): string {
  if (typeof v !== 'string') return '';
  let raw = v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
  if (!raw) return '';
  raw = stripUrlPasteArtifacts(raw);
  if (!raw) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    return '';
  }
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!URL_RE.test(candidate)) return '';
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString().slice(0, max);
  } catch {
    return '';
  }
}

/**
 * Resolve proof-of-accreditation URL for registration.
 * Invalid optional proof is ignored when PIN or SRA is already supplied.
 */
export function resolveRegistrationProofUrl(args: {
  rawProof: string;
  pinNumber: string;
  sraNumber: string;
}): { proofUrl: string; invalidProofUrl: boolean } {
  const rawProof = args.rawProof.trim();
  const normalized = normalizeUserUrl(rawProof);
  const hasPrimaryEvidence = Boolean(args.pinNumber.trim() || args.sraNumber.trim());
  if (rawProof && !normalized) {
    if (hasPrimaryEvidence) {
      return { proofUrl: '', invalidProofUrl: false };
    }
    return { proofUrl: '', invalidProofUrl: true };
  }
  return { proofUrl: normalized, invalidProofUrl: false };
}

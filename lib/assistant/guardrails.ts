/** Guardrails for the guided assistant — refuse case-specific advice; always disclaim. */

export const ASSISTANT_DISCLAIMER =
  'General information from PoliceStationRepUK guides only — not legal advice. Law and procedure change; verify against official sources before relying on this in live work. If someone is in custody now, instruct a criminal defence solicitor immediately.';

const CASE_SPECIFIC_PATTERNS: RegExp[] = [
  /\bmy client\b/i,
  /\bmy case\b/i,
  /\bi was arrested\b/i,
  /\bi've been arrested\b/i,
  /\bshould i (no comment|answer| plead)/i,
  /\bwhat should i say\b/i,
  /\bwhat do i tell the police\b/i,
  /\bam i guilty\b/i,
  /\bwill i go to prison\b/i,
  /\bcharged with\b/i,
  /\barrested for\b/i,
  /\bmy son was arrested\b/i,
  /\bmy daughter was arrested\b/i,
  /\bmy partner was arrested\b/i,
  /\bmy husband was arrested\b/i,
  /\bmy wife was arrested\b/i,
  /\bloved one (was )?arrested\b/i,
  /\bshould they no comment\b/i,
  /\badvise me on my\b/i,
];

export const ASSISTANT_REFUSAL_MESSAGE =
  'I cannot give advice about a specific case or what someone should say in interview. That requires a qualified criminal defence solicitor who knows the facts. See our guide on free legal advice at the police station, or use Contact if your question is about the directory.';

export type GuardrailResult =
  | { refused: false }
  | { refused: true; message: string; suggestedLinks: { href: string; label: string }[] };

export function checkAssistantGuardrails(message: string): GuardrailResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      refused: true,
      message: 'Please enter a question about the directory, registration, or our published guides.',
      suggestedLinks: [
        { href: '/guided-assistant', label: 'Guided assistant' },
        { href: '/FAQ', label: 'Help & FAQ' },
      ],
    };
  }

  for (const pattern of CASE_SPECIFIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        refused: true,
        message: ASSISTANT_REFUSAL_MESSAGE,
        suggestedLinks: [
          { href: '/free-legal-advice-police-station', label: 'Free legal advice (police station)' },
          { href: '/Contact', label: 'Contact us' },
          { href: '/directory', label: 'Find a rep' },
        ],
      };
    }
  }

  return { refused: false };
}

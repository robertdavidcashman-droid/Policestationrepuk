/**
 * Topics where LLM paraphrase risk is unacceptable — FAQ corpus answers only.
 * When matched, the assistant never calls OpenAI even on low-confidence queries.
 */

export type FaqOnlyTopic = {
  id: string;
  pattern: RegExp;
  guideHref: string;
  guideLabel: string;
};

export const FAQ_ONLY_TOPICS: FaqOnlyTopic[] = [
  {
    id: 'psras-portfolio',
    pattern: /\b(portfolio|nine cases?|9 cases?|case count)\b/i,
    guideHref: '/BuildPortfolioGuide',
    guideLabel: 'PSRAS portfolio guide',
  },
  {
    id: 'psras-accreditation',
    pattern: /\b(psras|accredited representative|accreditation (fee|cost|exam))\b/i,
    guideHref: '/AccreditedRepresentativeGuide',
    guideLabel: 'Accreditation guide',
  },
  {
    id: 'dscc-pin',
    pattern: /\b(dscc|pin number)\b/i,
    guideHref: '/AccreditedRepresentativeGuide',
    guideLabel: 'Accreditation guide',
  },
  {
    id: 'written-exam',
    pattern: /\b(written exam|psrass? written)\b/i,
    guideHref: '/PrepareForWrittenExam',
    guideLabel: 'Written exam guide',
  },
  {
    id: 'cit-exam',
    pattern: /\b(critical incident test|\bcit\b)\b/i,
    guideHref: '/PrepareForCIT',
    guideLabel: 'CIT guide',
  },
  {
    id: 'custody-note',
    pattern: /\b(custody\s*note|custodynote|attendance note software|digital custody notes?)\b/i,
    guideHref: '/CustodyNote',
    guideLabel: 'Custody Note',
  },
];

export function matchFaqOnlyTopic(message: string): FaqOnlyTopic | null {
  const trimmed = message.trim();
  for (const topic of FAQ_ONLY_TOPICS) {
    if (topic.pattern.test(trimmed)) {
      return topic;
    }
  }
  return null;
}

export function isFaqOnlyTopic(message: string): boolean {
  return matchFaqOnlyTopic(message) !== null;
}

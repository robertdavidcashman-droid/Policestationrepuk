import { ASSISTANT_CORPUS, ASSISTANT_LOW_CONFIDENCE_LINKS } from '@/lib/assistant/corpus';
import { ASSISTANT_DISCLAIMER, checkAssistantGuardrails } from '@/lib/assistant/guardrails';
import type { AssistantEntry, AssistantMatch, AssistantQueryResult } from '@/lib/assistant/types';

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'i',
  'me',
  'my',
  'we',
  'you',
  'your',
  'it',
  'this',
  'that',
  'what',
  'how',
  'when',
  'where',
  'who',
  'which',
  'about',
  'with',
  'from',
  'as',
  'by',
  'if',
  'so',
  'our',
  'there',
  'their',
  'them',
  'they',
  'he',
  'she',
  'his',
  'her',
  'its',
  'not',
  'no',
  'yes',
  'please',
  'tell',
  'know',
  'need',
  'want',
  'get',
  'find',
]);

export const ASSISTANT_MATCH_THRESHOLD = 0.25;
export const ASSISTANT_MAX_MATCHES = 3;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function overlapScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;
  const targetSet = new Set(targetTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (targetSet.has(token)) hits += 1;
  }
  return hits / Math.max(queryTokens.length, 1);
}

function scoreEntry(queryTokens: string[], entry: AssistantEntry): number {
  const questionTokens = tokenize(entry.question);
  const answerTokens = tokenize(entry.answer.slice(0, 240));
  const keywordTokens = (entry.keywords ?? []).flatMap((k) => tokenize(k));

  const questionScore = overlapScore(queryTokens, questionTokens);
  const keywordScore = overlapScore(queryTokens, keywordTokens);
  const answerScore = overlapScore(queryTokens, answerTokens) * 0.35;

  let score = questionScore * 1.0 + keywordScore * 0.85 + answerScore;

  // Boost when the full query appears as a substring in the question.
  const normalizedQuery = queryTokens.join(' ');
  const normalizedQuestion = normalizeText(entry.question);
  if (normalizedQuery.length >= 4 && normalizedQuestion.includes(normalizedQuery)) {
    score += 0.35;
  }

  return Math.min(1, score);
}

export function matchAssistantCorpus(message: string): AssistantMatch[] {
  const queryTokens = tokenize(message);
  if (queryTokens.length === 0) return [];

  const scored = ASSISTANT_CORPUS.map((entry) => ({
    entry,
    score: scoreEntry(queryTokens, entry),
  }))
    .filter((m) => m.score >= ASSISTANT_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: AssistantMatch[] = [];
  for (const match of scored) {
    if (seen.has(match.entry.id)) continue;
    seen.add(match.entry.id);
    out.push(match);
    if (out.length >= ASSISTANT_MAX_MATCHES) break;
  }
  return out;
}

export function queryAssistant(message: string): AssistantQueryResult {
  const guard = checkAssistantGuardrails(message);
  if (guard.refused) {
    return {
      disclaimer: ASSISTANT_DISCLAIMER,
      matches: [],
      suggestedLinks: guard.suggestedLinks,
      refused: true,
      refusalMessage: guard.message,
    };
  }

  const matches = matchAssistantCorpus(message);
  const suggestedLinks =
    matches.length > 0
      ? []
      : [...ASSISTANT_LOW_CONFIDENCE_LINKS];

  return {
    disclaimer: ASSISTANT_DISCLAIMER,
    matches,
    suggestedLinks,
    refused: false,
    refusalMessage:
      matches.length === 0
        ? "I couldn't find a close match in our published guides. Try rephrasing, or use the links below."
        : undefined,
  };
}

/** Exported for tests — score a single entry. */
export function scoreAssistantEntryForTest(message: string, entry: AssistantEntry): number {
  return scoreEntry(tokenize(message), entry);
}

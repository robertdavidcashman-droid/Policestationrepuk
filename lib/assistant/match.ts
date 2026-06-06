import { ASSISTANT_CORPUS, ASSISTANT_LOW_CONFIDENCE_LINKS } from '@/lib/assistant/corpus';
import { matchFaqOnlyTopic } from '@/lib/assistant/faq-only-topics';
import { ASSISTANT_DISCLAIMER, checkAssistantGuardrails } from '@/lib/assistant/guardrails';
import { generateAssistantLlmAnswer, isAssistantLlmEnabled } from '@/lib/assistant/llm';
import { logAssistantQuery } from '@/lib/assistant/logging';
import { validateAssistantLlmOutput } from '@/lib/assistant/output-validator';
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
export const ASSISTANT_HIGH_CONFIDENCE_THRESHOLD = 0.5;
export const ASSISTANT_MAX_MATCHES = 3;
export const ASSISTANT_RAG_CONTEXT_LIMIT = 6;

const VALIDATION_FALLBACK_MESSAGE =
  "I couldn't verify that answer against our published guides. Try rephrasing, or use the links below.";

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

  const normalizedQuery = queryTokens.join(' ');
  const normalizedQuestion = normalizeText(entry.question);
  if (normalizedQuery.length >= 4 && normalizedQuestion.includes(normalizedQuery)) {
    score += 0.35;
  }

  return Math.min(1, score);
}

/** Top corpus entries by score — used for RAG even below the display threshold. */
export function retrieveAssistantContext(message: string, limit = ASSISTANT_RAG_CONTEXT_LIMIT): AssistantMatch[] {
  const queryTokens = tokenize(message);
  if (queryTokens.length === 0) return [];

  return ASSISTANT_CORPUS.map((entry) => ({
    entry,
    score: scoreEntry(queryTokens, entry),
  }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
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

function buildFallbackResult(matches: AssistantMatch[], refusalMessage?: string): AssistantQueryResult {
  const suggestedLinks = matches.length > 0 ? [] : [...ASSISTANT_LOW_CONFIDENCE_LINKS];

  const result: AssistantQueryResult = {
    disclaimer: ASSISTANT_DISCLAIMER,
    matches,
    suggestedLinks,
    refused: false,
    mode: matches.length > 0 ? 'faq' : 'fallback',
    refusalMessage:
      refusalMessage ??
      (matches.length === 0
        ? "I couldn't find a close match in our published guides. Try rephrasing, or use the links below."
        : undefined),
  };

  return enrichAssistantResult(result);
}

/** Attach primaryMatch for chat UI when FAQ matches exist. */
export function enrichAssistantResult(result: AssistantQueryResult): AssistantQueryResult {
  if (result.matches.length === 0) return result;
  return { ...result, primaryMatch: result.matches[0] };
}

function logResult(message: string, result: AssistantQueryResult, extras?: { faqOnlyTopic?: string; validationCode?: string }) {
  logAssistantQuery({
    messagePreview: message,
    mode: result.mode,
    refused: result.refused,
    sourceIds: result.sources?.map((s) => s.entry.id) ?? result.matches.map((m) => m.entry.id),
    validationFailed: Boolean(extras?.validationCode),
    validationCode: extras?.validationCode,
    faqOnlyTopic: extras?.faqOnlyTopic,
  });
}

export function queryAssistant(message: string): AssistantQueryResult {
  const result = queryAssistantCore(message);
  logResult(message, result);
  return result;
}

function queryAssistantCore(message: string): AssistantQueryResult {
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
  return buildFallbackResult(matches);
}

export async function queryAssistantWithLlm(message: string): Promise<AssistantQueryResult> {
  const base = queryAssistantCore(message);
  if (base.refused) {
    logResult(message, base);
    return base;
  }

  const faqOnlyTopic = matchFaqOnlyTopic(message);
  if (faqOnlyTopic) {
    const faqResult: AssistantQueryResult = enrichAssistantResult({
      ...base,
      mode: base.matches.length > 0 ? 'faq' : 'fallback',
      suggestedLinks:
        base.matches.length > 0
          ? []
          : [
              { href: faqOnlyTopic.guideHref, label: faqOnlyTopic.guideLabel },
              ...ASSISTANT_LOW_CONFIDENCE_LINKS,
            ],
    });
    logResult(message, faqResult, { faqOnlyTopic: faqOnlyTopic.id });
    return faqResult;
  }

  const topScore = base.matches[0]?.score ?? 0;
  if (topScore >= ASSISTANT_HIGH_CONFIDENCE_THRESHOLD) {
    const faqResult = enrichAssistantResult({ ...base, mode: 'faq' as const });
    logResult(message, faqResult);
    return faqResult;
  }

  if (!isAssistantLlmEnabled()) {
    logResult(message, base);
    return base;
  }

  try {
    const context = retrieveAssistantContext(message);
    const llmAnswer = await generateAssistantLlmAnswer(message, context);
    if (!llmAnswer) {
      logResult(message, base);
      return base;
    }

    const validation = validateAssistantLlmOutput(llmAnswer, context);
    if (!validation.valid) {
      console.warn('[assistant] LLM output rejected:', validation.code, validation.reason);
      const rejected: AssistantQueryResult = buildFallbackResult(base.matches, VALIDATION_FALLBACK_MESSAGE);
      logResult(message, rejected, { validationCode: validation.code });
      return rejected;
    }

    const result: AssistantQueryResult = enrichAssistantResult({
      ...base,
      mode: 'llm',
      llmAnswer,
      sources: context.filter((m) => m.score >= ASSISTANT_MATCH_THRESHOLD),
      matches: base.matches,
      suggestedLinks: base.matches.length === 0 ? base.suggestedLinks : [],
      refusalMessage: undefined,
    });
    logResult(message, result);
    return result;
  } catch (error) {
    console.error('[assistant] LLM fallback failed:', error);
    logResult(message, base);
    return base;
  }
}

/** Exported for tests — score a single entry. */
export function scoreAssistantEntryForTest(message: string, entry: AssistantEntry): number {
  return scoreEntry(tokenize(message), entry);
}

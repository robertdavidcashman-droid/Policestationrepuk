export type AssistantEntry = {
  id: string;
  question: string;
  answer: string;
  category: string;
  href?: string;
  keywords?: string[];
};

export type AssistantMatch = {
  entry: AssistantEntry;
  score: number;
};

export type AssistantSuggestedLink = {
  href: string;
  label: string;
};

export type AssistantResponseMode = 'faq' | 'llm' | 'fallback';

export type AssistantQueryResult = {
  disclaimer: string;
  matches: AssistantMatch[];
  suggestedLinks: AssistantSuggestedLink[];
  refused: boolean;
  refusalMessage?: string;
  /** How the answer was produced — FAQ matcher, LLM over corpus, or fallback links only. */
  mode?: AssistantResponseMode;
  /** Natural-language answer when mode is `llm`. */
  llmAnswer?: string;
  /** Corpus entries used as RAG context for an LLM answer. */
  sources?: AssistantMatch[];
  /** Top FAQ match when presenting hybrid FAQ replies in chat UI. */
  primaryMatch?: AssistantMatch;
};

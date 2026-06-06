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

export type AssistantQueryResult = {
  disclaimer: string;
  matches: AssistantMatch[];
  suggestedLinks: AssistantSuggestedLink[];
  refused: boolean;
  refusalMessage?: string;
};

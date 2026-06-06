import OpenAI from 'openai';
import { ASSISTANT_DISCLAIMER } from '@/lib/assistant/guardrails';
import type { AssistantMatch } from '@/lib/assistant/types';

const ASSISTANT_MODEL = 'gpt-4o-mini';
const MAX_CONTEXT_ENTRIES = 6;
const MAX_ANSWER_TOKENS = 450;

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function formatContext(matches: AssistantMatch[]): string {
  return matches
    .slice(0, MAX_CONTEXT_ENTRIES)
    .map((match, i) => {
      const link = match.entry.href ? `\nLink: ${match.entry.href}` : '';
      return `[${i + 1}] Category: ${match.entry.category}\nQ: ${match.entry.question}\nA: ${match.entry.answer}${link}`;
    })
    .join('\n\n');
}

export function isAssistantLlmEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateAssistantLlmAnswer(
  message: string,
  context: AssistantMatch[]
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const contextBlock =
    context.length > 0
      ? formatContext(context)
      : 'No closely matching published entries were retrieved.';

  const completion = await client.chat.completions.create({
    model: ASSISTANT_MODEL,
    temperature: 0.3,
    max_tokens: MAX_ANSWER_TOKENS,
    messages: [
      {
        role: 'system',
        content: `You are the guided assistant for PoliceStationRepUK (policestationrepuk.com).

Rules:
- Answer ONLY using the published context below. Do not invent fees, phone numbers, deadlines, or legal outcomes.
- This is general information from site guides — NOT legal advice. Never advise what someone should say in interview or do in a specific case.
- If the question is case-specific or needs a solicitor, say you cannot help with that and suggest instructing a criminal defence solicitor or using the site Contact page.
- If the context does not contain enough information, say so briefly and suggest relevant site pages from the context links or: /FAQ, /directory, /register, /Contact.
- Keep answers concise (roughly 2–4 short paragraphs). Use plain English.
- When helpful, mention relevant on-site paths like /register or /StationsDirectory.`,
      },
      {
        role: 'user',
        content: `Published context:\n\n${contextBlock}\n\nUser question:\n${message.trim()}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  return answer && answer.length > 0 ? answer : null;
}

/** Disclaimer re-exported for LLM responses — same as FAQ path. */
export { ASSISTANT_DISCLAIMER };

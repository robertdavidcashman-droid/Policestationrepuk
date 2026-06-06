import OpenAI from 'openai';
import type { PhoneClassification } from './types';
import { hasCustodyWordingNear } from './phone';

export interface ClassifyInput {
  phoneNumber: string;
  pageSnippet: string;
  sourceTitle: string;
  custodySuiteName: string;
  forceName: string;
}

const VALID: PhoneClassification[] = [
  'direct_custody',
  'switchboard',
  'general_101',
  'solicitor_office',
  'victim_witness',
  'irrelevant',
  'unknown',
];

function ruleBasedClassify(input: ClassifyInput): PhoneClassification {
  const hay = `${input.pageSnippet} ${input.sourceTitle}`.toLowerCase();
  const digits = input.phoneNumber.replace(/\D/g, '');

  if (digits === '101') return 'general_101';
  if (/victim|witness|victim support|witness care/i.test(hay)) return 'victim_witness';
  if (/solicitor|law firm|legal aid|chambers|defence firm/i.test(hay)) return 'solicitor_office';
  if (/switchboard|contact centre|contact center|main line|reception/i.test(hay)) return 'switchboard';

  if (
    hasCustodyWordingNear(input.pageSnippet) &&
    (hay.includes(input.custodySuiteName.toLowerCase().slice(0, 12)) ||
      /custody (suite|desk|telephone|phone|contact)/i.test(hay))
  ) {
    return 'direct_custody';
  }

  return 'unknown';
}

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function classifyPhoneNumber(input: ClassifyInput): Promise<PhoneClassification> {
  const fallback = ruleBasedClassify(input);
  const client = getClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 30,
      messages: [
        {
          role: 'system',
          content: `Classify UK police phone numbers found on web pages. Reply with exactly one label:
direct_custody, switchboard, general_101, solicitor_office, victim_witness, irrelevant, unknown.
Only use direct_custody when surrounding text strongly indicates a custody suite desk line for the named station.`,
        },
        {
          role: 'user',
          content: `Force: ${input.forceName}
Custody suite: ${input.custodySuiteName}
Number: ${input.phoneNumber}
Source title: ${input.sourceTitle}
Snippet: ${input.pageSnippet}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() as PhoneClassification;
    if (VALID.includes(raw)) return raw;
    return fallback;
  } catch {
    return fallback;
  }
}

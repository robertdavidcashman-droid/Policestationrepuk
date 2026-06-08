import { ASSISTANT_CORPUS } from '@/lib/assistant/corpus';
import { ASSISTANT_MAX_MATCHES } from '@/lib/assistant/match';
import { CONTACT_WHATSAPP_HREF } from '@/lib/contact-constants';
import {
  POLICESTATIONAGENT_HOME_HREF,
  shouldPromotePoliceStationAgent,
} from '@/lib/policestationagent-promo';
import type { AssistantMatch, AssistantQueryResult } from '@/lib/assistant/types';

/** Cover request — not community group join. */
const COVER_REQUEST_INTENT =
  /\b(need|want|get|find|book|instruct|urgent|looking for|require)\b.{0,48}\b(rep|representative|cover|solicitor|attendance)\b|\b(cover|rep)\b.{0,24}\b(police station|custody suite|custody|station)\b/i;

export function isJoinGroupIntent(message: string): boolean {
  return /\bwhatsapp\b/i.test(message) && /\b(join|group|community|sign up)\b/i.test(message);
}

export function isCoverRequestIntent(message: string): boolean {
  if (isJoinGroupIntent(message)) return false;
  return COVER_REQUEST_INTENT.test(message.trim());
}

/** Pages where in-area Kent cover WhatsApp is expected context. */
export function isPsaCoverPageContext(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  const lower = pathname.toLowerCase();
  if (lower.includes('kent')) return true;
  if (lower.startsWith('/police-station-rep-kent')) return true;
  if (lower.startsWith('/directory/kent')) return true;
  return false;
}

function corpusEntry(id: string) {
  return ASSISTANT_CORPUS.find((e) => e.id === id);
}

/** Route cover requests: in-area → Kent WhatsApp; out-of-area → directory only. */
export function enrichCoverRouting(message: string, result: AssistantQueryResult): AssistantQueryResult {
  if (result.refused || !isCoverRequestIntent(message)) return result;

  const inArea = shouldPromotePoliceStationAgent({ text: message });
  const kentCover = corpusEntry('site-kent-cover');
  const findRep = corpusEntry('site-find-rep');

  if (inArea && kentCover) {
    const kentMatch: AssistantMatch = { entry: kentCover, score: 1 };
    const others = result.matches.filter((m) => m.entry.id !== 'site-kent-cover');
    return {
      ...result,
      mode: 'faq',
      matches: [kentMatch, ...others].slice(0, ASSISTANT_MAX_MATCHES),
      suggestedLinks: [
        { href: CONTACT_WHATSAPP_HREF, label: 'Kent cover (WhatsApp)' },
        { href: POLICESTATIONAGENT_HOME_HREF, label: 'Police Station Agent — Kent' },
        { href: '/directory', label: 'Find a rep' },
      ],
      refusalMessage: undefined,
      llmAnswer: undefined,
    };
  }

  if (findRep) {
    return {
      ...result,
      mode: 'faq',
      matches: [{ entry: findRep, score: 1 }],
      suggestedLinks: [{ href: '/directory', label: 'Find a rep' }],
      refusalMessage: undefined,
      llmAnswer: undefined,
    };
  }

  return result;
}

export const NOTE_SOFTWARE_INTENT =
  /\b(custody\s*note|custodynote|attendance note software|digital custody notes?|pace notes?)\b/i;

export const STATION_PHONE_INTENT =
  /\b(station\s*(phone|number|telephone)|phone number|telephone number|custody desk)\b/i;

export function isNoteSoftwareIntent(message: string): boolean {
  return NOTE_SOFTWARE_INTENT.test(message.trim()) && !STATION_PHONE_INTENT.test(message.trim());
}

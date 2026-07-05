import {
  FORUM_ALTERNATIVE_REPS,
  WHATSAPP_JOIN_STEP_DECLINED,
  WHATSAPP_JOIN_STEP_PROOF,
} from '@/lib/community-messaging';
import {
  WHATSAPP_FIRM_JOIN_URL,
  WHATSAPP_JOIN_PHONE,
  WHATSAPP_JOIN_URL,
  WHATSAPP_SOLICITOR_JOIN_URL,
} from '@/lib/site-navigation';

export type WhatsAppAudienceId = 'reps' | 'solicitors' | 'firms';

export const WHATSAPP_AUDIENCE_PAGES = {
  reps: {
    path: '/WhatsApp/reps',
    label: 'Reps',
    shortLabel: 'Police station reps',
    joinUrl: WHATSAPP_JOIN_URL,
    seoTitle: 'Join WhatsApp — Police Station Reps',
    seoDescription:
      'Join the PoliceStationRepUK WhatsApp group as a fully accredited police station representative. Proof required. Real-time cover from criminal defence firms. Not qualified? Use the community forum.',
    headline: 'Join the WhatsApp group as a fully accredited police station rep',
    intro:
      'One verified group for fully accredited police station representatives and criminal defence professionals. Firms post urgent custody cover — you respond in real time. Not in training; proof of accreditation required.',
    benefits: [
      'See police station cover requests from firms as they are posted',
      'Respond quickly for evenings, weekends, and bank holidays',
      'Network with reps and criminal defence solicitors nationwide',
      'Free — no agency fees; you agree terms directly with the instructing firm',
    ],
    joinSteps: [
      'Text us on WhatsApp (button below) with your name, full accreditation (PSRAS / LCCSA / CLSA or equivalent), and areas you cover.',
      WHATSAPP_JOIN_STEP_PROOF,
      'You receive a WhatsApp invite — accept it to join the same group as firms and other reps.',
      WHATSAPP_JOIN_STEP_DECLINED,
    ],
    forumAlternative: FORUM_ALTERNATIVE_REPS,
    cta: 'Join on WhatsApp as a rep',
    related: [
      { href: '/register', label: 'List your profile in the directory' },
      { href: '/GetWork', label: 'Get Work guide' },
      { href: '/directory', label: 'Browse the reps directory' },
    ],
  },
  solicitors: {
    path: '/WhatsApp/solicitors',
    label: 'Solicitors',
    shortLabel: 'Criminal defence solicitors',
    joinUrl: WHATSAPP_SOLICITOR_JOIN_URL,
    seoTitle: 'Join WhatsApp — Criminal Defence Solicitors',
    seoDescription:
      'Join the PoliceStationRepUK WhatsApp group as a criminal defence solicitor or duty solicitor. Post cover requests and connect with accredited police station reps. Free to join.',
    headline: 'Join the WhatsApp group as a criminal defence solicitor',
    intro:
      'Duty solicitors, accredited representatives, and firm fee-earners use the same professional group to source police station cover and share operational updates.',
    benefits: [
      'Post urgent police station cover when your panel or rota needs a rep',
      'Reach accredited reps who cover your stations and counties',
      'Coordinate directly in the thread — no middleman',
      'Free to join; verified members only',
    ],
    joinSteps: [
      'Text us on WhatsApp with your name, firm name, firm email, and SRA number if applicable.',
      'We verify firm / solicitor details where needed.',
      'Accept your WhatsApp invite to join the group alongside reps and firms.',
    ],
    cta: 'Join on WhatsApp as a solicitor',
    related: [
      { href: '/PoliceStationCover', label: 'Police station cover for firms' },
      { href: '/directory', label: 'Find a police station rep' },
      { href: '/legal-services-directory/category/solicitors', label: 'Criminal defence solicitors (LAA directory)' },
    ],
  },
  firms: {
    path: '/WhatsApp/firms',
    label: 'Firms',
    shortLabel: 'Criminal defence firms',
    joinUrl: WHATSAPP_FIRM_JOIN_URL,
    seoTitle: 'Join WhatsApp — Criminal Defence Firms',
    seoDescription:
      'Join the PoliceStationRepUK WhatsApp group as a criminal defence firm. Post urgent police station cover requests to accredited reps across England and Wales. Free to join.',
    headline: 'Join the WhatsApp group as a criminal defence firm',
    intro:
      'Post out-of-hours and weekend police station attendance requests to accredited reps who cover your custody suites and interview stations.',
    benefits: [
      'Post urgent custody cover when your duty rota or panel needs a rep',
      'Hear back from reps who cover your areas and stations',
      'Instruct the rep directly once cover is agreed — no agency layer',
      'Works alongside the free PoliceStationRepUK directory',
    ],
    joinSteps: [
      'Text us on WhatsApp with your name, firm name, and firm email address.',
      'We verify firm details (e.g. against public records).',
      'Accept your invite — then post cover requests in the group when you need attendance.',
    ],
    cta: 'Join on WhatsApp as a firm',
    related: [
      { href: '/PoliceStationCover', label: 'Police station cover hub' },
      { href: '/directory', label: 'Search the reps directory' },
      { href: '/legal-services-directory/category/solicitors', label: 'Criminal defence solicitors (LAA directory)' },
    ],
  },
} as const satisfies Record<
  WhatsAppAudienceId,
  {
    path: string;
    label: string;
    shortLabel: string;
    joinUrl: string;
    seoTitle: string;
    seoDescription: string;
    headline: string;
    intro: string;
    benefits: readonly string[];
    joinSteps: readonly string[];
    cta: string;
    forumAlternative?: string;
    related: readonly { href: string; label: string }[];
  }
>;

export const WHATSAPP_AUDIENCE_LIST = (
  Object.keys(WHATSAPP_AUDIENCE_PAGES) as WhatsAppAudienceId[]
).map((id) => ({ id, ...WHATSAPP_AUDIENCE_PAGES[id] }));

export { WHATSAPP_JOIN_PHONE };

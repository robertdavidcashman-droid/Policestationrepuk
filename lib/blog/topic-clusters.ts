/**
 * Static topic clusters for internal linking on blog posts (pillar + related slugs).
 */
export type TopicClusterId = 'freelance-role' | 'firm-instruction' | 'attendance-communication';

export interface TopicClusterView {
  id: TopicClusterId;
  title: string;
  pillarPath: string;
  pillarLabel: string;
  /** Other posts in this cluster (excluding current slug), stable order */
  relatedSlugs: string[];
}

const CLUSTER_DEFS: Record<
  TopicClusterId,
  { title: string; pillarPath: string; pillarLabel: string; slugs: string[] }
> = {
  'freelance-role': {
    title: 'Freelance representative role and professional standards',
    pillarPath: '/AccreditedRepresentativeGuide',
    pillarLabel: 'Accredited representative guide',
    slugs: [
      'what-does-a-freelance-police-station-representative-do',
      'freelance-police-station-representative-vs-duty-solicitor',
      'what-makes-a-good-police-station-representative',
      'accreditation-and-standards-in-freelance-police-station-work',
      'how-freelance-police-station-reps-win-repeat-instructions',
      'freelance-police-station-rep-career',
      'professional-indemnity-insurance-reps',
      'police-station-rep-fee-rates-2026',
      'keep-directory-profile-useful',
      'accredited-reps-keep-availability-updated',
    ],
  },
  'firm-instruction': {
    title: 'How firms instruct and brief representatives',
    pillarPath: '/PoliceStationCover',
    pillarLabel: 'Police station cover for firms',
    slugs: [
      'how-firms-can-instruct-freelance-police-station-reps',
      'what-to-include-in-a-police-station-brief',
      'common-mistakes-when-instructing-freelance-police-station-reps',
      'out-of-hours-police-station-cover-for-law-firms',
      'why-firms-need-rep-directory',
      'how-firms-source-emergency-rep-cover',
      'police-station-rep-coverage-location-matters',
    ],
  },
  'attendance-communication': {
    title: 'Attendance, handovers, and communication',
    pillarPath: '/PACE',
    pillarLabel: 'PACE and custody context',
    slugs: [
      'police-station-attendance-checklist',
      'best-practice-handover-notes-after-police-station-attendance',
      'why-fast-clear-communication-matters-in-police-station-representation',
      'pre-interview-consultation-rep-guide',
      'how-to-review-custody-record',
      'handling-disclosure-police-station',
      'adverse-inference-no-comment-rep-guide',
    ],
  },
};

const SLUG_TO_CLUSTER: Record<string, TopicClusterId> = {};

for (const [id, def] of Object.entries(CLUSTER_DEFS) as [TopicClusterId, (typeof CLUSTER_DEFS)[TopicClusterId]][]) {
  for (const s of def.slugs) SLUG_TO_CLUSTER[s] = id;
}

export function getTopicClusterForSlug(slug: string): TopicClusterView | null {
  const id = SLUG_TO_CLUSTER[slug];
  if (!id) return null;
  const def = CLUSTER_DEFS[id];
  const relatedSlugs = def.slugs.filter((s) => s !== slug);
  return {
    id,
    title: def.title,
    pillarPath: def.pillarPath,
    pillarLabel: def.pillarLabel,
    relatedSlugs,
  };
}

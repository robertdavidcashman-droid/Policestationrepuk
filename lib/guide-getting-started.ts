export const GETTING_STARTED_ON_THIS_PAGE = [
  { id: 'who-for', label: 'Who this guide is for' },
  { id: 'path', label: 'Your path into the role' },
  { id: 'step-1', label: 'Step 1 — Understand the job' },
  { id: 'step-2', label: 'Step 2 — Find a supervising firm' },
  { id: 'step-3', label: 'Step 3 — PSRAS accreditation' },
  { id: 'step-4', label: 'Step 4 — After accreditation' },
  { id: 'essentials', label: 'Essentials from day one' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const GETTING_STARTED_PATH = [
  { step: 1, title: 'Learn what the role involves', href: '/WhatDoesRepDo', desc: 'Custody attendances, disclosure, interview, attendance notes.' },
  { step: 2, title: 'Read the custody lifecycle', href: '/BeginnersGuide', desc: 'PACE rights, DSCC, disclosure, interview, outcomes.' },
  { step: 3, title: 'Secure an SCC firm and supervisor', href: '/FindSupervisingSolicitor', desc: 'You cannot enrol or attend without firm sponsorship.' },
  { step: 4, title: 'Pass the written exam', href: '/PrepareForWrittenExam', desc: 'First PSRAS stage — or prove LAA exemption.' },
  { step: 5, title: 'Build your portfolio', href: '/BuildPortfolioGuide', desc: 'Nine case studies — Part A then Part B.' },
  { step: 6, title: 'Prepare for the CIT', href: '/PrepareForCIT', desc: 'Final role-play assessment.' },
  { step: 7, title: 'Follow the full PSRAS route', href: '/HowToBecomePoliceStationRep', desc: 'Timelines, costs, and FAQs.' },
  { step: 8, title: 'Find work after accreditation', href: '/GetWork', desc: 'Rota cover, directories, networking, reliability.' },
] as const;

export const GETTING_STARTED_ESSENTIALS = [
  'Driving licence and willingness to travel at short notice (often essential for freelance cover)',
  'Reliable phone and attendance-note workflow — firms live or die on 24/7 response',
  'PACE Code C familiarity before your first solo attendance',
  'Professional indemnity and firm contract arrangements before taking instructions',
  'Join practitioner communities for cover and peer support (see WhatsApp overview on site)',
] as const;

export const GETTING_STARTED_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep (full guide)', desc: 'Detailed 2026 PSRAS walkthrough' },
  { href: '/AccreditedRepresentativeGuide', label: 'Accredited representative guide', desc: 'What accreditation means on the register' },
  { href: '/CriminalLawCareerGuide', label: 'Criminal law careers', desc: 'Broader solicitor and fee-earner routes' },
  { href: '/register', label: 'Join the directory', desc: 'Free listing for accredited reps' },
] as const;

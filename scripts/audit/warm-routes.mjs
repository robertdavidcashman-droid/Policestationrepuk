// Warm a dev server by hitting every audit entry point + a sample of dynamic
// pages serially, so subsequent parallel test runs don't time out on first compile.
const BASE = process.argv[2] || 'http://127.0.0.1:3100';

const ROUTES = [
  '/', '/Resources', '/Blog', '/HowToBecomePoliceStationRep', '/HowToBecome',
  '/Contact', '/About', '/directory', '/register', '/Account',
  '/FAQ', '/Wiki', '/PACE', '/FormsLibrary',
  '/BeginnersGuide', '/GetWork', '/DSCCRegistrationGuide', '/PrepareForCIT',
  '/BuildPortfolioGuide', '/CriminalLawCareerGuide', '/AccreditedRepresentativeGuide',
  '/DutySolicitorVsRep', '/PoliceDisclosureGuide', '/WhatDoesRepDo',
  '/InterviewUnderCaution', '/GettingStarted',
  '/sitemap.xml', '/robots.txt',
];

for (const r of ROUTES) {
  const url = BASE + r;
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log(`${String(res.status).padStart(3)} ${String(Date.now() - start).padStart(5)}ms ${r}`);
  } catch (e) {
    console.log(`ERR ${String(Date.now() - start).padStart(5)}ms ${r} :: ${e.message}`);
  }
}

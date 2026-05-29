#!/usr/bin/env node
/**
 * Record admin review status for high-risk legacy reps not added to the
 * directory. Keeps them hidden but documents the external review so admins
 * have context if the rep contacts us.
 *
 * Usage:
 *   npx tsx scripts/mark-held-high-risk-reps.mjs
 *   npx tsx scripts/mark-held-high-risk-reps.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';

function readEnvLocal() {
  const f = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v.trim();
  }
  return out;
}

const DRY_RUN = process.argv.includes('--dry-run');
Object.assign(process.env, readEnvLocal());

const { setReview } = await import('../lib/admin-review.ts');
const { getRawReps, invalidateProfileCache } = await import('../lib/data.ts');

/** Not published — held for admin reference if they contact us. */
const HELD = [
  {
    email: 'hxsxnk786@gmail.com',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No firm name, website, or external PSR listing found',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: listed on PoliceStationRepUK only; no website, LinkedIn, firm, or third-party PSR/solicitor listing. DSCC register: no match for supplied PIN/name.
If they contact us: request DSCC PIN proof, firm affiliation, station coverage, and professional webpage before approval.`,
  },
  {
    email: 'markcarrington@hotmail.co.uk',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No credible external PSR or solicitor listing',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: no credible PSR/solicitor listing tied to phone/email/area; not on policestationreps.com Lancashire results. DSCC register: no match.
If they contact us: require DSCC accreditation proof, firm details, and station list before any listing.`,
  },
  {
    email: 'matthew.craig@rocketmail.com',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No external PSR listing beyond this directory',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: Lincolnshire directory listing only; no firm, website, or independent PSR listing. DSCC register: no match.
If they contact us: request DSCC proof, stations covered, and firm/supervising solicitor details.`,
  },
  {
    email: 'jakedarbandi@gmail.com',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No external professional listing found',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: no website, LinkedIn, firm, or third-party PSR/solicitor listing found. DSCC register: no match.
If they contact us: require full accreditation evidence and station coverage before approval.`,
  },
  {
    email: 'anthony.grime@hotmail.com',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No external professional listing found',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: no PSR/solicitor listing found (Andrew Grime barrister is a different person). DSCC register: no match.
If they contact us: require DSCC proof and firm affiliation before listing.`,
  },
  {
    email: 'russell.nash3@btinternet.com',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No external PSR listing beyond this directory',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: Essex/London directory listing only; no firm, website, or independent listing. DSCC register: no match (unrelated Alexander Nash on register).
If they contact us: request DSCC proof, stations, and firm details.`,
  },
  {
    email: 'shaneoneill914@yahoo.co.uk',
    riskCategory: 'high',
    riskReasons: [
      'Lists counties but no specific police stations',
      'No external PSR listing beyond this directory',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: Cheshire directory listing only; no Manchester PSR listing. Unrelated Shane O'Neill solicitors (Belfast) and police officers found. DSCC register: no match.
If they contact us: require DSCC proof, station list, and supervising firm.`,
  },
  {
    email: 'aaqib.raheem@outlook.com',
    riskCategory: 'medium',
    riskReasons: [
      'Lists counties but no specific police stations',
      'File handler at Din Solicitors — role unclear for PSR listing',
      'DSCC accredited register: no name match',
    ],
    adminNotes: `[held 2026-05-29] External review — NOT added to directory.
Findings: RocketReach lists as file handler at Din Solicitors (Halifax); directory listing only for PSR role. Not on DSCC register. No website/LinkedIn on profile.
If they contact us: clarify whether accredited PSR or solicitor; request DSCC/SRA proof and firm authorisation if rep role confirmed.`,
  },
];

const staticByEmail = new Map(
  getRawReps().map((r) => [r.email.toLowerCase(), r]),
);

const results = [];

for (const target of HELD) {
  const email = target.email.toLowerCase();
  const staticRep = staticByEmail.get(email);
  if (!staticRep) {
    results.push({ email, ok: false, error: 'Not found in data/reps.json' });
    continue;
  }

  if (DRY_RUN) {
    results.push({
      email,
      ok: true,
      dryRun: true,
      name: staticRep.name,
      verificationStatus: 'awaiting-evidence',
      riskCategory: target.riskCategory,
    });
    continue;
  }

  try {
    const review = await setReview(
      email,
      {
        status: 'flagged',
        verificationStatus: 'awaiting-evidence',
        adminApproved: false,
        isPublic: false,
        riskCategory: target.riskCategory,
        riskReasons: target.riskReasons,
        adminNotes: target.adminNotes,
      },
      'script:mark-held-high-risk-reps',
    );

    results.push({
      email,
      ok: true,
      name: staticRep.name,
      slug: staticRep.slug,
      verificationStatus: review.verificationStatus,
      riskCategory: review.riskCategory,
    });
  } catch (err) {
    results.push({
      email,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

if (!DRY_RUN) {
  invalidateProfileCache();
}

console.log(JSON.stringify({ dryRun: DRY_RUN, held: results }, null, 2));

const failed = results.filter((r) => !r.ok);
if (failed.length) process.exit(1);

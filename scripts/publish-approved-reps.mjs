#!/usr/bin/env node
/**
 * Manually publish specific legacy reps to the public directory with enriched
 * profile overrides and admin review approval.
 *
 * Usage:
 *   npx tsx scripts/publish-approved-reps.mjs
 *   npx tsx scripts/publish-approved-reps.mjs --dry-run
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
const { getKV } = await import('../lib/kv.ts');
const { getRawReps, invalidateProfileCache } = await import('../lib/data.ts');
const { isPubliclyVisible } = await import('../lib/rep-status.ts');

/** Reps approved for directory listing after external verification review. */
const TARGETS = [
  {
    email: 'jason@jlc-law.co.uk',
    slug: 'jason-lacorbiniere',
    verificationStatus: 'verified-solicitor',
    profile: {
      name: 'Jason Lacorbiniere',
      phone: '07766834996',
      website_url: 'https://jlc-law.co.uk/',
      accreditation: 'Solicitor',
      notes:
        'Director of JLC Law Ltd. SRA-regulated criminal defence solicitor (SRA 520491). Police station representation across Sussex.',
      stations_covered: [
        'Brighton Hollingbury',
        'Brighton John Street',
        'Worthing',
        'Crawley',
        'Shoreham-by-Sea',
        'Haywards Heath',
        'Gatwick',
        'Salfords',
        'Eastbourne',
        'Hastings',
      ],
      dscc_pin: '12989',
    },
    adminNotes:
      '[manual] Added to directory after external verification — SRA 520491, jlc-law.co.uk.',
  },
  {
    email: 'foxlegals@gmail.com',
    slug: 'tonya-fox',
    verificationStatus: 'verified-psras',
    profile: {
      name: 'Tonya Fox',
      phone: '07943187460',
      website_url:
        'https://turnocks.com/tonya-fox-consultant-police-station-representative/',
      accreditation: 'Accredited Police Station Rep',
      notes: 'Consultant Police Station Representative at Turnocks Defence Solicitors.',
      stations_covered: ['Northern Area Custody Facility, Stoke on Trent'],
      dscc_pin: '7850',
    },
    adminNotes:
      '[manual] Added to directory — Turnocks Defence Solicitors team page confirms PSR role.',
  },
  {
    email: 'rajchoprasolicitor@gmail.com',
    slug: 'raj-chopra',
    verificationStatus: 'verified-solicitor',
    profile: {
      name: 'Raj Chopra',
      phone: '07780855404',
      accreditation: 'Solicitor',
      notes:
        'Criminal defence solicitor based in Handforth, Wilmslow (Cheshire). Covers Cheshire and surrounding areas.',
      dscc_pin: '2114',
    },
    adminNotes:
      '[manual] Added to directory — external solicitor listings match profile phone and area.',
  },
];

const staticByEmail = new Map(
  getRawReps().map((r) => [r.email.toLowerCase(), r]),
);

const now = new Date().toISOString();
const results = [];

for (const target of TARGETS) {
  const email = target.email.toLowerCase();
  const staticRep = staticByEmail.get(email);
  if (!staticRep) {
    results.push({ email, ok: false, error: 'Not found in data/reps.json' });
    continue;
  }

  const profilePayload = {
    ...target.profile,
    email,
    rep_slug: target.slug ?? staticRep.slug,
    updated_at: now,
    updated_by: 'script:publish-approved-reps',
  };

  if (DRY_RUN) {
    results.push({
      email,
      ok: true,
      dryRun: true,
      verificationStatus: target.verificationStatus,
      profile: profilePayload,
    });
    continue;
  }

  const kv = getKV();
  if (!kv) {
    results.push({ email, ok: false, error: 'KV not configured' });
    continue;
  }

  try {
    const existing = (await kv.get(`profile:${email}`)) ?? {};
    await kv.set(`profile:${email}`, { ...existing, ...profilePayload });

    const review = await setReview(
      email,
      {
        status: 'approved',
        verificationStatus: target.verificationStatus,
        adminApproved: true,
        isPublic: true,
        lastVerifiedDate: now,
        riskCategory: 'low',
        riskReasons: ['Manually approved after external verification review'],
        adminNotes: target.adminNotes,
      },
      'script:publish-approved-reps',
    );

    const visible = isPubliclyVisible({
      status: review.verificationStatus,
      adminApproved: review.adminApproved,
      isPublic: review.isPublic,
      lastVerifiedDate: review.lastVerifiedDate,
    });

    results.push({
      email,
      ok: true,
      name: staticRep.name,
      slug: staticRep.slug,
      verificationStatus: review.verificationStatus,
      publiclyVisible: visible,
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

console.log(JSON.stringify({ dryRun: DRY_RUN, published: results }, null, 2));

const failed = results.filter((r) => !r.ok);
if (failed.length) process.exit(1);

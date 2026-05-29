#!/usr/bin/env node
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

Object.assign(process.env, readEnvLocal());

const { getAllRepsForAdmin, getAllRegisteredRepsRaw } = await import('../lib/data.ts');
const { loadAllReviews } = await import('../lib/admin-review.ts');
const { listAllVerifications } = await import('../lib/rep-verification.ts');
const { getDsccRegisterCache, checkDsccPinAgainstRegister } = await import('../lib/dscc-register-lookup.ts');
const { loadRegulatoryHintsByEmail } = await import('../lib/regulatory-auto-pass.ts');
const { scoreRepRisk, resolveAuditRiskAssessment } = await import('../lib/rep-risk.ts');
const { matchesAutomatedSmokeRep } = await import('../lib/directory-blocklist.ts');
const { isPubliclyVisible } = await import('../lib/rep-status.ts');

const [reps, reviews, verifications, registeredRaw, dsccCache, hints] = await Promise.all([
  getAllRepsForAdmin(),
  loadAllReviews(),
  listAllVerifications(),
  getAllRegisteredRepsRaw(),
  getDsccRegisterCache(),
  loadRegulatoryHintsByEmail(),
]);

const dsccEntries = dsccCache?.entries ?? [];
const verByEmail = new Map(verifications.map((v) => [v.email.toLowerCase(), v]));
const regByEmail = new Map();
for (const r of registeredRaw) {
  const email = String(r.row?.email || '').toLowerCase();
  if (email) regByEmail.set(email, r.row);
}

function extractLinkedIn(...fields) {
  const text = fields.filter(Boolean).join(' ');
  const m = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s"'<>]+/i);
  return m ? m[0] : '';
}

const highRisk = [];
for (const rep of reps) {
  const email = rep.email.toLowerCase();
  if (!email.includes('@')) continue;
  if (
    matchesAutomatedSmokeRep({
      email,
      name: rep.name,
      slug: rep.slug,
      notes: rep.notes ?? rep.bio ?? '',
    })
  ) {
    continue;
  }

  const review = reviews.get(email) ?? null;
  const v = verByEmail.get(email);
  const h = hints.get(email);
  const reg = regByEmail.get(email);
  const pin = v?.pinNumber || rep.dsccPin || h?.pinNumber || '';
  const website =
    rep.websiteUrl ||
    v?.professionalProfileUrl ||
    String(reg?.professional_profile_url || reg?.website_url || '');
  const linkedin = extractLinkedIn(
    website,
    v?.professionalProfileUrl,
    reg?.professional_profile_url,
    reg?.website_url,
    rep.bio,
    rep.notes,
    v?.publicProfileNotes,
  );

  const heuristic = scoreRepRisk({
    email,
    phone: rep.phone || v?.mobile || '',
    name: rep.name,
    accreditation: v?.category || rep.accreditation,
    pinNumber: pin,
    sraNumber: v?.sraNumber || h?.sraNumber || '',
    accreditationProofFile: v?.accreditationProofFile || String(reg?.proof_url || ''),
    firmName: v?.firmName || String(reg?.firm_name || ''),
    professionalProfileUrl: website,
    counties: rep.counties?.length ? rep.counties : rep.county ? [rep.county] : [],
    stations: rep.stations || [],
    notes: rep.notes || rep.bio || '',
    status: review?.verificationStatus ?? null,
    adminApproved: review?.adminApproved ?? null,
    isPublic: review?.isPublic ?? null,
    lastVerifiedDate: review?.lastVerifiedDate ?? null,
    registeredAt: String(reg?.registeredAt || v?.submittedAt || ''),
  });

  const pinMatch =
    pin && dsccEntries.length
      ? checkDsccPinAgainstRegister(rep.name, pin, dsccEntries)
      : null;
  const risk = resolveAuditRiskAssessment(
    heuristic,
    review,
    pinMatch?.matched ? pinMatch : null,
  );

  if (risk.category !== 'high') continue;

  highRisk.push({
    email,
    name: rep.name,
    slug: rep.slug,
    accreditation: rep.accreditation,
    publiclyVisible: isPubliclyVisible({
      status: review?.verificationStatus ?? null,
      adminApproved: review?.adminApproved ?? null,
      isPublic: review?.isPublic ?? null,
      lastVerifiedDate: review?.lastVerifiedDate ?? null,
    }),
    verificationStatus: review?.verificationStatus ?? null,
    phone: rep.phone || v?.mobile || '',
    pin: pin || null,
    sra: v?.sraNumber || h?.sraNumber || null,
    firm: v?.firmName || String(reg?.firm_name || '') || null,
    website: website || null,
    linkedin: linkedin || null,
    proof: v?.accreditationProofFile || String(reg?.proof_url || '') || null,
    highFlags: risk.highRiskFlags,
    mediumFlags: risk.mediumRiskFlags.slice(0, 4),
  });
}

console.log(JSON.stringify({ highRiskCount: highRisk.length, reps: highRisk }, null, 2));

// DSCC register cross-check for high-risk rows
if (dsccEntries.length > 0 && highRisk.length > 0) {
  const { findDsccRegisterMatches, checkDsccPinAgainstRegister } = await import('../lib/dscc-register-lookup.ts');
  console.error('\n--- DSCC register cross-check ---');
  for (const r of highRisk) {
    const partial = findDsccRegisterMatches(r.name, dsccEntries, { allowPartial: true });
    const pinCheck = r.pin ? checkDsccPinAgainstRegister(r.name, r.pin, dsccEntries) : null;
    console.error(JSON.stringify({
      name: r.name,
      pin: r.pin,
      dsccPartialMatches: partial.length,
      dsccRegisterName: partial[0] ? `${partial[0].forename} ${partial[0].surname}` : null,
      firm: partial[0]?.firm ?? null,
      pinNameMatched: pinCheck?.matched ?? false,
    }));
  }
  console.error('\n--- DSCC surname fragment search ---');
  for (const r of highRisk) {
    const surname = r.name.trim().split(/\s+/).pop()?.toUpperCase() ?? '';
    const hits = dsccEntries.filter((e) =>
      `${e.forename} ${e.surname}`.toUpperCase().includes(surname),
    );
    if (hits.length && hits.length <= 8) {
      console.error(surname, hits.map((e) => `${e.forename} ${e.surname}`).join('; '));
    } else if (hits.length) {
      console.error(surname, `${hits.length} hits (too many to list)`);
    }
  }
}

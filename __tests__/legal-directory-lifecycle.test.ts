import { describe, it, expect, beforeAll } from 'vitest';
import {
  createListing,
  getListingById,
  getListingBySlug,
  getListingByOwnerEmail,
  listAllListings,
  listApprovedListings,
  toPublicListing,
  saveListing,
  applyPendingChanges,
  resolveManagementToken,
  issueManagementTokenForListing,
  filterListings,
} from '@/lib/legal-directory/storage';
import { scoreLegalDirectorySubmission } from '@/lib/legal-directory/risk';
import {
  sanitizeMultiline,
  sanitizeText,
  sanitizeUrl,
  containsScriptOrInjection,
  validateDescription,
} from '@/lib/legal-directory/sanitize';
import { getCategoryBySlug } from '@/lib/legal-directory/categories';
import { matchListingToLocation } from '@/lib/legal-directory/locations';

const VALID_DESC =
  'We are an established criminal defence firm covering Kent police stations and magistrates courts with over twenty years of experience.';

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    businessName: 'Kent Criminal Defence Solicitors',
    providerType: 'Criminal defence solicitor',
    categorySlug: 'solicitors',
    contactPerson: 'Jane Smith',
    email: `owner-${Math.random().toString(36).slice(2, 8)}@example.com`,
    phone: '01622 123456',
    town: 'Maidstone',
    county: 'Kent',
    description: VALID_DESC,
    areasCovered: 'Kent, Medway',
    specialisms: 'Police station, Crown Court',
    legalAidStatus: 'yes' as const,
    availability24Hour: true,
    regulatoryBody: 'SRA',
    regulatoryNumber: '123456',
    consentAuthority: true,
    consentGdpr: true,
    ...overrides,
  };
}

describe('Legal Directory — sanitisation', () => {
  it('strips HTML tags from text', () => {
    expect(sanitizeText('<b>Hello</b> <script>x</script>world', 100)).toBe('Hello xworld');
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeText('  a   b   c  ', 100)).toBe('a b c');
  });

  it('validates and normalises URLs, rejecting junk', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('detects script / injection patterns on raw input', () => {
    expect(containsScriptOrInjection('<script>alert(1)</script>')).toBe(true);
    expect(containsScriptOrInjection('onerror=alert(1)')).toBe(true);
    expect(containsScriptOrInjection("' OR '1'='1")).toBe(true);
    expect(containsScriptOrInjection('A normal description of legal services.')).toBe(false);
  });

  it('enforces description length and link limits', () => {
    expect(validateDescription('too short')).toMatch(/at least 80/);
    expect(
      validateDescription(`${VALID_DESC} http://a.com http://b.com http://c.com http://d.com`),
    ).toMatch(/limit links/);
    expect(validateDescription(VALID_DESC)).toBeNull();
  });
});

describe('Legal Directory — risk scoring', () => {
  it('marks honeypot submissions as rejected_spam', () => {
    const r = scoreLegalDirectorySubmission({
      businessName: 'x',
      email: 'a@b.com',
      description: VALID_DESC,
      websiteUrl: '',
      regulatoryNumber: '',
      regulatoryBody: '',
      category: 'solicitors',
      honeypotFilled: true,
    });
    expect(r.riskScore).toBe(100);
    expect(r.suggestedStatus).toBe('rejected_spam');
  });

  it('flags script attempts for review', () => {
    const r = scoreLegalDirectorySubmission({
      businessName: 'x',
      email: 'a@b.com',
      description: VALID_DESC,
      websiteUrl: '',
      regulatoryNumber: '',
      regulatoryBody: '',
      category: 'solicitors',
      scriptAttempt: true,
    });
    expect(r.reviewFlags).toContain('script_or_injection_attempt');
    expect(r.suggestedStatus).toBe('flagged_for_review');
  });

  it('raises score for disposable email + url shortener + spam keyword', () => {
    const r = scoreLegalDirectorySubmission({
      businessName: 'Crypto Casino Deals',
      email: 'spammer@mailinator.com',
      description: VALID_DESC,
      websiteUrl: 'https://bit.ly/abc',
      regulatoryNumber: '',
      regulatoryBody: '',
      category: 'solicitors',
    });
    expect(r.riskScore).toBeGreaterThanOrEqual(51);
    expect(r.suggestedStatus).toBe('flagged_for_review');
    expect(r.reviewFlags).toContain('disposable_email_domain');
    expect(r.reviewFlags).toContain('url_shortener');
  });

  it('treats a clean submission as normal pending review', () => {
    const r = scoreLegalDirectorySubmission({
      businessName: 'Kent Criminal Defence Solicitors',
      email: 'jane@kentdefence.co.uk',
      description: VALID_DESC,
      websiteUrl: 'https://kentdefence.co.uk',
      regulatoryNumber: '123456',
      regulatoryBody: 'SRA',
      category: 'solicitors',
    });
    expect(r.riskScore).toBeLessThanOrEqual(20);
    expect(r.suggestedStatus).toBe('pending_review');
  });
});

describe('Legal Directory — full lifecycle (in-memory store)', () => {
  it('creates a listing as pending_review and keeps it out of public views', async () => {
    const res = await createListing(baseInput({ email: 'lifecycle@example.com' }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.status).toBe('pending_review');
    expect(res.managementToken).toBeTruthy();

    const stored = await getListingById(res.id);
    expect(stored?.status).toBe('pending_review');

    // Not visible publicly until approved.
    const approved = await listApprovedListings();
    expect(approved.find((l) => l.id === res.id)).toBeUndefined();
    const bySlug = await getListingBySlug(res.slug);
    expect(bySlug?.status).toBe('pending_review');
  });

  it('rejects a duplicate listing for the same owner email', async () => {
    const email = 'dupe@example.com';
    const first = await createListing(baseInput({ email }));
    expect(first.ok).toBe(true);
    const second = await createListing(baseInput({ email }));
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toMatch(/already exists/i);
  });

  it('approves, then appears in public search and strips private fields', async () => {
    const res = await createListing(baseInput({ email: 'approve@example.com' }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const listing = await getListingById(res.id);
    expect(listing).not.toBeNull();
    listing!.status = 'approved';
    listing!.dateApproved = new Date().toISOString();
    await saveListing(listing!);

    const approved = await listApprovedListings();
    expect(approved.find((l) => l.id === res.id)).toBeDefined();

    const pub = toPublicListing(listing!);
    expect((pub as Record<string, unknown>).ownerEmail).toBeUndefined();
    expect((pub as Record<string, unknown>).managementTokenHash).toBeUndefined();
    expect((pub as Record<string, unknown>).riskScore).toBeUndefined();
    expect(pub.businessName).toBe(listing!.businessName);
  });

  it('holds amendments as pendingChanges and only applies on approval', async () => {
    const res = await createListing(baseInput({ email: 'amend@example.com' }));
    if (!res.ok) return;
    const listing = (await getListingById(res.id))!;
    listing.status = 'approved';
    await saveListing(listing);

    // Simulate amendment submission.
    listing.pendingChanges = { phone: '0207 999 0000', description: `${VALID_DESC} Updated.` };
    listing.status = 'pending_update';
    await saveListing(listing);

    // Public listing should still show original phone until approval.
    const beforeApproval = (await getListingById(res.id))!;
    expect(beforeApproval.phone).toBe('01622 123456');
    expect(beforeApproval.pendingChanges).not.toBeNull();

    const updated = await applyPendingChanges(res.id, 'admin@test.local');
    expect(updated?.phone).toBe('0207 999 0000');
    expect(updated?.status).toBe('approved');
    expect(updated?.pendingChanges).toBeNull();
  });

  it('issues and resolves a secure management token; rejects garbage tokens', async () => {
    const res = await createListing(baseInput({ email: 'token@example.com' }));
    if (!res.ok) return;
    const listing = (await getListingById(res.id))!;

    const token = await issueManagementTokenForListing(listing);
    expect(token).toBeTruthy();

    const resolved = await resolveManagementToken(token!);
    expect(resolved?.listing.id).toBe(res.id);
    expect(resolved?.email).toBe('token@example.com');

    const bad = await resolveManagementToken('not-a-real-token');
    expect(bad).toBeNull();
  });

  it('marks deletion_requested and excludes deleted listings from public/search', async () => {
    const res = await createListing(baseInput({ email: 'delete@example.com' }));
    if (!res.ok) return;
    const listing = (await getListingById(res.id))!;
    listing.status = 'approved';
    await saveListing(listing);

    listing.status = 'deletion_requested';
    listing.deletionRequestedAt = new Date().toISOString();
    await saveListing(listing);
    expect((await listApprovedListings()).find((l) => l.id === res.id)).toBeUndefined();

    listing.status = 'deleted';
    await saveListing(listing);
    const resolved = await resolveManagementToken((await issueManagementTokenForListing(listing)) ?? 'x');
    // Deleted listings cannot be managed via token.
    expect(resolved).toBeNull();
  });

  it('filters approved listings by category, county and 24h availability', async () => {
    const res = await createListing(
      baseInput({ email: 'filter@example.com', town: 'Canterbury', county: 'Kent' }),
    );
    if (!res.ok) return;
    const listing = (await getListingById(res.id))!;
    listing.status = 'approved';
    await saveListing(listing);

    const all = await listAllListings();
    expect(filterListings(all, { categorySlug: 'solicitors' }).length).toBeGreaterThan(0);
    expect(filterListings(all, { categorySlug: 'barristers' }).find((l) => l.id === res.id)).toBeUndefined();
    expect(filterListings(all, { county: 'Kent' }).find((l) => l.id === res.id)).toBeDefined();
    expect(filterListings(all, { availability24Hour: true }).find((l) => l.id === res.id)).toBeDefined();
  });
});

describe('Legal Directory — categories & locations', () => {
  it('resolves known category slugs', () => {
    expect(getCategoryBySlug('solicitors')?.label).toMatch(/Solicitors/);
    expect(getCategoryBySlug('nope')).toBeUndefined();
  });

  it('matches a listing to its county location', () => {
    const listing = { county: 'Kent', town: 'Maidstone', region: 'South East', areasCovered: 'Medway' };
    expect(matchListingToLocation(listing, 'kent')).toBe(true);
    expect(matchListingToLocation(listing, 'cornwall')).toBe(false);
  });
});

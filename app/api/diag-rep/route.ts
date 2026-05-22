import { NextResponse } from 'next/server';
import {
  getRepBySlug,
  getAllReps,
  stripPrivateFields,
} from '@/lib/data';
import {
  buildMetadata,
  legalServiceSchema,
  breadcrumbSchema,
  personSchema,
} from '@/lib/seo';
import { availabilityBucket, isUrgentCoverCapable, profileCompleteness } from '@/lib/directory-ranking';
import { looksIneligible } from '@/lib/rep-status';

// TEMPORARY: walks the full /rep/[slug] page render so the actual throw is
// surfaced as JSON instead of being swallowed into a generic 500.
export const dynamic = 'force-dynamic';

async function safe<T>(label: string, fn: () => Promise<T> | T): Promise<{ label: string; ok: boolean; result?: unknown; error?: string }> {
  try {
    const result = await fn();
    return { label, ok: true, result: typeof result === 'object' && result !== null ? Object.keys(result) : result };
  } catch (err) {
    return {
      label,
      ok: false,
      error: err instanceof Error ? `${err.message}\n${err.stack}` : String(err),
    };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || 'wayne-thomas-wtlegalo';
  const steps: unknown[] = [];

  let found: Awaited<ReturnType<typeof getRepBySlug>>;
  steps.push(await safe('1. getRepBySlug', async () => {
    found = await getRepBySlug(slug);
    return { name: found?.name, email: found?.email };
  }));

  if (!found) {
    return NextResponse.json({ slug, foundRep: false, steps }, { status: 200 });
  }

  let rep: Awaited<ReturnType<typeof stripPrivateFields>> | undefined;
  steps.push(await safe('2. stripPrivateFields', () => {
    rep = stripPrivateFields(found!);
    return { name: rep.name };
  }));

  steps.push(await safe('3. looksIneligible', () => {
    return looksIneligible(rep!.accreditation, rep!.notes, rep!.bio);
  }));

  steps.push(await safe('4. availabilityBucket', () => {
    return availabilityBucket(rep!.availability || '');
  }));

  steps.push(await safe('5. isUrgentCoverCapable', () => {
    return isUrgentCoverCapable(rep!);
  }));

  steps.push(await safe('6. profileCompleteness', () => {
    return profileCompleteness(rep!);
  }));

  steps.push(await safe('7. legalServiceSchema', () => {
    return legalServiceSchema({
      name: rep!.name,
      slug: rep!.slug,
      counties: [rep!.county].filter(Boolean),
      accreditation: rep!.accreditation,
      phone: rep!.phone,
    });
  }));

  steps.push(await safe('8. personSchema', () => {
    return personSchema({
      name: rep!.name,
      slug: rep!.slug,
      phone: rep!.phone,
      accreditation: rep!.accreditation,
      counties: [rep!.county].filter(Boolean),
    });
  }));

  steps.push(await safe('9. breadcrumbSchema', () => {
    return breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Directory', url: '/directory' },
      { name: rep!.name, url: `/rep/${rep!.slug}` },
    ]);
  }));

  steps.push(await safe('10. buildMetadata', () => {
    return buildMetadata({
      title: `${rep!.name} | Police Station Representative`,
      description: `Test`,
      path: `/rep/${rep!.slug}`,
    });
  }));

  steps.push(await safe('11. getAllReps (sanity)', async () => {
    const all = await getAllReps();
    return { total: all.length };
  }));

  return NextResponse.json({ slug, foundRep: true, repName: rep?.name, steps }, { status: 200 });
}

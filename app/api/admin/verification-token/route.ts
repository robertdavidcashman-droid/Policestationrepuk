import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createVerificationToken, getEnquiryByEmail, updateEnquiryStatus } from '@/lib/rep-verification';
import { setReview } from '@/lib/admin-review';
import { sendContactNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface Body {
  email?: unknown;
  enquiryId?: unknown;
  notifyApplicant?: unknown;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const enquiryId = typeof body.enquiryId === 'string' ? body.enquiryId : undefined;
  try {
    const tokenRecord = await createVerificationToken({
      email,
      issuedBy: auth.email,
      enquiryId,
    });
    const link = makeVerificationLink(request, tokenRecord.token);

    // Update enquiry status if it exists.
    try {
      const enquiry = enquiryId
        ? await getEnquiryByEmail(email)
        : await getEnquiryByEmail(email);
      if (enquiry) {
        await updateEnquiryStatus(enquiry.id, {
          status: 'verification-link-sent',
          verificationLinkSentAt: tokenRecord.issuedAt,
        });
      }
    } catch (err) {
      console.warn('[issue-verification] enquiry update failed:', err);
    }

    // Mark review as link-sent so the admin audit view tracks it.
    try {
      await setReview(
        email,
        {
          verificationStatus: 'verification-link-sent',
          adminApproved: false,
          isPublic: false,
          adminNotes: `[auto] Verification link issued at ${tokenRecord.issuedAt} by ${auth.email}.`,
        },
        auth.email,
      );
    } catch (err) {
      console.warn('[issue-verification] review update failed:', err);
    }

    // Best-effort email to applicant (the admin can also copy/paste the link manually).
    if (body.notifyApplicant !== false) {
      sendContactNotification({
        name: 'PoliceStationRepUK admin',
        email,
        subject: 'Your secure verification link',
        message: [
          `Hello,`,
          ``,
          `Thank you for your application to PoliceStationRepUK.`,
          ``,
          `Please complete your secure verification at the private link below. The link is single-use and expires on ${tokenRecord.expiresAt}.`,
          ``,
          link,
          ``,
          `Your address, PIN number, SRA number, uploaded documents and verification material will not be published in the public directory.`,
          ``,
          `If you did not request this verification, you can ignore this email.`,
          ``,
          `— PoliceStationRepUK admin`,
        ].join('\n'),
      }).catch((err) => console.warn('[issue-verification] notify failed:', err));
    }

    return NextResponse.json({
      ok: true,
      token: tokenRecord.token,
      expiresAt: tokenRecord.expiresAt,
      link,
    });
  } catch (err) {
    console.error('[issue-verification] unexpected error:', err);
    return NextResponse.json({ error: 'Could not issue verification token.' }, { status: 502 });
  }
}

function makeVerificationLink(request: Request, token: string): string {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  return `${base}/secure-rep-verification/${encodeURIComponent(token)}`;
}

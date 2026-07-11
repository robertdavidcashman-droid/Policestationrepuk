import { NextResponse } from 'next/server';
import { sendStationUpdateNotification } from '@/lib/email';
import {
  getClientIp,
  messageLooksSpammy,
  rateLimitOk,
  validateContactTiming,
} from '@/lib/contact-guards';
import { saveSubmission } from '@/lib/submissions';
import { savePendingStationUpdate } from '@/lib/station-overrides';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      stationId,
      stationName,
      currentAddress,
      currentPostcode,
      currentPhone,
      currentCustodyPhone,
      currentNonEmergencyPhone,
      newAddress,
      newPostcode,
      newPhone,
      newCustodyPhone,
      newNonEmergencyPhone,
      notes,
      submitterName,
      submitterEmail,
      _hp,
      _startedAt,
    } = body;

    if (JSON.stringify(body).length > 25000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 400 });
    }

    if (_hp) {
      return NextResponse.json({ ok: true, id: 'noop' });
    }

    const timing = validateContactTiming(_startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: timing.status });
    }

    const ip = getClientIp(request);
    if (ip !== 'unknown') {
      const limited = await rateLimitOk({ ip, scope: 'station-update' });
      if (!limited.ok) {
        return NextResponse.json(
          { error: 'Too many submissions recently. Please wait a few minutes and try again.' },
          { status: 429 },
        );
      }
    }

    if (!stationId || !stationName || !submitterName || !submitterEmail) {
      return NextResponse.json(
        { error: 'Please select a station and provide your name and email.' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const hasUpdate =
      newAddress?.trim() ||
      newPostcode?.trim() ||
      newPhone?.trim() ||
      newCustodyPhone?.trim() ||
      newNonEmergencyPhone?.trim();

    if (!hasUpdate) {
      return NextResponse.json(
        { error: 'Please provide at least one updated field (address, postcode, or phone number).' },
        { status: 400 },
      );
    }

    if (
      (submitterName && submitterName.length > 200) ||
      (submitterEmail && submitterEmail.length > 320) ||
      (notes && notes.length > 5000) ||
      (newAddress && newAddress.length > 500) ||
      (newPostcode && newPostcode.length > 20) ||
      (newPhone && newPhone.length > 30) ||
      (newCustodyPhone && newCustodyPhone.length > 30) ||
      (newNonEmergencyPhone && newNonEmergencyPhone.length > 30)
    ) {
      return NextResponse.json({ error: 'Field exceeds maximum length.' }, { status: 400 });
    }

    if (notes && messageLooksSpammy(String(notes))) {
      return NextResponse.json(
        { error: 'Your notes could not be processed. Please remove excessive links and try again.' },
        { status: 400 },
      );
    }

    const payload = {
      stationId,
      stationName,
      current: {
        address: currentAddress,
        postcode: currentPostcode,
        phone: currentPhone,
        custodyPhone: currentCustodyPhone,
        nonEmergencyPhone: currentNonEmergencyPhone,
      },
      suggested: {
        address: newAddress?.trim() || undefined,
        postcode: newPostcode?.trim() || undefined,
        phone: newPhone?.trim() || undefined,
        custodyPhone: newCustodyPhone?.trim() || undefined,
        nonEmergencyPhone: newNonEmergencyPhone?.trim() || undefined,
      },
      notes: notes?.trim() || undefined,
      submitterName,
      submitterEmail,
    };

    const [submissionId] = await Promise.all([
      saveSubmission('station-update', payload),
      sendStationUpdateNotification(payload),
    ]);

    // Mirror to the KV pending queue so an admin can one-click approve and
    // publish the correction without a redeploy.
    await savePendingStationUpdate({
      id: submissionId,
      stationId: String(stationId),
      stationName: String(stationName),
      fields: {
        address: payload.suggested.address,
        postcode: payload.suggested.postcode,
        phone: payload.suggested.phone,
        custodyPhone: payload.suggested.custodyPhone,
        nonEmergencyPhone: payload.suggested.nonEmergencyPhone,
      },
      notes: payload.notes,
      submitterName: payload.submitterName,
      submitterEmail: payload.submitterEmail,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      id: submissionId,
      message: 'Thank you — your suggestion has been received and will be reviewed.',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

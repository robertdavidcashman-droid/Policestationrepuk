import { NextResponse } from 'next/server';
import {
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_DISCOUNT_PCT,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_DAYS,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';

export const dynamic = 'force-dynamic';

/** Public promo config for cross-site widgets (Custody Note offer surfaced on repuk). */
export async function GET() {
  return NextResponse.json({
    custodynote: {
      discountCode: CUSTODYNOTE_DISCOUNT_CODE,
      discountPct: CUSTODYNOTE_DISCOUNT_PCT,
      priceGbp: CUSTODYNOTE_PRICE_GBP,
      memberPriceGbp: CUSTODYNOTE_MEMBER_PRICE_GBP,
      trialDays: CUSTODYNOTE_TRIAL_DAYS,
      trialHref: CUSTODYNOTE_TRIAL_HREF,
    },
    updatedAt: new Date().toISOString(),
  });
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Secure Verification — PoliceStationRepUK',
  description:
    'Private secure verification form for applicants invited by the PoliceStationRepUK admin team. Not a public registration page.',
  robots: { index: false, follow: false, nocache: true },
};

export default function SecureVerificationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

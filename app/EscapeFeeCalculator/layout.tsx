import { buildMetadata } from '@/lib/seo';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';

export const metadata = buildMetadata({
  title: 'Escape Fee Calculator — Police Station Legal Aid Rates',
  description:
    'Calculate police station Legal Aid escape fees for accredited representatives. Compare national and London rates for own solicitor, duty solicitor, and representative attendance.',
  path: '/EscapeFeeCalculator',
});

export default function EscapeFeeCalcLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <CustodyNotePagePromo variant="compact" className="mb-0" />
      </div>
      {children}
    </>
  );
}

import { CustodyNoteInlineCTA } from '@/components/CustodyNoteInlineCTA';

type Variant = 'compact' | 'full';

/** Drop-in Custody Note promo block for content pages. */
export function CustodyNotePagePromo({
  variant = 'compact',
  className = 'my-8',
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <div className={className}>
      <CustodyNoteInlineCTA variant={variant} />
    </div>
  );
}

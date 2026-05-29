import { buildMetadata } from '@/lib/seo';
import { WhatsAppAudiencePage } from '@/components/WhatsAppAudiencePage';
import { WHATSAPP_AUDIENCE_PAGES } from '@/lib/whatsapp-audience';

const page = WHATSAPP_AUDIENCE_PAGES.reps;

export const metadata = buildMetadata({
  title: page.seoTitle,
  description: page.seoDescription,
  path: page.path,
});

export default function WhatsAppRepsPage() {
  return <WhatsAppAudiencePage audienceId="reps" />;
}

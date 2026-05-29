import { buildMetadata } from '@/lib/seo';
import { WhatsAppAudiencePage } from '@/components/WhatsAppAudiencePage';
import { WHATSAPP_AUDIENCE_PAGES } from '@/lib/whatsapp-audience';

const page = WHATSAPP_AUDIENCE_PAGES.solicitors;

export const metadata = buildMetadata({
  title: page.seoTitle,
  description: page.seoDescription,
  path: page.path,
});

export default function WhatsAppSolicitorsPage() {
  return <WhatsAppAudiencePage audienceId="solicitors" />;
}

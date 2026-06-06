import Link from 'next/link';
import { AssistantChat } from '@/components/AssistantChat';

export function HomeAIAssistant() {
  return (
    <section className="section-pad bg-[var(--navy)]" aria-label="Guided assistant">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-h2 mt-0 text-white">Need help? Use our guided assistant</h2>
          <p className="mt-3 text-white">
            Get instant answers from our published FAQs and guides — registration, the directory, station
            numbers, PSRAS career routes, and general police station practice topics on this site.
          </p>
          <p className="mt-4 text-xs text-slate-300">Site &amp; career guides only · Not legal advice · Free to use</p>
          <Link
            href="/guided-assistant"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--gold)] px-6 py-3 text-sm font-bold text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)]"
          >
            Ask the guided assistant
          </Link>
        </div>
      </div>
    </section>
  );
}

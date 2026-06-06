import Link from 'next/link';
import { AssistantChat } from '@/components/AssistantChat';

export function HomeAIAssistant() {
  return (
    <section className="section-pad bg-[var(--navy)]" aria-label="Guided assistant">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-h2 mt-0 text-white">Need help? Use our guided assistant</h2>
            <p className="mt-3 text-white">
              Get instant answers from our published FAQs and guides — registration, the directory, station
              numbers, PSRAS career routes, and general police station practice topics on this site.
            </p>
            <p className="mt-4 text-xs text-slate-300">
              Site &amp; career guides only · Not legal advice · Free to use
            </p>
          </div>

          <div className="mt-8 rounded-[var(--radius-lg)] border border-white/10 bg-white p-6 shadow-xl sm:p-8">
            <AssistantChat />
          </div>

          <p className="mt-4 text-center text-sm text-slate-300">
            <Link href="/guided-assistant" className="font-semibold text-[var(--gold)] hover:underline">
              Open full assistant page →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { OpenAiAssistantButton } from '@/components/assistant/OpenAiAssistantButton';

export function HomeAIAssistant() {
  return (
    <section className="section-pad bg-[var(--navy)]" aria-label="AI assistant">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 mt-0 text-white">Need help? Ask our AI assistant</h2>
          <p className="mt-3 text-white">
            Get instant answers about the directory, registration, station phone numbers, PSRAS
            career routes, and how this site works — powered by our published guides.
          </p>
          <p className="mt-4 text-xs text-slate-300">
            Site &amp; career guides only · Not legal advice · Free to use
          </p>

          <OpenAiAssistantButton className="btn-gold mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 px-8 py-3 text-sm font-bold no-underline">
            Open AI chat
          </OpenAiAssistantButton>

          <p className="mt-4 text-sm text-slate-300">
            Or use the{' '}
            <span className="font-semibold text-[var(--gold)]">Ask AI</span> bubble at the bottom
            right on any page.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            <Link href="/guided-assistant" className="font-semibold text-[var(--gold)] hover:underline">
              Open full AI assistant page →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

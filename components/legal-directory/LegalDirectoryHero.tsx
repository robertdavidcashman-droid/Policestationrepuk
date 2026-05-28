import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { BreadcrumbItem } from '@/components/Breadcrumbs';

export function LegalDirectoryHero({
  title,
  description,
  breadcrumbs,
  children,
}: {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-[var(--navy)] py-10 sm:py-14">
      <div className="page-container !py-0">
        <Breadcrumbs light items={breadcrumbs} />
        <h1 className="mt-3 text-h1 text-white">{title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-300">{description}</p>
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

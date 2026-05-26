import type { ReactNode } from "react";

type WorkspaceSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function WorkspaceSectionCard({
  title,
  description,
  children,
}: WorkspaceSectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-950">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}
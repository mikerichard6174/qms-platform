import Link from "next/link";

type WorkspacePageHeaderBreadcrumb = {
  label: string;
  href?: string;
};

type WorkspacePageHeaderAction = {
  label: string;
  href: string;
};

type WorkspacePageHeaderProps = {
  breadcrumbs: WorkspacePageHeaderBreadcrumb[];
  eyebrow: string;
  title: string;
  description: string;
  action?: WorkspacePageHeaderAction;
};

export function WorkspacePageHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  action,
}: WorkspacePageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-3 text-sm text-slate-500">
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span key={`${breadcrumb.label}-${index}`}>
                {breadcrumb.href && !isLast ? (
                  <Link href={breadcrumb.href} className="hover:text-slate-950">
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span>{breadcrumb.label}</span>
                )}

                {!isLast ? <span className="mx-2">›</span> : null}
              </span>
            );
          })}
        </div>

        <p className="text-sm font-medium text-slate-500">{eyebrow}</p>

        <h2 className="mt-1 text-3xl font-bold text-slate-950">{title}</h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      {action ? (
        <Link
          href={action.href}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}
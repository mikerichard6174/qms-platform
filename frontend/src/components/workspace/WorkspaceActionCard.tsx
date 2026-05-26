import Link from "next/link";

type WorkspaceActionCardProps = {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
};

export function WorkspaceActionCard({
  title,
  description,
  href,
  disabled = false,
}: WorkspaceActionCardProps) {
  const content = (
    <>
      <p className="font-semibold text-slate-950">{title}</p>

      <p className="mt-1 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </>
  );

  if (disabled || !href) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
    >
      {content}
    </Link>
  );
}
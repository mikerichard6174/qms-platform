import Link from "next/link";

type ProgramWorkspaceNavItem = {
  label: string;
  href: string;
  key: string;
  disabled?: boolean;
};

type ProgramWorkspaceNavProps = {
  programId: string;
  activeTab: "overview" | "standards" | "deliverables" | "documents" | "readiness";
};

function navClass(isActive: boolean, disabled?: boolean): string {
  if (disabled) {
    return "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-400";
  }

  if (isActive) {
    return "rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white";
  }

  return "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50";
}

export function ProgramWorkspaceNav({
  programId,
  activeTab,
}: ProgramWorkspaceNavProps) {
  const items: ProgramWorkspaceNavItem[] = [
    {
      label: "Overview",
      href: `/programs/${programId}`,
      key: "overview",
    },
    {
      label: "Standards",
      href: `/programs/${programId}/standards`,
      key: "standards",
    },
    {
      label: "Deliverables",
      href: `/programs/${programId}/cdrls`,
      key: "deliverables",
    },
    {
      label: "Documents",
      href: `/programs/${programId}/documents`,
      key: "documents",
      disabled: true,
    },
    {
      label: "Audit Readiness",
      href: `/programs/${programId}/readiness`,
      key: "readiness",
      disabled: true,
    },
  ];

  return (
    <nav className="mb-8 flex flex-wrap gap-3">
      {items.map((item) => {
        const isActive = activeTab === item.key;

        if (item.disabled) {
          return (
            <span key={item.key} className={navClass(isActive, true)}>
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            className={navClass(isActive)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ActiveNav =
  | "dashboard"
  | "programs"
  | "documents"
  | "audit-events"
  | "admin"
  | "standards"
  | "ncr-capa";

type AppShellProps = {
  children: ReactNode;
  activeNav?: ActiveNav;
};

type NavItem = {
  label: string;
  href: string;
  key: ActiveNav;
  disabled?: boolean;
};

function navClass(isActive: boolean, disabled?: boolean): string {
  if (disabled) {
    return "block rounded-xl px-4 py-3 text-sm font-medium text-slate-400";
  }

  if (isActive) {
    return "block rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white";
  }

  return "block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100";
}

function resolveActiveNav(
  pathname: string,
  explicitActiveNav?: ActiveNav,
): ActiveNav {
  if (explicitActiveNav) {
    return explicitActiveNav;
  }

  if (pathname.startsWith("/programs")) {
    return "programs";
  }

  if (pathname.startsWith("/documents")) {
    return "documents";
  }

  if (pathname.startsWith("/standards")) {
    return "standards";
  }

  if (pathname.startsWith("/audit-events")) {
    return "audit-events";
  }

  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  return "dashboard";
}

export function AppShell({ children, activeNav }: AppShellProps) {
  const pathname = usePathname();
  const resolvedActiveNav = resolveActiveNav(pathname, activeNav);

  const primaryNavItems: NavItem[] = [
    {
      label: "Control Center",
      href: "/",
      key: "dashboard",
    },
    {
      label: "Programs",
      href: "/programs",
      key: "programs",
    },
    {
      label: "Standards Library",
      href: "/standards",
      key: "standards",
    },
    {
      label: "Documents",
      href: "/documents",
      key: "documents",
    },
    {
      label: "NCR / CAPA",
      href: "/ncr-capa",
      key: "ncr-capa",
      disabled: true,
    },
    {
      label: "Audit Trail",
      href: "/audit-events",
      key: "audit-events",
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: "Admin Tools",
      href: "/admin",
      key: "admin",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-white p-6">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              QMS Platform
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Quality Control Hub
            </h1>
          </div>

          <nav className="space-y-8">
            <div>
              <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Workspace
              </p>

              <div className="space-y-2">
                {primaryNavItems.map((item) => {
                  const isActive = resolvedActiveNav === item.key;

                  if (item.disabled) {
                    return (
                      <span
                        key={item.key}
                        className={navClass(isActive, item.disabled)}
                      >
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
              </div>
            </div>

            <div>
              <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Administration
              </p>

              <div className="space-y-2">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={navClass(resolvedActiveNav === item.key)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        <section className="flex-1 p-8">{children}</section>
      </div>
    </main>
  );
}
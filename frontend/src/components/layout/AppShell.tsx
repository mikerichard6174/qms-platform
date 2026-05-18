"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ActiveNav =
  | "dashboard"
  | "programs"
  | "documents"
  | "revisions"
  | "approvals"
  | "audit-events"
  | "admin"
  | "admin-standards"
  | "standards"
  | "ncr-capa";

type AppShellProps = {
  children: ReactNode;
  activeNav?: ActiveNav;
};

function navClass(isActive: boolean): string {
  if (isActive) {
    return "block rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white";
  }

  return "block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100";
}

function disabledNavClass(): string {
  return "block rounded-lg px-4 py-3 text-sm font-medium text-slate-400";
}

function resolveActiveNav(
  pathname: string,
  explicitActiveNav?: ActiveNav,
): ActiveNav {
  if (explicitActiveNav) {
    return explicitActiveNav;
  }

  if (pathname.startsWith("/admin/standards")) {
    return "admin-standards";
  }

  if (pathname.startsWith("/admin")) {
    return "admin";
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

  return "dashboard";
}

export function AppShell({ children, activeNav }: AppShellProps) {
  const pathname = usePathname();

  const resolvedActiveNav = resolveActiveNav(pathname, activeNav);

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

          <nav className="space-y-2">
            <Link
              href="/"
              className={navClass(resolvedActiveNav === "dashboard")}
            >
              Control Center
            </Link>

            <Link
              href="/programs"
              className={navClass(resolvedActiveNav === "programs")}
            >
              Program Registry
            </Link>

            <Link
              href="/documents"
              className={navClass(resolvedActiveNav === "documents")}
            >
              Document Register
            </Link>

            <Link
              href="/standards"
              className={navClass(resolvedActiveNav === "standards")}
            >
              Standards Library
            </Link>

            <Link
              href="/admin"
              className={navClass(resolvedActiveNav === "admin")}
            >
              Admin Tools
            </Link>

            <Link
              href="/admin/standards"
              className={navClass(resolvedActiveNav === "admin-standards")}
            >
              Standards Admin
            </Link>

            <a className={disabledNavClass()}>Revisions</a>
            <a className={disabledNavClass()}>Approvals</a>

            <Link
              href="/audit-events"
              className={navClass(resolvedActiveNav === "audit-events")}
            >
              Audit Trail
            </Link>

            <a className={disabledNavClass()}>NCR / CAPA</a>
          </nav>
        </aside>

        <section className="flex-1 p-8">{children}</section>
      </div>
    </main>
  );
}
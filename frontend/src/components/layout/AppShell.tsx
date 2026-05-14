"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  activeNav?:
    | "dashboard"
    | "documents"
    | "revisions"
    | "approvals"
    | "audit-events"
    | "standards"
    | "ncr-capa";
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

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === "/";
  const isDocumentsActive = pathname.startsWith("/documents");
  const isAuditEventsActive = pathname.startsWith("/audit-events");

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
            <Link href="/" className={navClass(isDashboardActive)}>
              Control Center
            </Link>

            <Link
              href="/documents"
              className={navClass(isDocumentsActive)}
            >
              Document Register
            </Link>

            <a className={disabledNavClass()}>Revisions</a>
            <a className={disabledNavClass()}>Approvals</a>

            <Link
              href="/audit-events"
              className={navClass(isAuditEventsActive)}
            >
              Audit Trail
            </Link>

            <a className={disabledNavClass()}>Standards</a>
            <a className={disabledNavClass()}>NCR / CAPA</a>
          </nav>
        </aside>

        <section className="flex-1 p-8">{children}</section>
      </div>
    </main>
  );
}
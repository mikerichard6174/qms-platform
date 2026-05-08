"use client";

import Link from "next/link";

import type { DocumentRecord } from "@/types/document";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type DocumentQuickActionsProps = {
  document: DocumentRecord;
  currentRevision: DocumentRevisionRecord | null;
  effectiveRevision: DocumentRevisionRecord | null;
  pendingApprovalCount: number;
};

export function DocumentQuickActions({
  document,
  currentRevision,
  effectiveRevision,
  pendingApprovalCount,
}: DocumentQuickActionsProps) {
  return (
    <aside className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">Document Control</p>

        <h3 className="mt-1 text-xl font-bold text-slate-950">
          Quick Actions
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Common actions and control checks for this document.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <a
          href="#create-revision"
          className="block rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create new revision
        </a>

        <a
          href="#revision-timeline"
          className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Review revision timeline
        </a>

        <a
          href="#document-audit-trail"
          className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View audit trail
        </a>

        {effectiveRevision?.external_file_url ? (
          <a
            href={effectiveRevision.external_file_url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open effective source file
          </a>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No effective source file is linked.
          </div>
        )}

        <Link
          href="/audit-events"
          className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Open global audit trail
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Control Snapshot
        </p>

        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>
            Status:{" "}
            <span className="font-semibold text-slate-950">
              {document.status}
            </span>
          </p>

          <p>
            Current Revision:{" "}
            <span className="font-semibold text-slate-950">
              {currentRevision?.revision_label ?? "None"}
            </span>
          </p>

          <p>
            Effective Revision:{" "}
            <span className="font-semibold text-slate-950">
              {effectiveRevision?.revision_label ?? "None"}
            </span>
          </p>

          <p>
            Pending Approvals:{" "}
            <span className="font-semibold text-slate-950">
              {pendingApprovalCount}
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
import type { AuditEventRecord } from "@/types/auditEvent";
import type { DocumentRecord } from "@/types/document";
import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type AuditEvidenceSummaryProps = {
  document: DocumentRecord;
  revisions: DocumentRevisionRecord[];
  approvalsByRevision: Record<string, DocumentApprovalRecord[]>;
  auditEvents: AuditEventRecord[];
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

function getApprovalTotals(
  approvalsByRevision: Record<string, DocumentApprovalRecord[]>,
) {
  const approvals = Object.values(approvalsByRevision).flat();

  return {
    total: approvals.length,
    approved: approvals.filter((approval) => approval.status === "approved")
      .length,
    pending: approvals.filter((approval) => approval.status === "pending")
      .length,
    rejected: approvals.filter((approval) => approval.status === "rejected")
      .length,
  };
}

function getPendingReviewRevisions(
  revisions: DocumentRevisionRecord[],
  approvalsByRevision: Record<string, DocumentApprovalRecord[]>,
): DocumentRevisionRecord[] {
  return revisions.filter((revision) => {
    const approvals = approvalsByRevision[revision.id] ?? [];
    const hasPendingApproval = approvals.some(
      (approval) => approval.status === "pending",
    );

    return revision.status === "in_review" || hasPendingApproval;
  });
}

export function AuditEvidenceSummary({
  document,
  revisions,
  approvalsByRevision,
  auditEvents,
}: AuditEvidenceSummaryProps) {
  const approvalTotals = getApprovalTotals(approvalsByRevision);
  const pendingReviewRevisions = getPendingReviewRevisions(
    revisions,
    approvalsByRevision,
  );

  const effectiveRevision =
    revisions.find((revision) => revision.is_effective) ?? null;

  const currentRevision =
    revisions.find((revision) => revision.is_current) ?? null;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Audit Evidence Summary
          </p>

          <h3 className="mt-1 text-2xl font-bold text-slate-950">
            {document.document_number}
          </h3>

          <p className="mt-2 text-sm text-slate-600">{document.title}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Document Status
          </p>

          <p className="mt-1 text-lg font-bold text-slate-950">
            {document.status}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Revision
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {currentRevision?.revision_label ?? "None"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Effective Revision
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {effectiveRevision?.revision_label ?? "None"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Revisions
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {revisions.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Audit Events
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {auditEvents.length}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <h4 className="text-lg font-bold text-slate-950">
            Approval Overview
          </h4>

          <div className="mt-4 grid grid-cols-4 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-950">
                {approvalTotals.total}
              </p>

              <p className="mt-1 text-xs text-slate-500">Total</p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-2xl font-bold text-emerald-700">
                {approvalTotals.approved}
              </p>

              <p className="mt-1 text-xs text-emerald-700">Approved</p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-2xl font-bold text-blue-700">
                {approvalTotals.pending}
              </p>

              <p className="mt-1 text-xs text-blue-700">Pending</p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-2xl font-bold text-red-700">
                {approvalTotals.rejected}
              </p>

              <p className="mt-1 text-xs text-red-700">Rejected</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              Pending Review Navigation
            </p>

            {pendingReviewRevisions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No revisions are currently waiting for approval.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {pendingReviewRevisions.map((revision) => {
                  const approvals = approvalsByRevision[revision.id] ?? [];
                  const pendingForRevision = approvals.filter(
                    (approval) => approval.status === "pending",
                  ).length;

                  return (
                    <a
                      key={revision.id}
                      href={`#revision-${revision.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <span className="font-semibold text-slate-950">
                        Revision {revision.revision_label}
                      </span>

                      <span className="ml-2 text-slate-500">
                        {revision.status}
                      </span>

                      <p className="mt-1 text-xs text-slate-500">
                        Pending approvals: {pendingForRevision}
                      </p>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h4 className="text-lg font-bold text-slate-950">
            Control Information
          </h4>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <span>Document Type</span>
              <span className="font-semibold text-slate-950">
                {document.document_type}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Controlled</span>
              <span className="font-semibold text-slate-950">
                {document.is_controlled ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Review Due</span>
              <span className="font-semibold text-slate-950">
                {formatDate(document.review_due_date)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Created</span>
              <span className="font-semibold text-slate-950">
                {formatDateTime(document.created_at)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Updated</span>
              <span className="font-semibold text-slate-950">
                {formatDateTime(document.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-950">
            Revision Evidence
          </h4>

          <p className="text-sm text-slate-500">
            Latest revision activity summary
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Revision</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Effective</th>
                <th className="px-4 py-3 font-semibold">Approvals</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {revisions.map((revision) => {
                const approvals = approvalsByRevision[revision.id] ?? [];

                return (
                  <tr key={revision.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      <a
                        href={`#revision-${revision.id}`}
                        className="hover:underline"
                      >
                        {revision.revision_label}
                      </a>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {revision.status}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {revision.is_effective ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {approvals.length}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {formatDateTime(revision.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
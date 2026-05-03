import Link from "next/link";
import { notFound } from "next/navigation";

import { AuditEventTimeline } from "@/components/documents/AuditEventTimeline";
import { CreateApprovalForm } from "@/components/documents/CreateApprovalForm";
import { CreateRevisionForm } from "@/components/documents/CreateRevisionForm";
import { DocumentWorkflowActions } from "@/components/documents/DocumentWorkflowActions";
import { AppShell } from "@/components/layout/AppShell";
import {
  getAuditEventsForEntity,
  getAuditEventsForTenant,
  getDocument,
  getDocumentApprovals,
  getDocumentRevisions,
} from "@/lib/api";
import type { AuditEventRecord } from "@/types/auditEvent";
import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

const DEFAULT_APPROVER_USER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_APPROVER_USER_ID ?? "";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {status}
    </span>
  );
}

function ExternalFileLink({ url }: { url: string | null }) {
  if (!url) {
    return (
      <span className="text-sm text-slate-500">
        No external document link provided.
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
    >
      View External Document
    </a>
  );
}

async function getApprovalsByRevision(
  revisions: DocumentRevisionRecord[],
): Promise<Record<string, DocumentApprovalRecord[]>> {
  const approvalEntries = await Promise.all(
    revisions.map(async (revision) => {
      try {
        const approvals = await getDocumentApprovals(revision.id);
        return [revision.id, approvals.items] as const;
      } catch (error) {
        console.error(
          `Failed to fetch approvals for revision ${revision.id}:`,
          error,
        );
        return [revision.id, []] as const;
      }
    }),
  );

  return Object.fromEntries(approvalEntries);
}

async function getDocumentRelatedAuditEvents(
  documentId: string,
  tenantId: string,
  revisions: DocumentRevisionRecord[],
  approvalsByRevision: Record<string, DocumentApprovalRecord[]>,
): Promise<AuditEventRecord[]> {
  try {
    const tenantAuditResponse = await getAuditEventsForTenant(tenantId);

    const revisionIds = new Set(revisions.map((revision) => revision.id));
    const approvalIds = new Set(
      Object.values(approvalsByRevision)
        .flat()
        .map((approval) => approval.id),
    );

    return tenantAuditResponse.items.filter((event) => {
      if (event.entity_type === "document" && event.entity_id === documentId) {
        return true;
      }

      if (
        event.entity_type === "document_revision" &&
        revisionIds.has(event.entity_id)
      ) {
        return true;
      }

      if (
        event.entity_type === "document_approval" &&
        approvalIds.has(event.entity_id)
      ) {
        return true;
      }

      const metadataDocumentId = event.metadata_json?.document_id;

      if (typeof metadataDocumentId === "string" && metadataDocumentId === documentId) {
        return true;
      }

      return false;
    });
  } catch (error) {
    console.error("Failed to fetch related document audit events:", error);

    try {
      const documentAuditResponse = await getAuditEventsForEntity(
        "document",
        documentId,
      );
      return documentAuditResponse.items;
    } catch (fallbackError) {
      console.error("Document audit fallback failed:", fallbackError);
      return [];
    }
  }
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;

  let document;
  let revisions: DocumentRevisionRecord[] = [];
  let approvalsByRevision: Record<string, DocumentApprovalRecord[]> = {};
  let auditEvents: AuditEventRecord[] = [];

  try {
    document = await getDocument(id);
    const revisionResponse = await getDocumentRevisions(id);
    revisions = revisionResponse.items;
    approvalsByRevision = await getApprovalsByRevision(revisions);
    auditEvents = await getDocumentRelatedAuditEvents(
      document.id,
      document.tenant_id,
      revisions,
      approvalsByRevision,
    );
  } catch (error) {
    console.error("Document detail fetch failed:", error);
    notFound();
  }

  return (
    <AppShell activeNav="documents">
      <div className="mb-6">
        <Link
          href="/documents"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Back to documents
        </Link>
      </div>

      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {document.document_number}
          </p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            {document.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Type: {document.document_type}
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Document Status: {document.status}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Controlled Document
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {document.is_controlled ? "Yes" : "No"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Current Revision
          </p>
          <p className="mt-3 text-sm font-bold text-slate-950">
            {document.current_revision_id ?? "None assigned"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Review Due Date
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {formatDate(document.review_due_date)}
          </p>
        </div>
      </div>

      <CreateRevisionForm documentId={document.id} tenantId={document.tenant_id} />

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-950">
            Revision History
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Revisions are listed newest first and include approval records, workflow actions, and external document links.
          </p>
        </div>

        <div className="space-y-4">
          {revisions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-500">
              No revisions found for this document.
            </div>
          ) : (
            revisions.map((revision) => {
              const approvals = approvalsByRevision[revision.id] ?? [];

              return (
                <div
                  key={revision.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-bold text-slate-950">
                          Revision {revision.revision_label}
                        </h4>
                        <StatusBadge status={revision.status} />
                        {revision.is_effective ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            Effective
                          </span>
                        ) : null}
                        {revision.is_current ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            Current
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {revision.change_summary ?? "No change summary provided."}
                      </p>

                      <div className="mt-4">
                        <ExternalFileLink url={revision.external_file_url} />
                      </div>
                    </div>

                    <div className="text-right text-sm text-slate-500">
                      <p>Created: {formatDateTime(revision.created_at)}</p>
                      <p>
                        Submitted:{" "}
                        {formatDateTime(revision.submitted_for_approval_at)}
                      </p>
                      <p>Approved: {formatDateTime(revision.approved_at)}</p>
                      <p>Effective: {formatDate(revision.effective_date)}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <h5 className="text-sm font-semibold text-slate-950">
                      Approvals
                    </h5>

                    {approvals.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        No approvals assigned to this revision.
                      </p>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-white text-slate-600">
                            <tr>
                              <th className="px-3 py-2 font-semibold">
                                Approver
                              </th>
                              <th className="px-3 py-2 font-semibold">Type</th>
                              <th className="px-3 py-2 font-semibold">
                                Status
                              </th>
                              <th className="px-3 py-2 font-semibold">
                                Acted At
                              </th>
                              <th className="px-3 py-2 font-semibold">
                                Comment
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {approvals.map((approval) => (
                              <tr key={approval.id}>
                                <td className="px-3 py-2 text-slate-700">
                                  {approval.approver_user_id}
                                </td>
                                <td className="px-3 py-2 text-slate-700">
                                  {approval.approval_type}
                                </td>
                                <td className="px-3 py-2">
                                  <StatusBadge status={approval.status} />
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {formatDateTime(approval.acted_at)}
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {approval.comment ?? "No comment"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <CreateApprovalForm
                      revisionId={revision.id}
                      tenantId={revision.tenant_id}
                      defaultApproverUserId={DEFAULT_APPROVER_USER_ID}
                    />
                  </div>

                  <DocumentWorkflowActions revision={revision} approvals={approvals} />
                </div>
              );
            })
          )}
        </div>
      </section>

      <AuditEventTimeline
        title="Document Audit Trail"
        description="This timeline shows audit events tied to this document, its revisions, and its approval records."
        events={auditEvents}
      />
    </AppShell>
  );
}
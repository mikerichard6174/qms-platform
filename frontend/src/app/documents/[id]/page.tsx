"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuditEvidenceSummary } from "@/components/documents/AuditEvidenceSummary";
import { ApprovalStatusBadge } from "@/components/documents/ApprovalStatusBadge";
import { ApprovalReadinessIndicator } from "@/components/documents/ApprovalReadinessIndicator";
import { AuditEventTimeline } from "@/components/documents/AuditEventTimeline";
import { CreateApprovalForm } from "@/components/documents/CreateApprovalForm";
import { CreateRevisionForm } from "@/components/documents/CreateRevisionForm";
import { DocumentQuickActions } from "@/components/documents/DocumentQuickActions";
import { DocumentWorkflowActions } from "@/components/documents/DocumentWorkflowActions";
import { ReviewerActionPanel } from "@/components/documents/ReviewerActionPanel";
import { RevisionWorkflowGuidance } from "@/components/documents/RevisionWorkflowGuidance";
import { AppShell } from "@/components/layout/AppShell";
import {
  getAuditEventsForEntity,
  getAuditEventsForTenant,
  getDocument,
  getDocumentApprovals,
  getDocumentRevisions,
} from "@/lib/api";
import type { AuditEventRecord } from "@/types/auditEvent";
import type { DocumentRecord } from "@/types/document";
import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

const DEFAULT_APPROVER_USER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_APPROVER_USER_ID ?? "";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SessionDisplay = {
  tenantName: string;
  userName: string;
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

function BooleanBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      Controlled
    </span>
  ) : (
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      Uncontrolled
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
      Open Source Document
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

      if (
        typeof metadataDocumentId === "string" &&
        metadataDocumentId === documentId
      ) {
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

export default function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [revisions, setRevisions] = useState<DocumentRevisionRecord[]>([]);
  const [approvalsByRevision, setApprovalsByRevision] = useState<
    Record<string, DocumentApprovalRecord[]>
  >({});
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [sessionDisplay, setSessionDisplay] = useState<SessionDisplay>({
    tenantName: "Unknown tenant",
    userName: "Unknown user",
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentRevision = document?.current_revision_id
    ? revisions.find(
        (revision) => revision.id === document.current_revision_id,
      ) ?? null
    : null;

  const effectiveRevision =
    revisions.find((revision) => revision.is_effective) ?? null;

  const pendingApprovalCount = Object.values(approvalsByRevision)
    .flat()
    .filter((approval) => approval.status === "pending").length;

  const loadDocumentWorkspace = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const documentRecord = await getDocument(resolvedParams.id);

      const revisionResponse = await getDocumentRevisions(resolvedParams.id);

      const revisionRecords = revisionResponse.items;

      const approvalRecordsByRevision =
        await getApprovalsByRevision(revisionRecords);

      const relatedAuditEvents = await getDocumentRelatedAuditEvents(
        documentRecord.id,
        documentRecord.tenant_id,
        revisionRecords,
        approvalRecordsByRevision,
      );

      setSessionDisplay({
        tenantName: sessionStorage.getItem("tenant_name") ?? tenant,
        userName: sessionStorage.getItem("user_name") ?? user,
      });

      setDocument(documentRecord);
      setRevisions(revisionRecords);
      setApprovalsByRevision(approvalRecordsByRevision);
      setAuditEvents(relatedAuditEvents);
    } catch (error) {
      console.error("Document detail fetch failed:", error);
      router.replace("/documents");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id, router]);

  function handleLogout() {
    sessionStorage.clear();
    router.push("/login");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDocumentWorkspace(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDocumentWorkspace]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading document workspace...
      </main>
    );
  }

  if (!document) {
    return (
      <AppShell activeNav="documents">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Document could not be loaded.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="documents">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Document Workspace
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            {document.document_number}
          </h2>

          <p className="mt-2 text-sm text-slate-500">{document.title}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            User: {sessionDisplay.userName} | Tenant:{" "}
            {sessionDisplay.tenantName}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mb-6">
        <Link
          href="/documents"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Back to documents
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={document.status} />
                  <BooleanBadge value={document.is_controlled} />
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-950">
                      Document Type:
                    </span>{" "}
                    {document.document_type}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-950">
                      Review Due:
                    </span>{" "}
                    {formatDate(document.review_due_date)}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-950">
                      Created:
                    </span>{" "}
                    {formatDateTime(document.created_at)}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-950">
                      Last Updated:
                    </span>{" "}
                    {formatDateTime(document.updated_at)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:min-w-80">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Revision
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {currentRevision?.revision_label ?? "None"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Effective Revision
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {effectiveRevision?.revision_label ?? "None"}
                  </p>

                  <div className="mt-4">
                    <ExternalFileLink
                      url={effectiveRevision?.external_file_url ?? null}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <ReviewerActionPanel
            revisions={revisions}
            approvalsByRevision={approvalsByRevision}
          />

          <section className="mt-8 grid gap-6 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Current Revision
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-950">
                {currentRevision?.revision_label ?? "None"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Effective Revision
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-950">
                {effectiveRevision?.revision_label ?? "None"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Revisions
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-950">
                {revisions.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Pending Approvals
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-950">
                {pendingApprovalCount}
              </p>
            </div>
          </section>

          <AuditEvidenceSummary
            document={document}
            revisions={revisions}
            approvalsByRevision={approvalsByRevision}
            auditEvents={auditEvents}
          />

          <div id="create-revision">
            <CreateRevisionForm
              documentId={document.id}
              tenantId={document.tenant_id}
              onChanged={loadDocumentWorkspace}
            />
          </div>
        </div>

        <div>
          <DocumentQuickActions
            document={document}
            currentRevision={currentRevision}
            effectiveRevision={effectiveRevision}
            pendingApprovalCount={pendingApprovalCount}
          />
        </div>
      </div>

      <section
        id="revision-timeline"
        className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Revision Timeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Controlled revisions associated with this document.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            Total revisions: {revisions.length}
          </div>
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
                <article
                  id={`revision-${revision.id}`}
                  key={revision.id}
                  className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-bold text-slate-950">
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

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {revision.change_summary ??
                          "No change summary provided."}
                      </p>
                    </div>

                    <div className="grid min-w-56 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Created</span>

                        <span className="font-medium text-slate-950">
                          {formatDateTime(revision.created_at)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Submitted</span>

                        <span className="font-medium text-slate-950">
                          {formatDateTime(
                            revision.submitted_for_approval_at,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Approved</span>

                        <span className="font-medium text-slate-950">
                          {formatDateTime(revision.approved_at)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Effective</span>

                        <span className="font-medium text-slate-950">
                          {formatDate(revision.effective_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <RevisionWorkflowGuidance revision={revision} approvals={approvals} />

                  <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-950">
                      View approval records
                    </summary>

                    {approvals.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        No approvals assigned to this revision.
                      </p>
                    ) : (
                      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-white text-slate-600">
                            <tr>
                              <th className="px-3 py-2 font-semibold">
                                Approver
                              </th>

                              <th className="px-3 py-2 font-semibold">
                                Type
                              </th>

                              <th className="px-3 py-2 font-semibold">
                                Status
                              </th>

                              <th className="px-3 py-2 font-semibold">
                                Readiness
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
                                  <ApprovalStatusBadge status={approval.status} />
                                </td>

                                <td className="px-3 py-2">
                                  <ApprovalReadinessIndicator
                                    revision={revision}
                                    approval={approval}
                                  />
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
                      revisionStatus={revision.status}
                      existingApprovalCount={approvals.length}
                      defaultApproverUserId={DEFAULT_APPROVER_USER_ID}
                      onChanged={loadDocumentWorkspace}
                    />
                  </details>

                  <DocumentWorkflowActions
                    revision={revision}
                    approvals={approvals}
                    onChanged={loadDocumentWorkspace}
                  />
                </article>
              );
            })
          )}
        </div>
      </section>

      <div id="document-audit-trail">
        <AuditEventTimeline
          title="Document Audit Trail"
          description="Audit history for this document, its revisions, and approval workflow."
          events={auditEvents}
        />
      </div>
    </AppShell>
  );
}
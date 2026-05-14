"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import {
  getDashboardSummary,
  getDocumentApprovals,
  getDocumentRevisions,
  getDocuments,
} from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";
import type { DocumentRecord } from "@/types/document";
import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type SessionDisplay = {
  tenantName: string;
  userName: string;
};

type MyReviewAction = {
  document: DocumentRecord;
  revision: DocumentRevisionRecord;
  approval: DocumentApprovalRecord;
};

async function getMyReviewActions(
  documents: DocumentRecord[],
  userId: string,
): Promise<MyReviewAction[]> {
  const actionGroups = await Promise.all(
    documents.map(async (document) => {
      try {
        const revisionResponse = await getDocumentRevisions(document.id);

        const approvalGroups = await Promise.all(
          revisionResponse.items.map(async (revision) => {
            try {
              const approvalResponse = await getDocumentApprovals(revision.id);

              return approvalResponse.items
                .filter(
                  (approval) =>
                    approval.status === "pending" &&
                    approval.approver_user_id === userId &&
                    revision.status === "in_review",
                )
                .map((approval) => ({
                  document,
                  revision,
                  approval,
                }));
            } catch (error) {
              console.error(
                `Failed to load approvals for revision ${revision.id}:`,
                error,
              );

              return [];
            }
          }),
        );

        return approvalGroups.flat();
      } catch (error) {
        console.error(
          `Failed to load revisions for document ${document.id}:`,
          error,
        );

        return [];
      }
    }),
  );

  return actionGroups.flat();
}

function isOverdue(dateValue: string | null): boolean {
  if (!dateValue) {
    return false;
  }

  const today = new Date();
  const reviewDate = new Date(dateValue);

  today.setHours(0, 0, 0, 0);
  reviewDate.setHours(0, 0, 0, 0);

  return reviewDate < today;
}

function isDueSoon(dateValue: string | null): boolean {
  if (!dateValue) {
    return false;
  }

  const today = new Date();
  const reviewDate = new Date(dateValue);

  today.setHours(0, 0, 0, 0);
  reviewDate.setHours(0, 0, 0, 0);

  const threshold = new Date(today);
  threshold.setDate(today.getDate() + 30);

  return reviewDate >= today && reviewDate <= threshold;
}

export default function Home() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [myReviewActions, setMyReviewActions] = useState<MyReviewAction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    total_documents: 0,
    revisions_in_review: 0,
    effective_revisions: 0,
    pending_approvals: 0,
  });
  const [backendStatus, setBackendStatus] = useState("Connecting");
  const [backendStatusClass, setBackendStatusClass] = useState(
    "border-slate-200 bg-white text-slate-700",
  );
  const [sessionDisplay, setSessionDisplay] = useState<SessionDisplay>({
    tenantName: "Unknown tenant",
    userName: "Unknown user",
  });
  const [isLoading, setIsLoading] = useState(true);

  const overdueDocuments = useMemo(() => {
    return documents.filter((document) =>
      isOverdue(document.review_due_date),
    );
  }, [documents]);

  const dueSoonDocuments = useMemo(() => {
    return documents.filter((document) =>
      isDueSoon(document.review_due_date),
    );
  }, [documents]);

  const loadDashboard = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const [documentResponse, dashboardSummary] = await Promise.all([
        getDocuments(),
        getDashboardSummary(),
      ]);

      const reviewActions = await getMyReviewActions(
        documentResponse.items,
        user,
      );

      setSessionDisplay({
        tenantName: sessionStorage.getItem("tenant_name") ?? tenant,
        userName: sessionStorage.getItem("user_name") ?? user,
      });

      setDocuments(documentResponse.items);
      setMyReviewActions(reviewActions);
      setSummary(dashboardSummary);

      setBackendStatus("Connected");
      setBackendStatusClass(
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      );
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      router.replace("/login");
      return;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  function handleLogout() {
    sessionStorage.clear();
    localStorage.clear();
    router.push("/login");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading session...
      </main>
    );
  }

  return (
    <AppShell activeNav="dashboard">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Document Control MVP
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            Document Register
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            User: {sessionDisplay.userName} | Tenant:{" "}
            {sessionDisplay.tenantName}
          </div>

          <div
            className={`rounded-full border px-4 py-2 text-sm font-medium ${backendStatusClass}`}
          >
            Backend: {backendStatus}
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

      <div className="grid gap-6 md:grid-cols-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Document Register
          </p>

          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.total_documents}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Revisions in Review
          </p>

          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.revisions_in_review}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Effective Revisions
          </p>

          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.effective_revisions}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            My Review Actions
          </p>

          <p className="mt-3 text-4xl font-bold text-slate-950">
            {myReviewActions.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Reviews Due Soon
          </p>

          <p className="mt-3 text-4xl font-bold text-amber-900">
            {dueSoonDocuments.length}
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Reviews due within 30 days.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            Overdue Reviews
          </p>

          <p className="mt-3 text-4xl font-bold text-red-900">
            {overdueDocuments.length}
          </p>

          <p className="mt-2 text-sm text-red-800">
            Controlled documents past review date.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Reviewer Workflow
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-950">
              My Review Actions
            </h3>

            <p className="mt-1 text-sm text-blue-800">
              These revisions are currently in review and waiting on your
              approval decision.
            </p>
          </div>

          <div className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700">
            Open actions: {myReviewActions.length}
          </div>
        </div>

        {myReviewActions.length === 0 ? (
          <div className="rounded-xl border border-blue-200 bg-white p-4 text-sm text-slate-600">
            No review actions are currently assigned to you.
          </div>
        ) : (
          <div className="grid gap-4">
            {myReviewActions.map((action) => (
              <Link
                key={action.approval.id}
                href={`/documents/${action.document.id}#revision-${action.revision.id}`}
                className="block rounded-xl border border-blue-200 bg-white p-4 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {action.document.document_number}
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {action.document.title}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Revision {action.revision.revision_label}:{" "}
                      {action.revision.change_summary ??
                        "No change summary provided."}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                    Action Required
                  </span>
                </div>

                <p className="mt-4 text-xs font-medium text-blue-700">
                  Open document workflow →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Recent Controlled Documents
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Live document data pulled from your FastAPI backend.
            </p>
          </div>

          <Link
            href="/documents"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            View all documents
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Document #</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Review Due</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.slice(0, 5).map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      <Link
                        href={`/documents/${document.id}`}
                        className="hover:underline"
                      >
                        {document.document_number}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {document.title}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {document.document_type}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {document.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {document.review_due_date
                        ? new Date(
                            document.review_due_date,
                          ).toLocaleDateString()
                        : "Not set"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
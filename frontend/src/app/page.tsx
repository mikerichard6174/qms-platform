"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getDashboardSummary, getDocuments } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";
import type { DocumentRecord } from "@/types/document";

type SessionDisplay = {
  tenantName: string;
  userName: string;
};

export default function Home() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
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

  function handleLogout() {
    sessionStorage.removeItem("tenant_id");
    sessionStorage.removeItem("user_id");
    sessionStorage.removeItem("tenant_name");
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("user_roles");

    localStorage.removeItem("tenant_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("tenant_name");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_roles");

    router.push("/login");
  }

  useEffect(() => {
    async function loadDashboard() {
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

        setSessionDisplay({
          tenantName: sessionStorage.getItem("tenant_name") ?? tenant,
          userName: sessionStorage.getItem("user_name") ?? user,
        });
        setDocuments(documentResponse.items);
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
    }

    loadDashboard();
  }, [router]);

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
            QMS Control Center
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

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Controlled Documents
          </p>
          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.total_documents}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Documents tracked in the QMS.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Revisions in Review
          </p>
          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.revisions_in_review}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Revisions waiting on approval.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Effective Revisions
          </p>
          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.effective_revisions}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Active controlled revisions.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Pending Approvals
          </p>
          <p className="mt-3 text-4xl font-bold text-slate-950">
            {summary.pending_approvals}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Approval actions still open.
          </p>
        </div>
      </div>

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
                <th className="px-4 py-3 font-semibold">Current Revision</th>
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
                    <td className="px-4 py-3 text-slate-500">
                      {document.current_revision_id ? "Assigned" : "None"}
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
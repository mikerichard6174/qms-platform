"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceActionCard } from "@/components/workspace/WorkspaceActionCard";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import { WorkspaceStatusBadge } from "@/components/workspace/WorkspaceStatusBadge";
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
    tenantName: "Unknown organization",
    userName: "Unknown user",
  });
  const [isLoading, setIsLoading] = useState(true);

  const recentDocuments = useMemo(() => {
    return documents.slice(0, 5);
  }, [documents]);

  const controlledDocumentCount = useMemo(() => {
    return documents.filter((document) => document.is_controlled).length;
  }, [documents]);

  const unassignedDocumentCount = useMemo(() => {
    return documents.filter((document) => !document.program_id).length;
  }, [documents]);

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
        Loading control center...
      </main>
    );
  }

  return (
    <AppShell activeNav="dashboard">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Control Center",
          },
        ]}
        eyebrow="QMS Overview"
        title="Control Center"
        description={`Operational snapshot for ${sessionDisplay.tenantName}. Review document control activity, approval workload, and quick access areas from one place.`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full border px-4 py-2 text-sm font-medium ${backendStatusClass}`}
        >
          Backend: {backendStatus}
        </span>

        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          User: {sessionDisplay.userName}
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Controlled Documents"
          value={summary.total_documents}
          helperText="Documents tracked in the QMS."
        />

        <WorkspaceStatCard
          label="Revisions in Review"
          value={summary.revisions_in_review}
          helperText="Revisions waiting on approval."
        />

        <WorkspaceStatCard
          label="Effective Revisions"
          value={summary.effective_revisions}
          helperText="Active controlled revisions."
        />

        <WorkspaceStatCard
          label="Pending Approvals"
          value={summary.pending_approvals}
          helperText="Approval actions still open."
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkspaceSectionCard
            title="Operational Snapshot"
            description="High-level indicators for current document control activity."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <WorkspaceStatCard
                label="Visible Documents"
                value={documents.length}
                helperText="Document records currently available."
              />

              <WorkspaceStatCard
                label="Controlled"
                value={controlledDocumentCount}
                helperText="Documents under formal control."
              />

              <WorkspaceStatCard
                label="Unassigned"
                value={unassignedDocumentCount}
                helperText="Documents needing program assignment."
              />
            </div>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Quick Access"
          description="Open the most common work areas."
        >
          <div className="space-y-3">
            <WorkspaceActionCard
              title="Programs"
              description="Open program workspaces for standards, deliverables, and readiness."
              href="/programs"
            />

            <WorkspaceActionCard
              title="Documents"
              description="Search and manage controlled document records."
              href="/documents"
            />

            <WorkspaceActionCard
              title="Audit Trail"
              description="Review evidence of document, revision, and approval activity."
              href="/audit-events"
            />

            <WorkspaceActionCard
              title="Admin Hub"
              description="Manage standards, access, and cleanup tasks."
              href="/admin"
            />
          </div>
        </WorkspaceSectionCard>
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Recent Controlled Documents"
          description="Recent document records pulled from the backend."
        >
          <div className="mb-5 flex justify-end">
            <Link
              href="/documents"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              View All Documents
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Document Number</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Current Revision</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {recentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6">
                      <WorkspaceEmptyState
                        title="No documents found"
                        description="Create the first document record to begin using the QMS control center."
                      />
                    </td>
                  </tr>
                ) : (
                  recentDocuments.map((document) => (
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
                        <WorkspaceStatusBadge status={document.status} />
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {document.current_revision_id ? "Assigned" : "None"}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/documents/${document.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </WorkspaceSectionCard>
      </div>
    </AppShell>
  );
}
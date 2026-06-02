"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import { WorkspaceStatusBadge } from "@/components/workspace/WorkspaceStatusBadge";
import { createStandard, getStandards } from "@/lib/api";
import type { StandardRecord } from "@/types/standard";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function standardLabel(standard: StandardRecord): string {
  return standard.revision
    ? `${standard.name} ${standard.revision}`
    : standard.name;
}

export default function AdminStandardsPage() {
  const router = useRouter();

  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown organization");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [name, setName] = useState("");
  const [revision, setRevision] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadStandards = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const response = await getStandards();

      setStandards(response.items);
      setTenantName(sessionStorage.getItem("tenant_name") ?? tenant);
    } catch (error) {
      console.error("Admin standards fetch failed:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const filteredStandards = useMemo(() => {
    const query = normalize(searchText);

    return standards.filter((standard) => {
      const matchesSearch =
        query.length === 0 ||
        normalize(standard.name).includes(query) ||
        normalize(standard.revision ?? "").includes(query) ||
        normalize(standard.issuing_body ?? "").includes(query) ||
        normalize(standard.description ?? "").includes(query);

      const matchesStatus =
        statusFilter === "all" || standard.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchText, standards, statusFilter]);

  const activeStandardCount = useMemo(() => {
    return standards.filter((standard) => standard.status === "active").length;
  }, [standards]);

  const inactiveStandardCount = useMemo(() => {
    return standards.filter((standard) => standard.status === "inactive")
      .length;
  }, [standards]);

  async function handleCreateStandard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const tenantId = sessionStorage.getItem("tenant_id");

    if (!tenantId) {
      setMessage("Organization session missing.");
      return;
    }

    if (!name.trim()) {
      setMessage("Standard name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      await createStandard({
        tenant_id: tenantId,
        name: name.trim(),
        revision: revision.trim() || null,
        issuing_body: issuingBody.trim() || null,
        description: description.trim() || null,
        status: "active",
        metadata_json: null,
      });

      setName("");
      setRevision("");
      setIssuingBody("");
      setDescription("");
      setMessage("Standard created successfully.");

      await loadStandards();
    } catch (error) {
      console.error("Standard creation failed:", error);
      setMessage(
        error instanceof Error ? error.message : "Standard creation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFilters() {
    setSearchText("");
    setStatusFilter("all");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadStandards(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStandards]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading admin standards...
      </main>
    );
  }

  return (
    <AppShell activeNav="admin">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Admin Tools",
            href: "/admin",
          },
          {
            label: "Standards Admin",
          },
        ]}
        eyebrow="Administration"
        title="Standards Admin"
        description={`Maintain standards, clause outlines, audit focus areas, and evidence expectations for ${tenantName}.`}
        action={{
          label: "View Standards Library",
          href: "/standards",
        }}
      />

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Total Standards"
          value={standards.length}
          helperText="Standards maintained in this organization."
        />

        <WorkspaceStatCard
          label="Active Standards"
          value={activeStandardCount}
          helperText="Standards currently available for program use."
        />

        <WorkspaceStatCard
          label="Inactive Standards"
          value={inactiveStandardCount}
          helperText="Standards not currently active."
        />

        <WorkspaceStatCard
          label="Showing"
          value={filteredStandards.length}
          helperText="Standards matching the current filters."
        />
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Controlled Reference Data"
          description="Standards maintenance is an administrative function. Do not enter copyrighted clause text word-for-word."
        >
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">
              Admin guidance
            </p>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-800">
              Store short labels, outline summaries, audit focus areas, and
              evidence expectations only. The system should help users interpret
              and trace requirements, not duplicate official standard text.
            </p>
          </div>
        </WorkspaceSectionCard>
      </div>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Add Standard"
          description="Add standards such as AS9100 Rev D, ISO 9001:2015, or customer/program-specific standards."
        >
          <form
            onSubmit={handleCreateStandard}
            className="grid gap-4 lg:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Standard Name <span className="text-red-600">*</span>
              </span>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="AS9100"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Revision / Edition
              </span>

              <input
                value={revision}
                onChange={(event) => setRevision(event.target.value)}
                placeholder="Rev D"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Issuing Body
              </span>

              <input
                value={issuingBody}
                onChange={(event) => setIssuingBody(event.target.value)}
                placeholder="IAQG / SAE"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Plain-language description of how this standard is used."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Creating..." : "Create Standard"}
              </button>
            </div>
          </form>
        </WorkspaceSectionCard>
      </div>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Managed Standards"
          description="Open a standard to manage its clause outline."
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-3">
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Search
              </span>

              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by name, revision, issuing body, or description"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="superseded">Superseded</option>
              </select>
            </label>
          </div>

          <div className="mb-5 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Standard</th>
                  <th className="px-4 py-3 font-semibold">Issuing Body</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStandards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6">
                      <WorkspaceEmptyState
                        title="No standards found"
                        description="Create a standard or adjust the filters to see more results."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStandards.map((standard) => (
                    <tr key={standard.id}>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {standardLabel(standard)}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {standard.issuing_body ?? "Not specified"}
                      </td>

                      <td className="px-4 py-3">
                        <WorkspaceStatusBadge status={standard.status} />
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(standard.created_at)}
                      </td>

                      <td className="max-w-xl px-4 py-3 text-slate-700">
                        {standard.description ?? "No description"}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/standards/${standard.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Manage Clauses
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
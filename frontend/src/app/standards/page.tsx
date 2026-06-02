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
import { getStandards } from "@/lib/api";
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

export default function StandardsPage() {
  const router = useRouter();

  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown organization");
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      console.error("Standards page fetch failed:", error);
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
        Loading standards...
      </main>
    );
  }

  return (
    <AppShell activeNav="standards">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Standards Library",
          },
        ]}
        eyebrow="Standards Library"
        title="Standards"
        description={`View standards and clause outlines available to ${tenantName}. This library is read-only for normal users. Standards maintenance belongs in Admin Tools.`}
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Total Standards"
          value={standards.length}
          helperText="Standards available in the library."
        />

        <WorkspaceStatCard
          label="Active Standards"
          value={activeStandardCount}
          helperText="Standards currently available for use."
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
          title="Read-Only Standards Library"
          description="Clause records are stored as outlines, summaries, audit focus areas, and evidence expectations. This page does not replace the official standard and does not contain copyrighted clause text."
        >
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">
              How this library should be used
            </p>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-800">
              Use this area to understand which standards exist in the system
              and to browse plain-language clause outlines. To add standards,
              update clauses, or assign standards to programs, use Admin Tools.
            </p>
          </div>
        </WorkspaceSectionCard>
      </div>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Standards Register"
          description="Browse standards and open a standard to view its clause outline."
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-3">
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Search
              </span>

              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by standard name, revision, issuing body, or description"
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
                        description="Adjust the filters or ask an administrator to add standards to the library."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStandards.map((standard) => (
                    <tr key={standard.id}>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        <Link
                          href={`/standards/${standard.id}`}
                          className="hover:underline"
                        >
                          {standardLabel(standard)}
                        </Link>
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
                          href={`/standards/${standard.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          View Clauses
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
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { CreateProgramForm } from "@/components/programs/CreateProgramForm";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import { WorkspaceStatusBadge } from "@/components/workspace/WorkspaceStatusBadge";
import { getPrograms } from "@/lib/api";
import type { ProgramRecord } from "@/types/program";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

export default function ProgramsPage() {
  const router = useRouter();

  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown organization");
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadPrograms = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const response = await getPrograms();

      setPrograms(response.items);
      setTenantName(sessionStorage.getItem("tenant_name") ?? tenant);
    } catch (error) {
      console.error("Programs page fetch failed:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const filteredPrograms = useMemo(() => {
    const query = normalize(searchText);

    return programs.filter((program) => {
      const matchesSearch =
        query.length === 0 ||
        normalize(program.name).includes(query) ||
        normalize(program.code ?? "").includes(query) ||
        normalize(program.description ?? "").includes(query);

      const matchesStatus =
        statusFilter === "all" || program.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [programs, searchText, statusFilter]);

  const activeProgramCount = useMemo(() => {
    return programs.filter((program) => program.status === "active").length;
  }, [programs]);

  const onHoldProgramCount = useMemo(() => {
    return programs.filter((program) => program.status === "on_hold").length;
  }, [programs]);

  function clearFilters() {
    setSearchText("");
    setStatusFilter("all");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPrograms(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPrograms]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading programs...
      </main>
    );
  }

  return (
    <AppShell activeNav="programs">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Programs",
          },
        ]}
        eyebrow="Program Management"
        title="Programs"
        description={`Programs define the operating areas where documents, standards, deliverables, NCRs, CAPAs, and audit evidence are managed for ${tenantName}.`}
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Total Programs"
          value={programs.length}
          helperText="Programs available in this organization."
        />

        <WorkspaceStatCard
          label="Active Programs"
          value={activeProgramCount}
          helperText="Programs currently in use."
        />

        <WorkspaceStatCard
          label="On Hold"
          value={onHoldProgramCount}
          helperText="Programs paused or waiting for action."
        />

        <WorkspaceStatCard
          label="Showing"
          value={filteredPrograms.length}
          helperText="Programs matching the current filters."
        />
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Add Program"
          description="Create a new program so documents, standards, deliverables, and quality activity can be organized under it."
        >
          <CreateProgramForm onChanged={loadPrograms} />
        </WorkspaceSectionCard>
      </div>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Program Register"
          description="Open a program workspace to manage standards, deliverables, documents, and audit readiness."
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-3">
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Search
              </span>

              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by program name, code, or description"
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
                <option value="on_hold">On Hold</option>
                <option value="closed">Closed</option>
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
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">End Date</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6">
                      <WorkspaceEmptyState
                        title="No programs found"
                        description="Create a program or adjust the filters to see more results."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((program) => (
                    <tr key={program.id}>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {program.name}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {program.code ?? "Not assigned"}
                      </td>

                      <td className="px-4 py-3">
                        <WorkspaceStatusBadge status={program.status} />
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(program.start_date)}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(program.end_date)}
                      </td>

                      <td className="max-w-lg px-4 py-3 text-slate-700">
                        {program.description ?? "No description"}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/programs/${program.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Open Program
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
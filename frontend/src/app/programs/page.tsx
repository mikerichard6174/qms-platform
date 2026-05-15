"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { CreateProgramForm } from "@/components/programs/CreateProgramForm";
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

function statusBadgeClass(status: string): string {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "on_hold") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "closed") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function ProgramsPage() {
  const router = useRouter();

  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown tenant");
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
    <AppShell>
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Program Management
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            Program Registry
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Tenant: {tenantName}
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Showing {filteredPrograms.length} of {programs.length}
        </div>
      </header>

      <CreateProgramForm onChanged={loadPrograms} />

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Program Register
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Programs define operational scope for documents, NCRs,
              CAPAs, and future RBAC visibility controls.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Search
            </span>

            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search name, code, or description"
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
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="closed">closed</option>
            </select>
          </label>
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
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No programs match the selected filters.
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                          program.status,
                        )}`}
                      >
                        {program.status}
                      </span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
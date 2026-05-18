"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
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
  const [tenantName, setTenantName] = useState("Unknown tenant");
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
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Standards Library
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            View Standards
          </h2>

          <p className="mt-2 text-sm text-slate-500">Tenant: {tenantName}</p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Showing {filteredStandards.length} of {standards.length}
        </div>
      </header>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-700">
          Read-Only Standards Library
        </p>

        <h3 className="mt-1 text-xl font-bold text-slate-950">
          Clause records are outlines, not copyrighted source text
        </h3>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-800">
          This page is for viewing standard names, revisions, clause outlines,
          plain-language summaries, audit focus areas, and evidence
          expectations. Standards creation and clause maintenance belong in
          Admin Tools.
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Standards Register
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Browse standards and open a standard to view its clause outline.
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
            <span className="text-sm font-medium text-slate-700">Search</span>

            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search name, revision, issuing body, or description"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Status</span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="superseded">superseded</option>
            </select>
          </label>
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
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No standards match the selected filters.
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
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {standard.status}
                      </span>
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
                        className="text-sm font-medium text-slate-950 hover:underline"
                      >
                        View clauses
                      </Link>
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
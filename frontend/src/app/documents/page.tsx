"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CreateDocumentForm } from "@/components/documents/CreateDocumentForm";
import { AppShell } from "@/components/layout/AppShell";
import { getDocuments } from "@/lib/api";
import type { DocumentRecord } from "@/types/document";

type ControlledFilter = "all" | "controlled" | "uncontrolled";

type SortKey =
  | "document_number"
  | "title"
  | "document_type"
  | "status"
  | "is_controlled"
  | "review_due_date";

type SortDirection = "asc" | "desc";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

function getReviewDueClass(value: string | null): string {
  if (!value) {
    return "text-slate-500";
  }

  const today = new Date();
  const dueDate = new Date(value);

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today) {
    return "font-semibold text-red-700";
  }

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (dueDate <= thirtyDaysFromNow) {
    return "font-semibold text-amber-700";
  }

  return "text-slate-700";
}

function compareValues(
  a: DocumentRecord,
  b: DocumentRecord,
  sortKey: SortKey,
): number {
  if (sortKey === "is_controlled") {
    return Number(a.is_controlled) - Number(b.is_controlled);
  }

  if (sortKey === "review_due_date") {
    const aValue = a.review_due_date ?? "";
    const bValue = b.review_due_date ?? "";

    return aValue.localeCompare(bValue);
  }

  return String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
}

export default function DocumentsPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown tenant");
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [controlledFilter, setControlledFilter] =
    useState<ControlledFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("document_number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadDocuments = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const response = await getDocuments();
      setDocuments(response.items);
      setTenantName(sessionStorage.getItem("tenant_name") ?? tenant);
    } catch (error) {
      console.error("Documents page fetch failed:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(documents.map((document) => document.status)))
      .filter(Boolean)
      .sort();
  }, [documents]);

  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(documents.map((document) => document.document_type)),
    )
      .filter(Boolean)
      .sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = normalize(searchText);

    const filtered = documents.filter((document) => {
      const matchesSearch =
        query.length === 0 ||
        normalize(document.document_number).includes(query) ||
        normalize(document.title).includes(query) ||
        normalize(document.document_type).includes(query) ||
        normalize(document.status).includes(query);

      const matchesStatus =
        statusFilter === "all" || document.status === statusFilter;

      const matchesType =
        typeFilter === "all" || document.document_type === typeFilter;

      const matchesControlled =
        controlledFilter === "all" ||
        (controlledFilter === "controlled" && document.is_controlled) ||
        (controlledFilter === "uncontrolled" && !document.is_controlled);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesControlled
      );
    });

    return filtered.sort((a, b) => {
      const result = compareValues(a, b, sortKey);
      return sortDirection === "asc" ? result : result * -1;
    });
  }, [
    controlledFilter,
    documents,
    searchText,
    sortDirection,
    sortKey,
    statusFilter,
    typeFilter,
  ]);

  function clearFilters() {
    setSearchText("");
    setStatusFilter("all");
    setTypeFilter("all");
    setControlledFilter("all");
    setSortKey("document_number");
    setSortDirection("asc");
  }

  function updateSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function sortLabel(column: SortKey): string {
    if (sortKey !== column) {
      return "";
    }

    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDocuments]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading documents...
      </main>
    );
  }

  return (
    <AppShell activeNav="documents">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Document Control
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            Document Register
          </h2>

          <p className="mt-2 text-sm text-slate-500">Tenant: {tenantName}</p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Showing {filteredDocuments.length} of {documents.length}
        </div>
      </header>

      <CreateDocumentForm onChanged={loadDocuments} />

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Document Register
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and sort controlled document master records.
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

        <div className="mb-5 grid gap-4 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">Search</span>

            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search document number, title, type, or status"
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
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Type</span>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All types</option>
              {typeOptions.map((documentType) => (
                <option key={documentType} value={documentType}>
                  {documentType}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-5 max-w-xs">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Control Type
            </span>

            <select
              value={controlledFilter}
              onChange={(event) =>
                setControlledFilter(event.target.value as ControlledFilter)
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All documents</option>
              <option value="controlled">Controlled only</option>
              <option value="uncontrolled">Uncontrolled only</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSort("document_number")}
                    className="font-semibold hover:underline"
                  >
                    Document #{sortLabel("document_number")}
                  </button>
                </th>

                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSort("title")}
                    className="font-semibold hover:underline"
                  >
                    Title{sortLabel("title")}
                  </button>
                </th>

                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSort("document_type")}
                    className="font-semibold hover:underline"
                  >
                    Type{sortLabel("document_type")}
                  </button>
                </th>

                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSort("status")}
                    className="font-semibold hover:underline"
                  >
                    Status{sortLabel("status")}
                  </button>
                </th>

                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSort("is_controlled")}
                    className="font-semibold hover:underline"
                  >
                    Controlled{sortLabel("is_controlled")}
                  </button>
                </th>

                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSort("review_due_date")}
                    className="font-semibold hover:underline"
                  >
                    Review Due{sortLabel("review_due_date")}
                  </button>
                </th>

                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No documents match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((document) => (
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
                      {document.is_controlled ? "Yes" : "No"}
                    </td>

                    <td
                      className={`px-4 py-3 ${getReviewDueClass(
                        document.review_due_date,
                      )}`}
                    >
                      {formatDate(document.review_due_date)}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/${document.id}`}
                        className="text-sm font-medium text-slate-950 hover:underline"
                      >
                        View workspace
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
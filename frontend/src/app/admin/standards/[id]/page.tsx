"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import {
  createStandardClause,
  getStandard,
  getStandardClauses,
} from "@/lib/api";
import type { StandardRecord } from "@/types/standard";
import type { StandardClauseRecord } from "@/types/standardClause";

type AdminStandardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function standardLabel(standard: StandardRecord): string {
  return standard.revision
    ? `${standard.name} ${standard.revision}`
    : standard.name;
}

function clauseLabel(clause: StandardClauseRecord): string {
  return `${clause.clause_number} - ${clause.title}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export default function AdminStandardDetailPage({
  params,
}: AdminStandardDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [standard, setStandard] = useState<StandardRecord | null>(null);
  const [clauses, setClauses] = useState<StandardClauseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [parentClauseId, setParentClauseId] = useState("");
  const [clauseNumber, setClauseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [auditGuidance, setAuditGuidance] = useState("");
  const [evidenceExamples, setEvidenceExamples] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [message, setMessage] = useState<string | null>(null);

  const loadStandardWorkspace = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const [standardRecord, clauseResponse] = await Promise.all([
        getStandard(resolvedParams.id),
        getStandardClauses(resolvedParams.id),
      ]);

      setStandard(standardRecord);
      setClauses(clauseResponse.items);
    } catch (error) {
      console.error("Admin standard detail fetch failed:", error);
      router.replace("/admin/standards");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id, router]);

  const parentClauseOptions = useMemo(() => {
    return clauses
      .filter((clause) => clause.status === "active")
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }

        return a.clause_number.localeCompare(b.clause_number);
      });
  }, [clauses]);

  const topLevelClauses = useMemo(() => {
    return clauses
      .filter((clause) => !clause.parent_clause_id)
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }

        return a.clause_number.localeCompare(b.clause_number);
      });
  }, [clauses]);

  const childClausesByParent = useMemo(() => {
    const grouped = new Map<string, StandardClauseRecord[]>();

    clauses.forEach((clause) => {
      if (!clause.parent_clause_id) {
        return;
      }

      const existing = grouped.get(clause.parent_clause_id) ?? [];
      grouped.set(clause.parent_clause_id, [...existing, clause]);
    });

    grouped.forEach((items, parentId) => {
      grouped.set(
        parentId,
        items.sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }

          return a.clause_number.localeCompare(b.clause_number);
        }),
      );
    });

    return grouped;
  }, [clauses]);

  async function handleCreateClause(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const tenantId = sessionStorage.getItem("tenant_id");

    if (!tenantId) {
      setMessage("Tenant session missing.");
      return;
    }

    if (!standard) {
      setMessage("Standard is not loaded.");
      return;
    }

    if (!clauseNumber.trim() || !title.trim()) {
      setMessage("Clause number and title are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      await createStandardClause({
        tenant_id: tenantId,
        standard_id: standard.id,
        parent_clause_id: parentClauseId || null,
        clause_number: clauseNumber.trim(),
        title: title.trim(),
        summary: summary.trim() || null,
        audit_guidance: auditGuidance.trim() || null,
        evidence_examples: evidenceExamples.trim() || null,
        sort_order: Number(sortOrder) || 0,
        status: "active",
        metadata_json: null,
      });

      setParentClauseId("");
      setClauseNumber("");
      setTitle("");
      setSummary("");
      setAuditGuidance("");
      setEvidenceExamples("");
      setSortOrder("0");
      setMessage("Clause outline added successfully.");

      await loadStandardWorkspace();
    } catch (error) {
      console.error("Clause creation failed:", error);
      setMessage(
        error instanceof Error ? error.message : "Clause creation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadStandardWorkspace(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStandardWorkspace]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading standard admin workspace...
      </main>
    );
  }

  if (!standard) {
    return (
      <AppShell activeNav="admin-standards">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Standard could not be loaded.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="admin-standards">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin Standards Management
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            {standardLabel(standard)}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage clause outlines and traceability guidance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/standards/${standard.id}`}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Library Page
          </Link>

          <Link
            href="/admin/standards"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Standards Admin
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-amber-700">
          Controlled Clause Outlines
        </p>

        <h3 className="mt-1 text-xl font-bold text-slate-950">
          Do not enter copyrighted clause text
        </h3>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-800">
          Store clause numbers, short titles, plain-language summaries, audit
          focus areas, and evidence expectations. This supports traceability
          without copying the standard word-for-word.
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-950">
            Add Clause Outline
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add a top-level clause or select a parent clause to create a
            subclause.
          </p>
        </div>

        <form onSubmit={handleCreateClause} className="grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Parent Clause
            </span>

            <select
              value={parentClauseId}
              onChange={(event) => setParentClauseId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">No parent clause</option>

              {parentClauseOptions.map((clause) => (
                <option key={clause.id} value={clause.id}>
                  {clauseLabel(clause)}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Leave blank for a top-level clause.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Clause Number <span className="text-red-600">*</span>
            </span>

            <input
              value={clauseNumber}
              onChange={(event) => setClauseNumber(event.target.value)}
              placeholder="8.4"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Sort Order
            </span>

            <input
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Clause Title <span className="text-red-600">*</span>
            </span>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Control of externally provided processes, products, and services"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Plain-Language Summary
            </span>

            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
              placeholder="Describe the intent of the clause in your own words."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Audit Guidance
            </span>

            <textarea
              value={auditGuidance}
              onChange={(event) => setAuditGuidance(event.target.value)}
              rows={4}
              placeholder="What should an auditor look for?"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Evidence Examples
            </span>

            <textarea
              value={evidenceExamples}
              onChange={(event) => setEvidenceExamples(event.target.value)}
              rows={4}
              placeholder="Examples: procedure, records, approvals, objective evidence."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Adding..." : "Add Clause Outline"}
            </button>

            {message ? (
              <p className="text-sm text-slate-600">{message}</p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Clause Outline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Hierarchical clause outline for this standard.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Clauses: {clauses.length}
          </div>
        </div>

        <div className="space-y-4">
          {topLevelClauses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-500">
              No clauses have been added for this standard yet.
            </div>
          ) : (
            topLevelClauses.map((clause) => {
              const children = childClausesByParent.get(clause.id) ?? [];

              return (
                <article
                  key={clause.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Clause {clause.clause_number}
                      </p>

                      <h4 className="mt-1 text-lg font-bold text-slate-950">
                        {clause.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {clause.summary ?? "No summary provided."}
                      </p>
                    </div>

                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {clause.status}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Audit Guidance
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {clause.audit_guidance ?? "No audit guidance provided."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Evidence Examples
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {clause.evidence_examples ??
                          "No evidence examples provided."}
                      </p>
                    </div>
                  </div>

                  {children.length > 0 ? (
                    <div className="mt-5 space-y-3 border-l-4 border-slate-200 pl-4">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-500">
                                Clause {child.clause_number}
                              </p>

                              <h5 className="mt-1 font-bold text-slate-950">
                                {child.title}
                              </h5>

                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {child.summary ?? "No summary provided."}
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              {child.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-4 text-xs text-slate-500">
                    Created {formatDate(clause.created_at)}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
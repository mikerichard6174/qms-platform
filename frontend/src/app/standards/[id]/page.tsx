"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getStandard, getStandardClauses } from "@/lib/api";
import type { StandardRecord } from "@/types/standard";
import type { StandardClauseRecord } from "@/types/standardClause";

type StandardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function standardLabel(standard: StandardRecord): string {
  return standard.revision
    ? `${standard.name} ${standard.revision}`
    : standard.name;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function sortClauses(
  clauses: StandardClauseRecord[],
): StandardClauseRecord[] {
  return [...clauses].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }

    return a.clause_number.localeCompare(b.clause_number);
  });
}

export default function StandardDetailPage({ params }: StandardDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [standard, setStandard] = useState<StandardRecord | null>(null);
  const [clauses, setClauses] = useState<StandardClauseRecord[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadStandard = useCallback(async () => {
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
      console.error("Standard detail fetch failed:", error);
      router.replace("/standards");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id, router]);

  const filteredClauses = useMemo(() => {
    const query = normalize(searchText);

    if (!query) {
      return clauses;
    }

    return clauses.filter((clause) => {
      return (
        normalize(clause.clause_number).includes(query) ||
        normalize(clause.title).includes(query) ||
        normalize(clause.summary ?? "").includes(query) ||
        normalize(clause.audit_guidance ?? "").includes(query) ||
        normalize(clause.evidence_examples ?? "").includes(query)
      );
    });
  }, [clauses, searchText]);

  const topLevelClauses = useMemo(() => {
    return sortClauses(
      filteredClauses.filter((clause) => !clause.parent_clause_id),
    );
  }, [filteredClauses]);

  const childClausesByParent = useMemo(() => {
    const grouped = new Map<string, StandardClauseRecord[]>();

    filteredClauses.forEach((clause) => {
      if (!clause.parent_clause_id) {
        return;
      }

      const existing = grouped.get(clause.parent_clause_id) ?? [];
      grouped.set(clause.parent_clause_id, [...existing, clause]);
    });

    grouped.forEach((items, parentId) => {
      grouped.set(parentId, sortClauses(items));
    });

    return grouped;
  }, [filteredClauses]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadStandard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStandard]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading standard...
      </main>
    );
  }

  if (!standard) {
    return (
      <AppShell activeNav="standards">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Standard could not be loaded.
        </div>
      </AppShell>
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
            {standardLabel(standard)}
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
            {standard.description ?? "No description provided."}
          </p>
        </div>

        <Link
          href="/standards"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Standards
        </Link>
      </header>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-700">
          Read-Only Clause Outline
        </p>

        <h3 className="mt-1 text-xl font-bold text-slate-950">
          Use this page to understand clause intent and expected evidence
        </h3>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-800">
          This page provides plain-language clause summaries, audit focus areas,
          and evidence examples. It does not replace the official standard and
          does not contain copyrighted clause text.
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Clause Outline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Browse clause summaries and evidence expectations.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Clauses: {filteredClauses.length}
          </div>
        </div>

        <label className="mb-5 block">
          <span className="text-sm font-medium text-slate-700">
            Search clauses
          </span>

          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search clause number, title, summary, audit guidance, or evidence"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="space-y-4">
          {topLevelClauses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-500">
              No matching clauses found.
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

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {clause.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Audit Focus
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {clause.audit_guidance ??
                          "No audit focus has been defined yet."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Evidence Examples
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {clause.evidence_examples ??
                          "No evidence examples have been defined yet."}
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

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Audit Focus
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {child.audit_guidance ??
                                  "No audit focus has been defined yet."}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Evidence Examples
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {child.evidence_examples ??
                                  "No evidence examples have been defined yet."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
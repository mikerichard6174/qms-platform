"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import { WorkspaceStatusBadge } from "@/components/workspace/WorkspaceStatusBadge";
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

function sortClauses(clauses: StandardClauseRecord[]): StandardClauseRecord[] {
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

  const activeClauseCount = useMemo(() => {
    return clauses.filter((clause) => clause.status === "active").length;
  }, [clauses]);

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
        <WorkspaceEmptyState
          title="Standard could not be loaded"
          description="Return to the Standards Library and try opening the standard again."
        />
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="standards">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Standards Library",
            href: "/standards",
          },
          {
            label: standardLabel(standard),
          },
        ]}
        eyebrow="Read-Only Standard"
        title={standardLabel(standard)}
        description={
          standard.description ??
          "View clause outlines, audit focus areas, and evidence expectations for this standard."
        }
        action={{
          label: "Back to Standards",
          href: "/standards",
        }}
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Total Clauses"
          value={clauses.length}
          helperText="Clause outlines available for this standard."
        />

        <WorkspaceStatCard
          label="Active Clauses"
          value={activeClauseCount}
          helperText="Clauses currently available for use."
        />

        <WorkspaceStatCard
          label="Showing"
          value={filteredClauses.length}
          helperText="Clauses matching the current search."
        />

        <WorkspaceStatCard
          label="Status"
          value={standard.status}
          helperText="Current library status."
        />
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Standard Information"
          description="General information about this standard record."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Issuing Body
              </p>

              <p className="mt-2 text-sm font-medium text-slate-950">
                {standard.issuing_body ?? "Not specified"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Revision
              </p>

              <p className="mt-2 text-sm font-medium text-slate-950">
                {standard.revision ?? "Not specified"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>

              <div className="mt-2">
                <WorkspaceStatusBadge status={standard.status} />
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>
      </div>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Clause Outline"
          description="Browse plain-language clause summaries, audit focus areas, and evidence examples."
        >
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">
              Read-only guidance
            </p>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-800">
              This page provides outlines and interpretation aids only. It does
              not replace the official standard and does not contain copyrighted
              clause text.
            </p>
          </div>

          <label className="mb-5 block">
            <span className="text-sm font-medium text-slate-700">
              Search clauses
            </span>

            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search clause number, title, summary, audit focus, or evidence examples"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-4">
            {topLevelClauses.length === 0 ? (
              <WorkspaceEmptyState
                title="No matching clauses"
                description="No clause outlines match the current search."
              />
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

                      <WorkspaceStatusBadge status={clause.status} />
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

                              <WorkspaceStatusBadge status={child.status} />
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
        </WorkspaceSectionCard>
      </div>
    </AppShell>
  );
}
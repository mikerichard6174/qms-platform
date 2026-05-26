"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ProgramWorkspaceNav } from "@/components/workspace/ProgramWorkspaceNav";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import { WorkspaceStatusBadge } from "@/components/workspace/WorkspaceStatusBadge";
import {
  getProgram,
  getProgramStandardMappings,
  getStandard,
  getStandardClauses,
} from "@/lib/api";
import type { ProgramRecord } from "@/types/program";
import type { ProgramStandardMappingRecord } from "@/types/programStandardMapping";
import type { StandardRecord } from "@/types/standard";
import type { StandardClauseRecord } from "@/types/standardClause";

type ProgramStandardsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function programLabel(program: ProgramRecord): string {
  return program.code ? `${program.code} - ${program.name}` : program.name;
}

function standardLabel(standard: StandardRecord): string {
  return standard.revision
    ? `${standard.name} ${standard.revision}`
    : standard.name;
}

export default function ProgramStandardsPage({
  params,
}: ProgramStandardsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [program, setProgram] = useState<ProgramRecord | null>(null);

  const [programStandardMappings, setProgramStandardMappings] = useState<
    ProgramStandardMappingRecord[]
  >([]);

  const [standards, setStandards] = useState<StandardRecord[]>([]);

  const [clausesByStandard, setClausesByStandard] = useState<
    Record<string, StandardClauseRecord[]>
  >({});

  const [isLoading, setIsLoading] = useState(true);

  const totalClauseCount = useMemo(() => {
    return Object.values(clausesByStandard).reduce(
      (total, clauses) => total + clauses.length,
      0,
    );
  }, [clausesByStandard]);

  const loadProgramStandardsWorkspace = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const [programRecord, mappingResponse] = await Promise.all([
        getProgram(resolvedParams.id),
        getProgramStandardMappings(resolvedParams.id),
      ]);

      const standardRecords = await Promise.all(
        mappingResponse.items.map((mapping) =>
          getStandard(mapping.standard_id),
        ),
      );

      const clauseResponses = await Promise.all(
        standardRecords.map((standard) =>
          getStandardClauses(standard.id),
        ),
      );

      const clauseMap: Record<string, StandardClauseRecord[]> = {};

      standardRecords.forEach((standard, index) => {
        clauseMap[standard.id] = clauseResponses[index].items;
      });

      setProgram(programRecord);
      setProgramStandardMappings(mappingResponse.items);
      setStandards(standardRecords);
      setClausesByStandard(clauseMap);
    } catch (error) {
      console.error("Program standards workspace fetch failed:", error);
      router.replace("/programs");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => void loadProgramStandardsWorkspace(),
      0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [loadProgramStandardsWorkspace]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading standards...
      </main>
    );
  }

  if (!program) {
    return (
      <AppShell activeNav="programs">
        <WorkspaceEmptyState
          title="Program could not be loaded"
          description="Return to the program registry and try opening the workspace again."
        />
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="programs">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Programs",
            href: "/programs",
          },
          {
            label: programLabel(program),
            href: `/programs/${program.id}`,
          },
          {
            label: "Standards",
          },
        ]}
        eyebrow="Program Standards"
        title={programLabel(program)}
        description="View standards and clause outlines assigned to this program."
        action={{
          label: "Back to Program Workspace",
          href: `/programs/${program.id}`,
        }}
      />

      <ProgramWorkspaceNav
        programId={program.id}
        activeTab="standards"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <WorkspaceStatCard
          label="Assigned Standards"
          value={standards.length}
          helperText="Standards assigned to this program."
        />

        <WorkspaceStatCard
          label="Available Clauses"
          value={totalClauseCount}
          helperText="Clause outlines available for traceability."
        />

        <WorkspaceStatCard
          label="Program Standard Links"
          value={programStandardMappings.length}
          helperText="Traceability relationships created."
        />
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Assigned Standards"
          description="Standards and clause outlines that apply to this program."
        >
          <div className="space-y-6">
            {standards.length === 0 ? (
              <WorkspaceEmptyState
                title="No standards assigned"
                description="Assign standards to this program from Standards Admin so the team can track clauses, deliverables, and audit evidence."
              />
            ) : (
              standards.map((standard) => {
                const clauses = clausesByStandard[standard.id] ?? [];

                return (
                  <article
                    key={standard.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Standard
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-slate-950">
                          {standardLabel(standard)}
                        </h3>

                        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                          {standard.description ??
                            "No standard description provided."}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <WorkspaceStatusBadge status={standard.status} />

                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Clauses
                          </p>

                          <p className="mt-1 text-2xl font-bold text-slate-950">
                            {clauses.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">
                              Clause
                            </th>

                            <th className="px-4 py-3 font-semibold">
                              Title
                            </th>

                            <th className="px-4 py-3 font-semibold">
                              Summary
                            </th>

                            <th className="px-4 py-3 font-semibold">
                              Audit Guidance
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 bg-white">
                          {clauses.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6">
                                <WorkspaceEmptyState
                                  title="No clause outlines"
                                  description="Clause outlines have not been added for this standard yet."
                                />
                              </td>
                            </tr>
                          ) : (
                            clauses.map((clause) => (
                              <tr key={clause.id}>
                                <td className="px-4 py-3 font-medium text-slate-950">
                                  {clause.clause_number}
                                </td>

                                <td className="px-4 py-3 text-slate-700">
                                  {clause.title}
                                </td>

                                <td className="max-w-xl px-4 py-3 text-slate-700">
                                  {clause.summary ??
                                    "No summary provided."}
                                </td>

                                <td className="max-w-xl px-4 py-3 text-slate-700">
                                  {clause.audit_guidance ??
                                    "No audit guidance provided."}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                      Revision: {standard.revision ?? "Not specified"} |
                      Status: {standard.status}
                    </div>
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
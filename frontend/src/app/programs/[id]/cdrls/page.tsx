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
  createCdrl,
  createCdrlClauseMapping,
  getCdrlClauseMappings,
  getCdrlsForProgram,
  getProgram,
  getProgramStandardMappings,
  getStandard,
  getStandardClauses,
} from "@/lib/api";
import type { CdrlRecord } from "@/types/cdrl";
import type { CdrlClauseMappingRecord } from "@/types/cdrlClauseMapping";
import type { ProgramRecord } from "@/types/program";
import type { StandardRecord } from "@/types/standard";
import type { StandardClauseRecord } from "@/types/standardClause";

type ProgramCdrlsPageProps = {
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

function clauseLabel(clause: StandardClauseRecord): string {
  return `${clause.clause_number} - ${clause.title}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

export default function ProgramCdrlsPage({
  params,
}: ProgramCdrlsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [cdrls, setCdrls] = useState<CdrlRecord[]>([]);
  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [clauses, setClauses] = useState<StandardClauseRecord[]>([]);
  const [mappingsByCdrl, setMappingsByCdrl] = useState<
    Record<string, CdrlClauseMappingRecord[]>
  >({});

  const [cdrlNumber, setCdrlNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverableType, setDeliverableType] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [selectedCdrlId, setSelectedCdrlId] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState("");
  const [applicability, setApplicability] = useState("required");
  const [rationale, setRationale] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCdrl, setIsCreatingCdrl] = useState(false);
  const [isMappingClause, setIsMappingClause] = useState(false);

  const standardsById = useMemo(() => {
    return new Map(standards.map((standard) => [standard.id, standard]));
  }, [standards]);

  const clausesById = useMemo(() => {
    return new Map(clauses.map((clause) => [clause.id, clause]));
  }, [clauses]);

  const mappedClauseCount = useMemo(() => {
    return Object.values(mappingsByCdrl).reduce(
      (total, mappings) => total + mappings.length,
      0,
    );
  }, [mappingsByCdrl]);

  const availableClauses = useMemo(() => {
    return [...clauses].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }

      return a.clause_number.localeCompare(b.clause_number);
    });
  }, [clauses]);

  const loadProgramCdrlWorkspace = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const [programRecord, cdrlResponse, mappingResponse] =
        await Promise.all([
          getProgram(resolvedParams.id),
          getCdrlsForProgram(resolvedParams.id),
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

      const clauseRecords = clauseResponses.flatMap(
        (response) => response.items,
      );

      const cdrlMappingEntries = await Promise.all(
        cdrlResponse.items.map(async (cdrl) => {
          const response = await getCdrlClauseMappings(cdrl.id);

          return [cdrl.id, response.items] as const;
        }),
      );

      setProgram(programRecord);
      setCdrls(cdrlResponse.items);
      setStandards(standardRecords);
      setClauses(clauseRecords);
      setMappingsByCdrl(Object.fromEntries(cdrlMappingEntries));
    } catch (error) {
      console.error("Program CDRL workspace fetch failed:", error);
      router.replace("/programs");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id, router]);

  async function handleCreateCdrl(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const tenantId = sessionStorage.getItem("tenant_id");

    if (!tenantId) {
      setMessage("Tenant session missing.");
      return;
    }

    if (!cdrlNumber.trim() || !title.trim()) {
      setMessage("Deliverable number and title are required.");
      return;
    }

    try {
      setIsCreatingCdrl(true);
      setMessage(null);

      await createCdrl({
        tenant_id: tenantId,
        program_id: resolvedParams.id,
        cdrl_number: cdrlNumber.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || null,
        deliverable_type: deliverableType.trim() || null,
        frequency: frequency.trim() || null,
        due_date: dueDate || null,
        status: "active",
        owner_user_id: null,
        metadata_json: null,
      });

      setCdrlNumber("");
      setTitle("");
      setDescription("");
      setDeliverableType("");
      setFrequency("");
      setDueDate("");

      setMessage("Deliverable created successfully.");

      await loadProgramCdrlWorkspace();
    } catch (error) {
      console.error("Deliverable creation failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Deliverable creation failed.",
      );
    } finally {
      setIsCreatingCdrl(false);
    }
  }

  async function handleCreateClauseMapping(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const tenantId = sessionStorage.getItem("tenant_id");

    if (!tenantId) {
      setMessage("Tenant session missing.");
      return;
    }

    if (!selectedCdrlId) {
      setMessage("Select a deliverable before connecting a clause.");
      return;
    }

    if (!selectedClauseId) {
      setMessage("Select a clause before connecting it.");
      return;
    }

    try {
      setIsMappingClause(true);
      setMessage(null);

      await createCdrlClauseMapping({
        tenant_id: tenantId,
        cdrl_id: selectedCdrlId,
        standard_clause_id: selectedClauseId,
        applicability,
        rationale: rationale.trim() || null,
        status: "active",
        metadata_json: null,
      });

      setSelectedClauseId("");
      setApplicability("required");
      setRationale("");

      setMessage("Clause connected successfully.");

      await loadProgramCdrlWorkspace();
    } catch (error) {
      console.error("Clause connection failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Clause connection failed.",
      );
    } finally {
      setIsMappingClause(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => void loadProgramCdrlWorkspace(),
      0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [loadProgramCdrlWorkspace]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading deliverables...
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
            label: "Deliverables",
          },
        ]}
        eyebrow="Program Deliverables"
        title={programLabel(program)}
        description="Manage deliverables and connect them to applicable standards clauses."
        action={{
          label: "Back to Program Workspace",
          href: `/programs/${program.id}`,
        }}
      />

      <ProgramWorkspaceNav
        programId={program.id}
        activeTab="deliverables"
      />

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Assigned Standards"
          value={standards.length}
          helperText="Standards available for traceability."
        />

        <WorkspaceStatCard
          label="Available Clauses"
          value={availableClauses.length}
          helperText="Clauses available from assigned standards."
        />

        <WorkspaceStatCard
          label="Deliverables"
          value={cdrls.length}
          helperText="CDRLs being tracked for this program."
        />

        <WorkspaceStatCard
          label="Clause Links"
          value={mappedClauseCount}
          helperText="Traceability links created so far."
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <WorkspaceSectionCard
          title="Create Deliverable"
          description="Add a contract deliverable or recurring reporting requirement."
        >
          <form
            onSubmit={handleCreateCdrl}
            className="grid gap-4"
          >
            <input
              value={cdrlNumber}
              onChange={(event) =>
                setCdrlNumber(event.target.value)
              }
              placeholder="Deliverable Number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Deliverable Title"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              placeholder="Description"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={deliverableType}
                onChange={(event) =>
                  setDeliverableType(event.target.value)
                }
                placeholder="Type"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <input
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value)
                }
                placeholder="Frequency"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <input
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(event.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingCdrl}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {isCreatingCdrl
                ? "Creating..."
                : "Create Deliverable"}
            </button>
          </form>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Connect Clause to Deliverable"
          description="Create traceability links between deliverables and standards clauses."
        >
          <form
            onSubmit={handleCreateClauseMapping}
            className="grid gap-4"
          >
            <select
              value={selectedCdrlId}
              onChange={(event) =>
                setSelectedCdrlId(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select Deliverable</option>

              {cdrls.map((cdrl) => (
                <option key={cdrl.id} value={cdrl.id}>
                  {cdrl.cdrl_number} - {cdrl.title}
                </option>
              ))}
            </select>

            <select
              value={selectedClauseId}
              onChange={(event) =>
                setSelectedClauseId(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select Clause</option>

              {availableClauses.map((clause) => {
                const standard = standardsById.get(
                  clause.standard_id,
                );

                return (
                  <option key={clause.id} value={clause.id}>
                    {standard
                      ? `${standardLabel(standard)} | `
                      : ""}
                    {clauseLabel(clause)}
                  </option>
                );
              })}
            </select>

            <select
              value={applicability}
              onChange={(event) =>
                setApplicability(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="required">Required</option>
              <option value="contractual">Contractual</option>
              <option value="internal">Internal</option>
              <option value="reference">Reference Only</option>
            </select>

            <input
              value={rationale}
              onChange={(event) =>
                setRationale(event.target.value)
              }
              placeholder="Reason this clause applies"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={isMappingClause}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {isMappingClause
                ? "Connecting..."
                : "Connect Clause"}
            </button>
          </form>
        </WorkspaceSectionCard>
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Deliverable Register"
          description="Deliverables and their linked standards clauses."
        >
          <div className="space-y-5">
            {cdrls.length === 0 ? (
              <WorkspaceEmptyState
                title="No deliverables yet"
                description="Add the first deliverable for this program to begin tracking contract requirements."
              />
            ) : (
              cdrls.map((cdrl) => {
                const mappedClauses =
                  mappingsByCdrl[cdrl.id] ?? [];

                return (
                  <article
                    key={cdrl.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          {cdrl.cdrl_number}
                        </p>

                        <h4 className="mt-1 text-lg font-bold text-slate-950">
                          {cdrl.title}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {cdrl.description ??
                            "No description provided."}
                        </p>
                      </div>

                      <WorkspaceStatusBadge status={cdrl.status} />
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Type
                        </p>

                        <p className="mt-2 text-sm font-medium text-slate-950">
                          {cdrl.deliverable_type ??
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Frequency
                        </p>

                        <p className="mt-2 text-sm font-medium text-slate-950">
                          {cdrl.frequency ?? "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Due Date
                        </p>

                        <p className="mt-2 text-sm font-medium text-slate-950">
                          {formatDate(cdrl.due_date)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <h5 className="font-semibold text-slate-950">
                        Linked Clauses
                      </h5>

                      {mappedClauses.length === 0 ? (
                        <div className="mt-3">
                          <WorkspaceEmptyState
                            title="No clauses linked"
                            description="Connect a standards clause to show why this deliverable is required or how it supports compliance."
                          />
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {mappedClauses.map((mapping) => {
                            const clause = clausesById.get(
                              mapping.standard_clause_id,
                            );

                            const standard = clause
                              ? standardsById.get(
                                  clause.standard_id,
                                )
                              : null;

                            return (
                              <div
                                key={mapping.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <p className="text-sm font-semibold text-slate-950">
                                  {standard
                                    ? `${standardLabel(
                                        standard,
                                      )} | `
                                    : ""}
                                  {clause
                                    ? clauseLabel(clause)
                                    : "Unknown clause"}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  {clause?.summary ??
                                    "No summary available."}
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                  Applicability:{" "}
                                  {mapping.applicability}
                                  {mapping.rationale
                                    ? ` | ${mapping.rationale}`
                                    : ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
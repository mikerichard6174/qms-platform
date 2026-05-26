"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceActionCard } from "@/components/workspace/WorkspaceActionCard";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import {
  assignDocumentToProgram,
  createUserProgramAssignment,
  getPrograms,
  getUnassignedDocuments,
  getUserProgramAssignments,
  revokeUserProgramAssignment,
} from "@/lib/api";
import type { DocumentRecord } from "@/types/document";
import type { ProgramRecord } from "@/types/program";
import type { UserProgramAssignmentRecord } from "@/types/userProgramAssignment";

function getProgramLabel(program: ProgramRecord): string {
  return program.code ? `${program.code} - ${program.name}` : program.name;
}

function getProgramLabelById(
  programId: string,
  programsById: Map<string, ProgramRecord>,
): string {
  const program = programsById.get(programId);

  if (!program) {
    return "Unknown program";
  }

  return getProgramLabel(program);
}

export default function AdminToolsPage() {
  const router = useRouter();

  const [unassignedDocuments, setUnassignedDocuments] = useState<
    DocumentRecord[]
  >([]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [selectedProgramByDocument, setSelectedProgramByDocument] = useState<
    Record<string, string>
  >({});

  const [lookupUserId, setLookupUserId] = useState("");
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentProgramId, setAssignmentProgramId] = useState("");
  const [userAssignments, setUserAssignments] = useState<
    UserProgramAssignmentRecord[]
  >([]);

  const [tenantName, setTenantName] = useState("Unknown organization");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    null,
  );
  const [isAssigningUserProgram, setIsAssigningUserProgram] = useState(false);

  const activePrograms = useMemo(() => {
    return programs.filter((program) => program.status === "active");
  }, [programs]);

  const programsById = useMemo(() => {
    return new Map(programs.map((program) => [program.id, program]));
  }, [programs]);

  const loadAdminData = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const [documentResponse, programResponse] = await Promise.all([
        getUnassignedDocuments(),
        getPrograms(),
      ]);

      setUnassignedDocuments(documentResponse.items);
      setPrograms(programResponse.items);
      setTenantName(sessionStorage.getItem("tenant_name") ?? tenant);
    } catch (error) {
      console.error("Admin tools fetch failed:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  async function refreshLoadedAssignments(userId: string) {
    const response = await getUserProgramAssignments(userId);
    setUserAssignments(response.items);
  }

  async function handleAssignProgram(documentId: string) {
    const selectedProgramId = selectedProgramByDocument[documentId];

    if (!selectedProgramId) {
      setMessage("Select a program before assigning the document.");
      return;
    }

    try {
      setActiveDocumentId(documentId);
      setMessage(null);

      await assignDocumentToProgram(documentId, {
        program_id: selectedProgramId,
      });

      setSelectedProgramByDocument((current) => {
        const next = { ...current };
        delete next[documentId];
        return next;
      });

      setMessage("Document assigned to program successfully.");
      await loadAdminData();
    } catch (error) {
      console.error("Document program assignment failed:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Document program assignment failed.",
      );
    } finally {
      setActiveDocumentId(null);
    }
  }

  async function handleLoadUserAssignments() {
    const trimmedUserId = lookupUserId.trim();

    if (!trimmedUserId) {
      setMessage("Enter a user ID before loading assignments.");
      return;
    }

    try {
      setIsLoadingAssignments(true);
      setMessage(null);

      await refreshLoadedAssignments(trimmedUserId);
      setAssignmentUserId(trimmedUserId);
    } catch (error) {
      console.error("User assignment lookup failed:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "User assignment lookup failed.",
      );
    } finally {
      setIsLoadingAssignments(false);
    }
  }

  async function handleCreateUserProgramAssignment() {
    const tenantId = sessionStorage.getItem("tenant_id");
    const trimmedUserId = assignmentUserId.trim();

    if (!tenantId) {
      setMessage("Organization session missing.");
      return;
    }

    if (!trimmedUserId) {
      setMessage("Enter a user ID before assigning program access.");
      return;
    }

    if (!assignmentProgramId) {
      setMessage("Select a program before assigning program access.");
      return;
    }

    try {
      setIsAssigningUserProgram(true);
      setMessage(null);

      await createUserProgramAssignment({
        tenant_id: tenantId,
        user_id: trimmedUserId,
        program_id: assignmentProgramId,
      });

      setAssignmentProgramId("");
      setLookupUserId(trimmedUserId);
      setMessage("User assigned to program successfully.");

      await refreshLoadedAssignments(trimmedUserId);
    } catch (error) {
      console.error("User program assignment failed:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "User program assignment failed.",
      );
    } finally {
      setIsAssigningUserProgram(false);
    }
  }

  async function handleRevokeUserProgramAssignment(
    assignment: UserProgramAssignmentRecord,
  ) {
    const confirmed = window.confirm(
      "Revoke this user's access to the selected program?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActiveAssignmentId(assignment.id);
      setMessage(null);

      await revokeUserProgramAssignment(assignment.id);

      setMessage("User program access revoked successfully.");
      await refreshLoadedAssignments(assignment.user_id);
    } catch (error) {
      console.error("User program revoke failed:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "User program revoke failed.",
      );
    } finally {
      setActiveAssignmentId(null);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadAdminData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAdminData]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading admin tools...
      </main>
    );
  }

  return (
    <AppShell activeNav="admin">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Admin Tools",
          },
        ]}
        eyebrow="Administration"
        title="Admin Hub"
        description={`Manage system setup, program access, standards, and cleanup tasks for ${tenantName}.`}
      />

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Programs"
          value={programs.length}
          helperText="Programs available in this organization."
        />

        <WorkspaceStatCard
          label="Active Programs"
          value={activePrograms.length}
          helperText="Programs currently available for assignment."
        />

        <WorkspaceStatCard
          label="Unassigned Documents"
          value={unassignedDocuments.length}
          helperText="Documents that still need program ownership."
        />

        <WorkspaceStatCard
          label="Loaded User Access"
          value={userAssignments.length}
          helperText="Assignments loaded for the selected user."
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkspaceSectionCard
            title="Admin Areas"
            description="Use these tools to manage the controlled setup areas of the platform."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <WorkspaceActionCard
                title="Standards Admin"
                description="Add standards, manage clause outlines, and assign standards to programs."
                href="/admin/standards"
              />

              <WorkspaceActionCard
                title="Program Access"
                description="Grant or remove a user's access to specific programs."
                href="#program-access"
              />

              <WorkspaceActionCard
                title="Document Assignment"
                description="Assign unscoped documents to the correct program."
                href="#document-assignment"
              />

              <WorkspaceActionCard
                title="User and Role Admin"
                description="Coming later with role-based permissions and account management."
                disabled
              />
            </div>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Admin Guidance"
          description="These actions affect what users can see and how records are controlled."
        >
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Standards and clause outlines should be maintained by authorized
              administrators only.
            </p>

            <p>
              Program access controls which records a user can view as program
              visibility expands.
            </p>

            <p>
              Unassigned documents should be reviewed and placed under the
              correct program as soon as possible.
            </p>
          </div>
        </WorkspaceSectionCard>
      </section>

      <div id="program-access" className="mt-8">
        <WorkspaceSectionCard
          title="Program Access"
          description="Assign users to programs so they can see records connected to those programs."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                User ID
              </span>

              <input
                value={lookupUserId}
                onChange={(event) => {
                  setLookupUserId(event.target.value);
                  setAssignmentUserId(event.target.value);
                }}
                placeholder="Paste user ID"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <p className="mt-1 text-xs text-slate-500">
                User search and friendly names will be added later.
              </p>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void handleLoadUserAssignments()}
                disabled={isLoadingAssignments}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoadingAssignments ? "Loading..." : "Load Access"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Program
              </span>

              <select
                value={assignmentProgramId}
                onChange={(event) => setAssignmentProgramId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select program</option>

                {activePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {getProgramLabel(program)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void handleCreateUserProgramAssignment()}
                disabled={isAssigningUserProgram}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isAssigningUserProgram ? "Assigning..." : "Grant Access"}
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Loaded User Access
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Current program access for the selected user.
                </p>
              </div>

              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                Assignments: {userAssignments.length}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Program</th>
                    <th className="px-4 py-3 font-semibold">Assigned</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {userAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6">
                        <WorkspaceEmptyState
                          title="No program access loaded"
                          description="Enter a user ID and load access to see that user's program assignments."
                        />
                      </td>
                    </tr>
                  ) : (
                    userAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-4 py-3 font-medium text-slate-950">
                          {getProgramLabelById(
                            assignment.program_id,
                            programsById,
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {new Date(assignment.created_at).toLocaleString()}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              void handleRevokeUserProgramAssignment(assignment)
                            }
                            disabled={activeAssignmentId === assignment.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {activeAssignmentId === assignment.id
                              ? "Revoking..."
                              : "Revoke Access"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </WorkspaceSectionCard>
      </div>

      <div id="document-assignment" className="mt-8">
        <WorkspaceSectionCard
          title="Document Assignment"
          description="Assign documents without a program to the correct program so they can be governed properly."
        >
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Document Number</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {unassignedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6">
                      <WorkspaceEmptyState
                        title="No unassigned documents"
                        description="All documents currently have a program assignment."
                      />
                    </td>
                  </tr>
                ) : (
                  unassignedDocuments.map((document) => (
                    <tr key={document.id}>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {document.document_number}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {document.title}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {document.document_type}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={selectedProgramByDocument[document.id] ?? ""}
                          onChange={(event) =>
                            setSelectedProgramByDocument((current) => ({
                              ...current,
                              [document.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select program</option>

                          {activePrograms.map((program) => (
                            <option key={program.id} value={program.id}>
                              {getProgramLabel(program)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleAssignProgram(document.id)}
                          disabled={activeDocumentId === document.id}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {activeDocumentId === document.id
                            ? "Assigning..."
                            : "Assign"}
                        </button>
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
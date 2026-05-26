"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ProgramWorkspaceNav } from "@/components/workspace/ProgramWorkspaceNav";
import { WorkspaceActionCard } from "@/components/workspace/WorkspaceActionCard";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import { WorkspaceStatusBadge } from "@/components/workspace/WorkspaceStatusBadge";
import {
  getCdrlsForProgram,
  getProgram,
  getProgramStandardMappings,
} from "@/lib/api";
import type { ProgramRecord } from "@/types/program";

type ProgramWorkspacePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

function programLabel(program: ProgramRecord): string {
  return program.code ? `${program.code} - ${program.name}` : program.name;
}

export default function ProgramWorkspacePage({
  params,
}: ProgramWorkspacePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [assignedStandardCount, setAssignedStandardCount] = useState(0);
  const [cdrlCount, setCdrlCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgramWorkspace = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const [programRecord, standardsResponse, cdrlResponse] =
        await Promise.all([
          getProgram(resolvedParams.id),
          getProgramStandardMappings(resolvedParams.id),
          getCdrlsForProgram(resolvedParams.id),
        ]);

      setProgram(programRecord);
      setAssignedStandardCount(standardsResponse.items.length);
      setCdrlCount(cdrlResponse.items.length);
    } catch (error) {
      console.error("Program workspace fetch failed:", error);
      router.replace("/programs");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadProgramWorkspace(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProgramWorkspace]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading program workspace...
      </main>
    );
  }

  if (!program) {
    return (
      <AppShell activeNav="programs">
        <WorkspaceEmptyState
          title="Program could not be loaded"
          description="Return to the program registry and try opening the program again."
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
          },
        ]}
        eyebrow="Program Workspace"
        title={program.name}
        description={`Program Code: ${
          program.code ?? "Not assigned"
        } | Start Date: ${formatDate(program.start_date)} | End Date: ${formatDate(
          program.end_date,
        )}

${program.description ?? "No program description provided."}`}
        action={{
          label: "Back to Programs",
          href: "/programs",
        }}
      />

      <div className="mb-6">
        <WorkspaceStatusBadge status={program.status} />
      </div>

      <ProgramWorkspaceNav programId={program.id} activeTab="overview" />

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Assigned Standards"
          value={assignedStandardCount}
          helperText="Standards that apply to this program."
        />

        <WorkspaceStatCard
          label="CDRLs / Deliverables"
          value={cdrlCount}
          helperText="Contract deliverables being tracked."
        />

        <WorkspaceStatCard
          label="Controlled Documents"
          value="Coming Soon"
          helperText="Documents linked to this program."
        />

        <WorkspaceStatCard
          label="Audit Readiness"
          value="Planned"
          helperText="Readiness scoring will be added later."
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkspaceSectionCard
            title="Program Overview"
            description="This workspace is the central place for managing standards, deliverables, documents, reviews, and audit readiness for this program."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <WorkspaceActionCard
                title="Assigned Standards"
                description="Review standards that apply to this program."
                href={`/programs/${program.id}/standards`}
              />

              <WorkspaceActionCard
                title="CDRLs / Deliverables"
                description="Manage contract deliverables and clause traceability."
                href={`/programs/${program.id}/cdrls`}
              />

              <WorkspaceActionCard
                title="Controlled Documents"
                description="Link program documents to deliverables and clauses later."
                disabled
              />

              <WorkspaceActionCard
                title="Audit Readiness"
                description="View missing evidence, open reviews, and readiness indicators later."
                disabled
              />
            </div>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard title="Quick Actions">
          <div className="space-y-3">
            <WorkspaceActionCard
              title="View Standards"
              description="Review standards assigned to this program."
              href={`/programs/${program.id}/standards`}
            />

            <WorkspaceActionCard
              title="Create CDRL / Deliverable"
              description="Add a contractual deliverable."
              href={`/programs/${program.id}/cdrls`}
            />

            <WorkspaceActionCard
              title="Upload Document"
              description="Coming later with document linkage."
              disabled
            />

            <WorkspaceActionCard
              title="View Audit Readiness"
              description="Coming later with readiness scoring."
              disabled
            />
          </div>
        </WorkspaceSectionCard>
      </section>
    </AppShell>
  );
}
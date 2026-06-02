"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSectionCard } from "@/components/workspace/WorkspaceSectionCard";
import { WorkspaceStatCard } from "@/components/workspace/WorkspaceStatCard";
import {
  getAuditEventsForTenant,
  getDocumentRevisions,
  getDocuments,
} from "@/lib/api";
import type { AuditEventRecord } from "@/types/auditEvent";
import type { DocumentRecord } from "@/types/document";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type AuditDisplayRecord = {
  event: AuditEventRecord;
  documentId: string | null;
  documentNumber: string;
  documentTitle: string;
  revisionLabel: string | null;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAction(value: string): string {
  return value.replaceAll("_", " ");
}

function getEntityLabel(value: string): string {
  if (value === "document") {
    return "Document";
  }

  if (value === "document_revision") {
    return "Revision";
  }

  if (value === "document_approval") {
    return "Approval";
  }

  return value;
}

function getActionBadgeClass(action: string): string {
  if (action.includes("approved") || action.includes("effective")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (action.includes("rejected") || action.includes("obsolete")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (action.includes("submitted") || action.includes("assigned")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (action.includes("created")) {
    return "border-slate-900 bg-slate-900 text-white";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getStringMetadataValue(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];

  if (typeof value === "string") {
    return value;
  }

  return null;
}

function isOnOrAfterDate(value: string, startDate: string): boolean {
  if (!startDate) {
    return true;
  }

  const eventDate = new Date(value);
  const filterDate = new Date(startDate);

  eventDate.setHours(0, 0, 0, 0);
  filterDate.setHours(0, 0, 0, 0);

  return eventDate >= filterDate;
}

function isOnOrBeforeDate(value: string, endDate: string): boolean {
  if (!endDate) {
    return true;
  }

  const eventDate = new Date(value);
  const filterDate = new Date(endDate);

  eventDate.setHours(0, 0, 0, 0);
  filterDate.setHours(0, 0, 0, 0);

  return eventDate <= filterDate;
}

function buildAuditDisplayRecords(
  events: AuditEventRecord[],
  documents: DocumentRecord[],
  revisionsByDocument: Record<string, DocumentRevisionRecord[]>,
): AuditDisplayRecord[] {
  const documentsById = new Map<string, DocumentRecord>();
  const revisionsById = new Map<string, DocumentRevisionRecord>();

  documents.forEach((document) => {
    documentsById.set(document.id, document);
  });

  Object.values(revisionsByDocument)
    .flat()
    .forEach((revision) => {
      revisionsById.set(revision.id, revision);
    });

  return events.map((event) => {
    let documentId: string | null = null;
    let revisionLabel: string | null = null;

    if (event.entity_type === "document") {
      documentId = event.entity_id;
    }

    if (event.entity_type === "document_revision") {
      const revision = revisionsById.get(event.entity_id);
      documentId =
        revision?.document_id ??
        getStringMetadataValue(event.metadata_json, "document_id");
      revisionLabel = revision?.revision_label ?? null;
    }

    if (event.entity_type === "document_approval") {
      const revisionId =
        getStringMetadataValue(event.metadata_json, "document_revision_id") ??
        null;

      if (revisionId) {
        const revision = revisionsById.get(revisionId);
        documentId =
          revision?.document_id ??
          getStringMetadataValue(event.metadata_json, "document_id");
        revisionLabel = revision?.revision_label ?? null;
      } else {
        documentId = getStringMetadataValue(event.metadata_json, "document_id");
      }
    }

    const document = documentId ? documentsById.get(documentId) : undefined;

    return {
      event,
      documentId,
      documentNumber: document?.document_number ?? "Unknown document",
      documentTitle: document?.title ?? "Document details unavailable",
      revisionLabel,
    };
  });
}

export default function AuditEventsPage() {
  const router = useRouter();

  const [auditRecords, setAuditRecords] = useState<AuditDisplayRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown organization");
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const loadAuditEvents = useCallback(async () => {
    const tenantId = sessionStorage.getItem("tenant_id");
    const userId = sessionStorage.getItem("user_id");

    if (!tenantId || !userId) {
      router.replace("/login");
      return;
    }

    try {
      const [auditResponse, documentResponse] = await Promise.all([
        getAuditEventsForTenant(tenantId, 250, 0),
        getDocuments(),
      ]);

      const revisionEntries = await Promise.all(
        documentResponse.items.map(async (document) => {
          try {
            const revisions = await getDocumentRevisions(document.id);
            return [document.id, revisions.items] as const;
          } catch (error) {
            console.error(
              `Failed to fetch revisions for document ${document.id}:`,
              error,
            );
            return [document.id, []] as const;
          }
        }),
      );

      const revisionsByDocument = Object.fromEntries(revisionEntries);

      setAuditRecords(
        buildAuditDisplayRecords(
          auditResponse.items,
          documentResponse.items,
          revisionsByDocument,
        ),
      );
      setTenantName(sessionStorage.getItem("tenant_name") ?? tenantId);
    } catch (error) {
      console.error("Audit events page fetch failed:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const entityOptions = useMemo(() => {
    return Array.from(
      new Set(auditRecords.map((record) => record.event.entity_type)),
    )
      .filter(Boolean)
      .sort();
  }, [auditRecords]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(auditRecords.map((record) => record.event.action)))
      .filter(Boolean)
      .sort();
  }, [auditRecords]);

  const actorOptions = useMemo(() => {
    return Array.from(
      new Set(
        auditRecords.map(
          (record) => record.event.actor_user_id ?? "System / Not assigned",
        ),
      ),
    )
      .filter(Boolean)
      .sort();
  }, [auditRecords]);

  const filteredAuditRecords = useMemo(() => {
    const query = normalize(searchText);

    return auditRecords.filter((record) => {
      const actor = record.event.actor_user_id ?? "System / Not assigned";

      const searchableText = [
        record.documentNumber,
        record.documentTitle,
        record.revisionLabel ?? "",
        record.event.action,
        getEntityLabel(record.event.entity_type),
        record.event.summary,
        actor,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query.length === 0 || searchableText.includes(query);

      const matchesEntity =
        entityFilter === "all" || record.event.entity_type === entityFilter;

      const matchesAction =
        actionFilter === "all" || record.event.action === actionFilter;

      const matchesActor = actorFilter === "all" || actor === actorFilter;

      const matchesStartDate = isOnOrAfterDate(
        record.event.created_at,
        startDateFilter,
      );

      const matchesEndDate = isOnOrBeforeDate(
        record.event.created_at,
        endDateFilter,
      );

      return (
        matchesSearch &&
        matchesEntity &&
        matchesAction &&
        matchesActor &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    actionFilter,
    actorFilter,
    auditRecords,
    endDateFilter,
    entityFilter,
    searchText,
    startDateFilter,
  ]);

  const documentEventCount = useMemo(() => {
    return auditRecords.filter((record) => record.event.entity_type === "document")
      .length;
  }, [auditRecords]);

  const revisionEventCount = useMemo(() => {
    return auditRecords.filter(
      (record) => record.event.entity_type === "document_revision",
    ).length;
  }, [auditRecords]);

  const approvalEventCount = useMemo(() => {
    return auditRecords.filter(
      (record) => record.event.entity_type === "document_approval",
    ).length;
  }, [auditRecords]);

  function clearFilters() {
    setSearchText("");
    setEntityFilter("all");
    setActionFilter("all");
    setActorFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadAuditEvents(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAuditEvents]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading audit trail...
      </main>
    );
  }

  return (
    <AppShell activeNav="audit-events">
      <WorkspacePageHeader
        breadcrumbs={[
          {
            label: "Audit Trail",
          },
        ]}
        eyebrow="Compliance Evidence"
        title="Audit Trail"
        description={`Searchable event history tied to controlled documents, revisions, and approvals for ${tenantName}.`}
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <WorkspaceStatCard
          label="Total Events"
          value={auditRecords.length}
          helperText="Audit events loaded for this organization."
        />

        <WorkspaceStatCard
          label="Document Events"
          value={documentEventCount}
          helperText="Events tied directly to documents."
        />

        <WorkspaceStatCard
          label="Revision Events"
          value={revisionEventCount}
          helperText="Events tied to document revisions."
        />

        <WorkspaceStatCard
          label="Approval Events"
          value={approvalEventCount}
          helperText="Events tied to approval workflow."
        />
      </section>

      <div className="mt-8">
        <WorkspaceSectionCard
          title="Recent Audit Events"
          description="Newest events appear first. Each event links back to its controlled document record when available."
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Search
              </span>

              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search document, revision, action, summary, or actor"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Record Type
              </span>

              <select
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All record types</option>

                {entityOptions.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {getEntityLabel(entityType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Action
              </span>

              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All actions</option>

                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {formatAction(action)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Actor
              </span>

              <select
                value={actorFilter}
                onChange={(event) => setActorFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All actors</option>

                {actorOptions.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Start Date
              </span>

              <input
                type="date"
                value={startDateFilter}
                onChange={(event) => setStartDateFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                End Date
              </span>

              <input
                type="date"
                value={endDateFilter}
                onChange={(event) => setEndDateFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:w-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Showing {filteredAuditRecords.length} of {auditRecords.length} audit
            events.
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold">Summary</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredAuditRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6">
                      <WorkspaceEmptyState
                        title="No audit events found"
                        description="Adjust the filters to see more audit history."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredAuditRecords.map((record) => (
                    <tr key={record.event.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDateTime(record.event.created_at)}
                      </td>

                      <td className="max-w-sm px-4 py-3">
                        {record.documentId ? (
                          <Link
                            href={`/documents/${record.documentId}`}
                            className="font-semibold text-slate-950 hover:underline"
                          >
                            {record.documentNumber}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-950">
                            {record.documentNumber}
                          </span>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          {record.documentTitle}
                        </p>

                        {record.revisionLabel ? (
                          <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            Revision {record.revisionLabel}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getActionBadgeClass(
                              record.event.action,
                            )}`}
                          >
                            {formatAction(record.event.action)}
                          </span>

                          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {getEntityLabel(record.event.entity_type)}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-xl px-4 py-3 text-slate-700">
                        {record.event.summary}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">
                        {record.event.actor_user_id ?? "System / Not assigned"}
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
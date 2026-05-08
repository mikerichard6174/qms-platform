import type { AuditEventRecord } from "@/types/auditEvent";

type AuditEventTimelineProps = {
  title: string;
  description?: string;
  events: AuditEventRecord[];
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatAction(action: string): string {
  return action.replaceAll("_", " ");
}

function getActionBadgeClass(action: string): string {
  if (action.includes("approved") || action.includes("effective")) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (action.includes("rejected") || action.includes("obsolete")) {
    return "bg-red-50 text-red-700";
  }

  if (action.includes("submitted") || action.includes("assigned")) {
    return "bg-blue-50 text-blue-700";
  }

  if (action.includes("created")) {
    return "bg-slate-900 text-white";
  }

  return "bg-slate-100 text-slate-700";
}

function getEntityLabel(entityType: string): string {
  if (entityType === "document") {
    return "Document";
  }

  if (entityType === "document_revision") {
    return "Revision";
  }

  if (entityType === "document_approval") {
    return "Approval";
  }

  return entityType;
}

function getReadableDetail(event: AuditEventRecord): string {
  const metadataDocumentNumber = event.metadata_json?.document_number;
  const metadataRevisionLabel = event.metadata_json?.revision_label;

  if (typeof metadataDocumentNumber === "string") {
    return `Document ${metadataDocumentNumber}`;
  }

  if (typeof metadataRevisionLabel === "string") {
    return `Revision ${metadataRevisionLabel}`;
  }

  if (event.entity_type === "document") {
    return "Document record event";
  }

  if (event.entity_type === "document_revision") {
    return "Revision workflow event";
  }

  if (event.entity_type === "document_approval") {
    return "Approval workflow event";
  }

  return "QMS audit event";
}

function getChangedFields(event: AuditEventRecord): string[] {
  const oldValues = event.old_values_json ?? {};
  const newValues = event.new_values_json ?? {};

  const oldKeys = Object.keys(oldValues);
  const newKeys = Object.keys(newValues);

  return Array.from(new Set([...oldKeys, ...newKeys]));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "Updated";
}

export function AuditEventTimeline({
  title,
  description,
  events,
}: AuditEventTimelineProps) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>

          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>

        <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Events: {events.length}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
          No audit events found.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const changedFields = getChangedFields(event);

            return (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getActionBadgeClass(
                          event.action,
                        )}`}
                      >
                        {formatAction(event.action)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {getEntityLabel(event.entity_type)}
                      </span>
                    </div>

                    <p className="mt-3 font-medium text-slate-950">
                      {event.summary}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {getReadableDetail(event)}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <p className="font-medium text-slate-700">
                      {formatDateTime(event.created_at)}
                    </p>
                    <p className="mt-1">
                      Actor: {event.actor_user_id ?? "System / Not assigned"}
                    </p>
                  </div>
                </div>

                {changedFields.length > 0 ? (
                  <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                      View changed fields
                    </summary>

                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Field</th>
                            <th className="px-3 py-2 font-semibold">Before</th>
                            <th className="px-3 py-2 font-semibold">After</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {changedFields.map((field) => (
                            <tr key={field}>
                              <td className="px-3 py-2 font-medium text-slate-950">
                                {field.replaceAll("_", " ")}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {formatValue(event.old_values_json?.[field])}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {formatValue(event.new_values_json?.[field])}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                ) : (
                  <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                    No field-level changes were recorded for this event.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
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

function formatJsonValue(value: Record<string, unknown> | null): string {
  if (!value) {
    return "None";
  }

  return JSON.stringify(value, null, 2);
}

export function AuditEventTimeline({
  title,
  description,
  events,
}: AuditEventTimelineProps) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
          No audit events found.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                      {formatAction(event.action)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {event.entity_type}
                    </span>
                  </div>

                  <p className="mt-3 font-medium text-slate-950">
                    {event.summary}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Actor: {event.actor_user_id ?? "System / Not assigned yet"}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>{formatDateTime(event.created_at)}</p>
                  <p className="mt-1">Entity: {event.entity_id}</p>
                </div>
              </div>

              <details className="mt-4 rounded-lg bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                  View event details
                </summary>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-600">
                      Old Values
                    </p>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                      {formatJsonValue(event.old_values_json)}
                    </pre>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-600">
                      New Values
                    </p>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                      {formatJsonValue(event.new_values_json)}
                    </pre>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-600">
                      Metadata
                    </p>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                      {formatJsonValue(event.metadata_json)}
                    </pre>
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
import { AppShell } from "@/components/layout/AppShell";
import { getAuditEvents, getAuditEventsForTenant } from "@/lib/api";

const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? "";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatJson(value: Record<string, unknown> | null): string {
  if (!value) {
    return "None";
  }

  return JSON.stringify(value, null, 2);
}

export default async function AuditEventsPage() {
  let auditEvents: Awaited<ReturnType<typeof getAuditEvents>>["items"] = [];
  let total = 0;
  let errorMessage: string | null = null;

  try {
    const response = DEFAULT_TENANT_ID
      ? await getAuditEventsForTenant(DEFAULT_TENANT_ID, 100, 0)
      : await getAuditEvents(100, 0);

    auditEvents = response.items;
    total = response.total;
  } catch (error) {
    console.error("Audit events page fetch failed:", error);
    errorMessage = "Unable to load audit events from the backend.";
  }

  return (
    <AppShell activeNav="audit-events">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Compliance Evidence
          </p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            Audit Trail
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Read-only event history for controlled document and revision
            workflow actions.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Showing: {total}
        </div>
      </header>

      {DEFAULT_TENANT_ID ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Tenant filter active: {DEFAULT_TENANT_ID}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No default tenant ID is configured in the frontend environment. This
          page is currently showing the global MVP audit event list.
        </div>
      )}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-950">
              Recent Audit Events
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Newest events appear first. The table is intentionally read-only
              to preserve audit evidence integrity.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Summary</th>
                  <th className="px-4 py-3 font-semibold">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {auditEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  auditEvents.map((event) => (
                    <tr key={event.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDateTime(event.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {event.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium text-slate-950">
                          {event.entity_type}
                        </div>
                        <div className="mt-1 break-all text-xs text-slate-500">
                          {event.entity_id}
                        </div>
                      </td>
                      <td className="max-w-md px-4 py-3 text-slate-700">
                        {event.summary}
                      </td>
                      <td className="px-4 py-3">
                        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                            View JSON
                          </summary>
                          <div className="mt-3 space-y-3">
                            <div>
                              <p className="mb-1 text-xs font-semibold text-slate-600">
                                Old Values
                              </p>
                              <pre className="max-h-40 overflow-auto rounded bg-white p-3 text-xs text-slate-700">
                                {formatJson(event.old_values_json)}
                              </pre>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold text-slate-600">
                                New Values
                              </p>
                              <pre className="max-h-40 overflow-auto rounded bg-white p-3 text-xs text-slate-700">
                                {formatJson(event.new_values_json)}
                              </pre>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold text-slate-600">
                                Metadata
                              </p>
                              <pre className="max-h-40 overflow-auto rounded bg-white p-3 text-xs text-slate-700">
                                {formatJson(event.metadata_json)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
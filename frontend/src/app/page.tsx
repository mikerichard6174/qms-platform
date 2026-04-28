import { getDocuments } from "@/lib/api";

export default async function Home() {
  let documentCount = 0;
  let documents: Awaited<ReturnType<typeof getDocuments>>["items"] = [];
  let backendStatus = "Connected";
  let backendStatusClass =
    "border-emerald-200 bg-emerald-50 text-emerald-700";

  try {
    const documentResponse = await getDocuments();
    documentCount = documentResponse.total;
    documents = documentResponse.items;
  } catch {
    backendStatus = "Backend unavailable";
    backendStatusClass = "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-white p-6">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              QMS Platform
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Quality Control Hub
            </h1>
          </div>

          <nav className="space-y-2">
            <a className="block rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white">
              Dashboard
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Documents
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Revisions
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Approvals
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Standards
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              NCR / CAPA
            </a>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Document Control MVP
              </p>
              <h2 className="mt-1 text-3xl font-bold text-slate-950">
                QMS Dashboard
              </h2>
            </div>

            <div
              className={`rounded-full border px-4 py-2 text-sm font-medium ${backendStatusClass}`}
            >
              Backend: {backendStatus}
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Controlled Documents
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {documentCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Documents tracked in the QMS.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Revisions in Review
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">0</p>
              <p className="mt-2 text-sm text-slate-500">
                Drafts currently waiting for approval.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Effective Revisions
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">0</p>
              <p className="mt-2 text-sm text-slate-500">
                Active controlled revisions.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Controlled Documents
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Live data pulled from your FastAPI backend.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Document #</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Current Revision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {documents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No documents found.
                      </td>
                    </tr>
                  ) : (
                    documents.map((document) => (
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
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {document.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {document.current_revision_id ? "Assigned" : "None"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
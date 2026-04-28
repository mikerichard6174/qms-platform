import Link from "next/link";

import { getDocuments } from "@/lib/api";

export default async function DocumentsPage() {
  let documents: Awaited<ReturnType<typeof getDocuments>>["items"] = [];
  let total = 0;
  let errorMessage: string | null = null;

  try {
    const response = await getDocuments();
    documents = response.items;
    total = response.total;
  } catch (error) {
    console.error("Documents page fetch failed:", error);
    errorMessage = "Unable to load documents from the backend.";
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
            <Link
              href="/"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <Link
              href="/documents"
              className="block rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Documents
            </Link>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-400">
              Revisions
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-400">
              Approvals
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-400">
              Standards
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-400">
              NCR / CAPA
            </a>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Document Control
              </p>
              <h2 className="mt-1 text-3xl font-bold text-slate-950">
                Controlled Documents
              </h2>
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Total: {total}
            </div>
          </header>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {errorMessage}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-950">
                  Document Register
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This page shows the controlled document master records currently
                  tracked by the QMS.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Document #</th>
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Controlled</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {documents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No controlled documents found.
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
                          <td className="px-4 py-3 text-slate-700">
                            {document.is_controlled ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/documents/${document.id}`}
                              className="text-sm font-medium text-slate-950 hover:underline"
                            >
                              View detail
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
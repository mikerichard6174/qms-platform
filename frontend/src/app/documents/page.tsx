"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CreateDocumentForm } from "@/components/documents/CreateDocumentForm";
import { AppShell } from "@/components/layout/AppShell";
import { getDocuments } from "@/lib/api";
import type { DocumentRecord } from "@/types/document";

export default function DocumentsPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [tenantName, setTenantName] = useState("Unknown tenant");
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    const tenant = sessionStorage.getItem("tenant_id");
    const user = sessionStorage.getItem("user_id");

    if (!tenant || !user) {
      router.replace("/login");
      return;
    }

    try {
      const response = await getDocuments();
      setDocuments(response.items);
      setTenantName(sessionStorage.getItem("tenant_name") ?? tenant);
    } catch (error) {
      console.error("Documents page fetch failed:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDocuments]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading documents...
      </main>
    );
  }

  return (
    <AppShell activeNav="documents">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Document Control
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            Controlled Documents
          </h2>

          <p className="mt-2 text-sm text-slate-500">Tenant: {tenantName}</p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Total: {documents.length}
        </div>
      </header>

      <CreateDocumentForm onChanged={loadDocuments} />

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
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
                      <Link
                        href={`/documents/${document.id}`}
                        className="hover:underline"
                      >
                        {document.document_number}
                      </Link>
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
    </AppShell>
  );
}
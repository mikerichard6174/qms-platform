"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createDocumentRevision } from "@/lib/api";

type CreateRevisionFormProps = {
  documentId: string;
  tenantId: string;
};

export function CreateRevisionForm({
  documentId,
  tenantId,
}: CreateRevisionFormProps) {
  const router = useRouter();

  const [revisionLabel, setRevisionLabel] = useState("");
  const [revisionNumber, setRevisionNumber] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await createDocumentRevision({
        document_id: documentId,
        tenant_id: tenantId,
        revision_label: revisionLabel,
        revision_number: revisionNumber ? Number(revisionNumber) : null,
        change_summary: changeSummary || null,
        file_id: null,
        status: "draft",
        is_current: false,
        is_effective: false,
        effective_date: null,
        obsolete_date: null,
        approved_by_user_id: null,
        created_by_user_id: null,
        updated_by_user_id: null,
      });

      setRevisionLabel("");
      setRevisionNumber("");
      setChangeSummary("");
      setMessage("Revision created successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Revision creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-950">Create Revision</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a new draft revision for this document.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Revision Label
          </span>
          <input
            value={revisionLabel}
            onChange={(event) => setRevisionLabel(event.target.value)}
            required
            placeholder="B"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Revision Number
          </span>
          <input
            value={revisionNumber}
            onChange={(event) => setRevisionNumber(event.target.value)}
            type="number"
            min="0"
            placeholder="2"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block md:col-span-3">
          <span className="text-sm font-medium text-slate-700">
            Change Summary
          </span>
          <textarea
            value={changeSummary}
            onChange={(event) => setChangeSummary(event.target.value)}
            rows={3}
            placeholder="Describe what changed in this revision."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Creating..." : "Create Revision"}
        </button>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
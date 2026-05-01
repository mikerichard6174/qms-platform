"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createDocument } from "@/lib/api";

type CreateDocumentFormProps = {
  defaultTenantId: string;
};

export function CreateDocumentForm({ defaultTenantId }: CreateDocumentFormProps) {
  const router = useRouter();

  const [tenantId, setTenantId] = useState(defaultTenantId);
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("procedure");
  const [isControlled, setIsControlled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await createDocument({
        tenant_id: tenantId,
        program_id: null,
        document_number: documentNumber,
        title,
        document_type: documentType,
        owner_user_id: null,
        status: "draft",
        is_controlled: isControlled,
        review_due_date: null,
        metadata_json: null,
        created_by_user_id: null,
        updated_by_user_id: null,
      });

      setDocumentNumber("");
      setTitle("");
      setDocumentType("procedure");
      setIsControlled(true);
      setMessage("Document created successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-950">Create Document</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a new controlled document master record.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tenant ID</span>
          <input
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Document Number
          </span>
          <input
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            required
            placeholder="QMS-002"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Example Procedure"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Type</span>
          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="manual">Manual</option>
            <option value="procedure">Procedure</option>
            <option value="work_instruction">Work Instruction</option>
            <option value="form">Form</option>
            <option value="template">Template</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pt-6 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isControlled}
            onChange={(event) => setIsControlled(event.target.checked)}
          />
          Controlled document
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Creating..." : "Create Document"}
        </button>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
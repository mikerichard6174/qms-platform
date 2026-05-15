"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { createDocument, getPrograms } from "@/lib/api";
import type { DocumentRecord } from "@/types/document";
import type { ProgramRecord } from "@/types/program";

type CreateDocumentFormProps = {
  onChanged?: () => Promise<void> | void;
};

export function CreateDocumentForm({ onChanged }: CreateDocumentFormProps) {
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("procedure");
  const [isControlled, setIsControlled] = useState(true);
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [createdDocument, setCreatedDocument] = useState<DocumentRecord | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  const trimmedDocumentNumber = documentNumber.trim();
  const trimmedTitle = title.trim();

  const canSubmit =
    selectedProgramId.length > 0 &&
    trimmedDocumentNumber.length > 0 &&
    trimmedTitle.length > 0 &&
    documentType.trim().length > 0 &&
    !isSubmitting;

  useEffect(() => {
    async function loadPrograms() {
      try {
        setIsLoadingPrograms(true);
        const response = await getPrograms();
        setPrograms(response.items.filter((program) => program.status === "active"));
      } catch (error) {
        console.error("Failed to load programs for document form:", error);
        setMessage("Unable to load programs. Create or assign a program first.");
      } finally {
        setIsLoadingPrograms(false);
      }
    }

    if (isExpanded) {
      void loadPrograms();
    }
  }, [isExpanded]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const tenantId = sessionStorage.getItem("tenant_id");

    if (!tenantId) {
      setMessage("You must be logged in before creating a document.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setCreatedDocument(null);

    try {
      const document = await createDocument({
        tenant_id: tenantId,
        program_id: selectedProgramId,
        document_number: trimmedDocumentNumber.toUpperCase(),
        title: trimmedTitle,
        document_type: documentType,
        owner_user_id: null,
        status: "draft",
        is_controlled: isControlled,
        review_due_date: reviewDueDate || null,
        metadata_json: null,
        created_by_user_id: null,
        updated_by_user_id: null,
      });

      setSelectedProgramId("");
      setDocumentNumber("");
      setTitle("");
      setDocumentType("procedure");
      setIsControlled(true);
      setReviewDueDate("");
      setIsExpanded(false);
      setCreatedDocument(document);
      setMessage("Document created successfully.");

      await onChanged?.();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Document creation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-950">
            Create Controlled Document
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Create the document master record under an assigned program, then
            add revision evidence from the document workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsExpanded((current) => !current);
            setMessage(null);
            setCreatedDocument(null);
          }}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {isExpanded ? "Close Form" : "New Document"}
        </button>
      </div>

      {createdDocument ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Document created: {createdDocument.document_number}
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            Open the document workspace to add revisions, approvals, and audit
            evidence.
          </p>

          <Link
            href={`/documents/${createdDocument.id}`}
            className="mt-3 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Open Document Workspace
          </Link>
        </div>
      ) : null}

      {isExpanded ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">Document control guidance</p>
            <p className="mt-1">
              New documents must be assigned to a program. Users will only see
              documents for programs they are assigned to.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Program <span className="text-red-600">*</span>
              </span>

              <select
                value={selectedProgramId}
                onChange={(event) => setSelectedProgramId(event.target.value)}
                required
                disabled={isLoadingPrograms}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {isLoadingPrograms
                    ? "Loading programs..."
                    : "Select a program"}
                </option>

                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.code ? `${program.code} - ${program.name}` : program.name}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-slate-500">
                Required. This controls document visibility by program access.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Document Number <span className="text-red-600">*</span>
              </span>

              <input
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                required
                placeholder="QMS-002"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
              />

              <p className="mt-1 text-xs text-slate-500">
                Required. Must be unique within the tenant.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Type <span className="text-red-600">*</span>
              </span>

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

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Title <span className="text-red-600">*</span>
              </span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Example Procedure"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <p className="mt-1 text-xs text-slate-500">
                Use the controlled document title, not the file name.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Review Due Date
              </span>

              <input
                value={reviewDueDate}
                onChange={(event) => setReviewDueDate(event.target.value)}
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <p className="mt-1 text-xs text-slate-500">
                Optional. This can be used later for periodic review tracking.
              </p>
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Creating..." : "Create Document"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedProgramId("");
                setDocumentNumber("");
                setTitle("");
                setDocumentType("procedure");
                setIsControlled(true);
                setReviewDueDate("");
                setMessage(null);
              }}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              Clear
            </button>

            {message ? (
              <p className="text-sm text-slate-600">{message}</p>
            ) : null}
          </div>
        </form>
      ) : message && !createdDocument ? (
        <p className="mt-4 text-sm text-slate-600">{message}</p>
      ) : null}
    </section>
  );
}
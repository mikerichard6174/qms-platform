"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createDocumentApproval } from "@/lib/api";

type CreateApprovalFormProps = {
  revisionId: string;
  tenantId: string;
  defaultApproverUserId: string;
};

export function CreateApprovalForm({
  revisionId,
  tenantId,
  defaultApproverUserId,
}: CreateApprovalFormProps) {
  const router = useRouter();

  const [approverUserId, setApproverUserId] = useState(defaultApproverUserId);
  const [comment, setComment] = useState("Approval assigned from UI.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await createDocumentApproval({
        document_revision_id: revisionId,
        tenant_id: tenantId,
        approver_user_id: approverUserId,
        approval_type: "approval",
        status: "pending",
        comment: comment || null,
      });

      setComment("Approval assigned from UI.");
      setMessage("Approval assigned successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approval creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h5 className="text-sm font-semibold text-slate-950">
          Assign Approval
        </h5>
        <p className="mt-1 text-xs text-slate-500">
          Assign an approver to this revision.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">
            Approver User ID
          </span>
          <input
            value={approverUserId}
            onChange={(event) => setApproverUserId(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">Comment</span>
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Assigning..." : "Assign Approval"}
        </button>

        {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
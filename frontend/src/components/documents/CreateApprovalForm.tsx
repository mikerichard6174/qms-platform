"use client";

import { FormEvent, useState } from "react";

import { createDocumentApproval } from "@/lib/api";

type CreateApprovalFormProps = {
  revisionId: string;
  tenantId: string;
  defaultApproverUserId: string;
  revisionStatus?: string;
  existingApprovalCount?: number;
  onChanged?: () => Promise<void> | void;
};

export function CreateApprovalForm({
  revisionId,
  tenantId,
  defaultApproverUserId,
  revisionStatus = "draft",
  existingApprovalCount = 0,
  onChanged,
}: CreateApprovalFormProps) {
  const [approverUserId, setApproverUserId] = useState(defaultApproverUserId);
  const [comment, setComment] = useState("Approval assigned from UI.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canAssignApproval =
    revisionStatus === "draft" &&
    approverUserId.trim().length > 0 &&
    !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAssignApproval) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await createDocumentApproval({
        document_revision_id: revisionId,
        tenant_id: tenantId,
        approver_user_id: approverUserId.trim(),
        approval_type: "approval",
        status: "pending",
        comment: comment.trim() || null,
      });

      setComment("Approval assigned from UI.");
      setMessage("Approval assigned successfully.");

      await onChanged?.();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Approval creation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="mb-3">
        <h5 className="text-sm font-semibold text-slate-950">
          Assign Approval
        </h5>

        <p className="mt-1 text-xs text-slate-500">
          Approvals can be assigned while the revision is still in draft.
        </p>
      </div>

      {revisionStatus !== "draft" ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Approval assignment is locked because this revision is already{" "}
          <span className="font-semibold">{revisionStatus}</span>.
        </div>
      ) : null}

      {existingApprovalCount > 0 ? (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
          Existing approvals assigned: {existingApprovalCount}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">
            Approver User ID
          </span>
          <input
            value={approverUserId}
            onChange={(event) => setApproverUserId(event.target.value)}
            required
            disabled={revisionStatus !== "draft"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">Comment</span>
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={revisionStatus !== "draft"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={!canAssignApproval}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Assigning..." : "Assign Approval"}
        </button>

        {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
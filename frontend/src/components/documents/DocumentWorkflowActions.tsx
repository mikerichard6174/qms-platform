"use client";

import { useState } from "react";

import {
  approveDocumentApproval,
  makeRevisionEffective,
  rejectDocumentApproval,
  submitRevisionForReview,
} from "@/lib/api";
import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type DocumentWorkflowActionsProps = {
  revision: DocumentRevisionRecord;
  approvals: DocumentApprovalRecord[];
  onChanged?: () => Promise<void> | void;
};

export function DocumentWorkflowActions({
  revision,
  approvals,
  onChanged,
}: DocumentWorkflowActionsProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending",
  );

  const approvedApprovals = approvals.filter(
    (approval) => approval.status === "approved",
  );

  const rejectedApprovals = approvals.filter(
    (approval) => approval.status === "rejected",
  );

  const canSubmitForReview =
    revision.status === "draft" && approvals.length > 0 && !isWorking;

  const canMakeEffective =
    revision.status === "approved" &&
    approvals.length > 0 &&
    pendingApprovals.length === 0 &&
    rejectedApprovals.length === 0 &&
    !revision.is_effective &&
    !isWorking;

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setIsWorking(true);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      await onChanged?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Workflow action failed.";
      setMessage(errorMessage);
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-slate-950">
            Workflow Actions
          </h5>

          <p className="mt-1 text-xs text-slate-500">
            Actions unlock as the revision moves through draft, review,
            approval, and effective states.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Approved {approvedApprovals.length} / {approvals.length}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canSubmitForReview}
          onClick={() =>
            runAction(
              () => submitRevisionForReview(revision.id),
              "Revision submitted for review.",
            )
          }
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Submit for Review
        </button>

        <button
          type="button"
          disabled={!canMakeEffective}
          onClick={() =>
            runAction(
              () => makeRevisionEffective(revision.id),
              "Revision marked effective.",
            )
          }
          className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Make Effective
        </button>
      </div>

      <div className="mt-3 space-y-2 text-xs text-slate-500">
        {revision.status === "draft" && approvals.length === 0 ? (
          <p>Assign at least one approval before submitting for review.</p>
        ) : null}

        {revision.status === "draft" && approvals.length > 0 ? (
          <p>This draft is ready to submit for review.</p>
        ) : null}

        {revision.status === "in_review" && pendingApprovals.length > 0 ? (
          <p>
            Waiting on {pendingApprovals.length} pending approval
            {pendingApprovals.length === 1 ? "" : "s"}.
          </p>
        ) : null}

        {revision.status === "approved" && !revision.is_effective ? (
          <p>This revision is approved and ready to be made effective.</p>
        ) : null}

        {revision.is_effective ? (
          <p>This revision is already effective.</p>
        ) : null}

        {rejectedApprovals.length > 0 ? (
          <p>This revision has rejected approval records and cannot be made effective.</p>
        ) : null}
      </div>

      {pendingApprovals.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pending Approvals
          </p>

          <div className="space-y-2">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-950">
                    Approver: {approval.approver_user_id}
                  </p>

                  <p className="text-xs text-slate-500">
                    Type: {approval.approval_type}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isWorking || revision.status !== "in_review"}
                    onClick={() =>
                      runAction(
                        () =>
                          approveDocumentApproval(
                            approval.id,
                            "Approved from document detail UI.",
                          ),
                        "Approval marked approved.",
                      )
                    }
                    className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={isWorking || revision.status !== "in_review"}
                    onClick={() =>
                      runAction(
                        () =>
                          rejectDocumentApproval(
                            approval.id,
                            "Rejected from document detail UI.",
                          ),
                        "Approval marked rejected.",
                      )
                    }
                    className="rounded-lg bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {revision.status !== "in_review" ? (
            <p className="mt-2 text-xs text-slate-500">
              Approval decisions unlock after the revision is submitted for
              review.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No pending approvals for this revision.
        </p>
      )}

      {message ? (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {message}
        </div>
      ) : null}
    </div>
  );
}
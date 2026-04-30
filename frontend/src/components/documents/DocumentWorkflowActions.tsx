"use client";

import { useRouter } from "next/navigation";
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
};

export function DocumentWorkflowActions({
  revision,
  approvals,
}: DocumentWorkflowActionsProps) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending",
  );

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setIsWorking(true);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      router.refresh();
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
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h5 className="text-sm font-semibold text-slate-950">
            Workflow Actions
          </h5>
          <p className="mt-1 text-xs text-slate-500">
            Available actions are based on the current revision and approval state.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isWorking || revision.status !== "draft"}
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
          disabled={isWorking || revision.status !== "approved"}
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
                    disabled={isWorking}
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
                    disabled={isWorking}
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
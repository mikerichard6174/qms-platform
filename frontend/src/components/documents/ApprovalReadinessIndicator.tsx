import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type ApprovalReadinessIndicatorProps = {
  revision: DocumentRevisionRecord;
  approval: DocumentApprovalRecord;
};

function getIndicatorState(
  revision: DocumentRevisionRecord,
  approval: DocumentApprovalRecord,
) {
  if (approval.status === "approved") {
    return {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (approval.status === "rejected") {
    return {
      label: "Rejected",
      className: "bg-red-50 text-red-700",
    };
  }

  if (
    approval.status === "pending" &&
    revision.status === "in_review"
  ) {
    return {
      label: "Action Required",
      className: "bg-amber-50 text-amber-800",
    };
  }

  if (
    approval.status === "pending" &&
    revision.status === "draft"
  ) {
    return {
      label: "Waiting for Submission",
      className: "bg-slate-100 text-slate-700",
    };
  }

  return {
    label: "Workflow State",
    className: "bg-slate-100 text-slate-700",
  };
}

export function ApprovalReadinessIndicator({
  revision,
  approval,
}: ApprovalReadinessIndicatorProps) {
  const indicator = getIndicatorState(revision, approval);

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${indicator.className}`}
    >
      {indicator.label}
    </span>
  );
}
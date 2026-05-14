import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type RevisionWorkflowGuidanceProps = {
  revision: DocumentRevisionRecord;
  approvals: DocumentApprovalRecord[];
};

function getGuidance(revision: DocumentRevisionRecord, approvals: DocumentApprovalRecord[]) {
  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending",
  );

  const rejectedApprovals = approvals.filter(
    (approval) => approval.status === "rejected",
  );

  if (revision.is_effective) {
    return {
      title: "Released for use",
      message:
        "This revision is effective and is the controlled version currently available for use.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (rejectedApprovals.length > 0 || revision.status === "rejected") {
    return {
      title: "Revision rejected",
      message:
        "This revision has been rejected. A new revision or corrective update should be created before release.",
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }

  if (revision.status === "approved") {
    return {
      title: "Ready to make effective",
      message:
        "All required approvals are complete. This revision can now be made effective.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (revision.status === "in_review" && pendingApprovals.length > 0) {
    return {
      title: "Waiting on reviewer action",
      message: `This revision is in review and has ${pendingApprovals.length} pending approval${
        pendingApprovals.length === 1 ? "" : "s"
      }.`,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  if (revision.status === "draft" && approvals.length > 0) {
    return {
      title: "Ready to submit for review",
      message:
        "At least one approval has been assigned. Submit this revision when it is ready for formal review.",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  if (revision.status === "draft") {
    return {
      title: "Approval assignment needed",
      message:
        "Assign at least one approver before submitting this draft revision for review.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  return {
    title: "Workflow status",
    message:
      "Review the revision status, approval records, and workflow actions to determine the next step.",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

export function RevisionWorkflowGuidance({
  revision,
  approvals,
}: RevisionWorkflowGuidanceProps) {
  const guidance = getGuidance(revision, approvals);

  return (
    <div className={`mt-4 rounded-xl border p-4 ${guidance.className}`}>
      <p className="text-sm font-semibold">{guidance.title}</p>

      <p className="mt-1 text-sm">{guidance.message}</p>
    </div>
  );
}
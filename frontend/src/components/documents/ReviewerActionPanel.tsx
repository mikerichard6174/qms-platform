import type { DocumentApprovalRecord } from "@/types/documentApproval";
import type { DocumentRevisionRecord } from "@/types/documentRevision";

type ReviewerActionPanelProps = {
  revisions: DocumentRevisionRecord[];
  approvalsByRevision: Record<string, DocumentApprovalRecord[]>;
};

type ReviewerActionItem = {
  revision: DocumentRevisionRecord;
  pendingApprovals: DocumentApprovalRecord[];
};

function getReviewerActionItems(
  revisions: DocumentRevisionRecord[],
  approvalsByRevision: Record<string, DocumentApprovalRecord[]>,
): ReviewerActionItem[] {
  return revisions
    .map((revision) => {
      const pendingApprovals = (approvalsByRevision[revision.id] ?? []).filter(
        (approval) => approval.status === "pending",
      );

      return {
        revision,
        pendingApprovals,
      };
    })
    .filter(
      (item) =>
        item.revision.status === "in_review" &&
        item.pendingApprovals.length > 0,
    );
}

export function ReviewerActionPanel({
  revisions,
  approvalsByRevision,
}: ReviewerActionPanelProps) {
  const actionItems = getReviewerActionItems(revisions, approvalsByRevision);

  return (
    <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">
            Reviewer Workflow
          </p>

          <h3 className="mt-1 text-xl font-bold text-slate-950">
            Reviewer Action Needed
          </h3>

          <p className="mt-2 text-sm text-blue-800">
            Use this panel to quickly find revisions that are actively waiting
            on approval decisions.
          </p>
        </div>

        <div className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700">
          Open actions: {actionItems.length}
        </div>
      </div>

      {actionItems.length === 0 ? (
        <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 text-sm text-slate-600">
          No reviewer actions are currently waiting. Revisions will appear here
          after they are submitted for review and still have pending approvals.
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {actionItems.map((item) => (
            <a
              key={item.revision.id}
              href={`#revision-${item.revision.id}`}
              className="block rounded-xl border border-blue-200 bg-white p-4 hover:bg-slate-50"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-slate-950">
                    Revision {item.revision.revision_label}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.revision.change_summary ??
                      "No change summary provided."}
                  </p>
                </div>

                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Pending approvals: {item.pendingApprovals.length}
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {item.pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  >
                    Approver:{" "}
                    <span className="font-semibold text-slate-950">
                      {approval.approver_user_id}
                    </span>{" "}
                    | Type: {approval.approval_type}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs font-medium text-blue-700">
                Jump to revision workflow actions →
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
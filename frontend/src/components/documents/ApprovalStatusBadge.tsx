type ApprovalStatusBadgeProps = {
  status: string;
};

function getApprovalStatusClass(status: string): string {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700";
  }

  if (status === "pending") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${getApprovalStatusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}